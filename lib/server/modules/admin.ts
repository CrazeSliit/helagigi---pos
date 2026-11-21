import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { hashSecret } from "../auth";
import { audit, db, nextNumber, tx } from "../db";
import { crud } from "../crud";
import { badRequest, conflict, forbidden, notFound, paged, pageArgs, route, type Ctx, type Route } from "../http";
import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from "../permissions";
import { branchFilter, canAccessBranch, dateRange, requireBranch, zDate, zId, zPositiveMoney, zQty, zText } from "../scope";

const who = (c: Ctx, branchId?: string | null) => ({ userId: c.auth.userId, branchId: branchId ?? c.auth.branchId, ip: c.ip });
const safeUser = { id: true, name: true, email: true, username: true, phone: true, color: true, active: true, allBranches: true, commissionRate: true, lastLoginAt: true, createdAt: true, role: { select: { id: true, name: true } }, branches: { select: { branch: { select: { id: true, name: true } } } } } as const;

const staffSchema = z.object({
  name: zText(120).min(1), email: z.string().trim().toLowerCase().email().max(160).nullish(), username: zText(40).toLowerCase().nullish(), phone: zText(30).nullish(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  roleId: zId, branchIds: z.array(zId).default([]), allBranches: z.boolean().default(false), commissionRate: z.coerce.number().min(0).max(100).default(0), active: z.boolean().default(true),
  password: z.string().min(10).max(128).optional(), pin: z.string().regex(/^\d{4,6}$/).optional(),
});

/** Nobody can hand out access they don't hold, and only the Owner can touch Owner accounts. */
async function guardRole(c: Ctx, roleId: string | undefined) {
  if (!roleId) return;
  const r = await db.role.findUnique({ where: { id: roleId } });
  if (!r) throw notFound("Role");
  if (c.auth.role === "Owner") return;
  if (r.name === "Owner" || r.permissions.some((p) => !c.auth.permissions.has(p as Permission))) throw forbidden("You cannot assign a role with more access than your own");
}

function s3() {
  const { AWS_ENDPOINT_URL_S3: endpoint, AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey, AWS_REGION: region } = process.env;
  if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("S3 storage is not configured");
  return new S3Client({ endpoint, region: region ?? "ap-southeast-1", forcePathStyle: true, credentials: { accessKeyId, secretAccessKey }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
}
const UPLOAD_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
const MAX_UPLOAD = 10 * 1024 * 1024;

export const adminRoutes: Route[] = [
  // Branches & terminals
  ...crud({ path: "/branches", model: "branch", entity: "Branch", write: "settings.manage", softDelete: true, search: ["name", "code"], include: { terminals: { where: { active: true }, select: { id: true, name: true, lastSeenAt: true } } },
    schema: z.object({ code: zText(6).min(2).regex(/^[A-Za-z0-9]+$/).toUpperCase(), name: zText(80).min(1), address: zText(300).nullish(), phone: zText(30).nullish(), active: z.boolean().default(true) }) }),
  ...crud({ path: "/terminals", model: "terminal", entity: "Terminal", write: "settings.manage", softDelete: true, include: { branch: { select: { id: true, name: true } } },
    schema: z.object({ branchId: zId, name: zText(60).min(1), active: z.boolean().default(true) }) }),
  route("POST", "/terminals/:id/heartbeat", {}, async ({ auth, params }) => {
    const { count } = await db.terminal.updateMany({ where: { id: params.id, ...(auth.allBranches ? {} : { branchId: { in: auth.branchIds } }) }, data: { lastSeenAt: new Date() } });
    if (!count) throw notFound("Terminal");
    return { at: new Date() };
  }),

  // Staff
  route("GET", "/staff", { perm: ["staff.manage", "reports.view", "shift.approve"] }, async ({ query: q }) => {
    const p = pageArgs(q), s = q.get("q")?.trim();
    const where: Prisma.UserWhereInput = { ...(q.get("includeInactive") === "true" ? {} : { active: true }), ...(s ? { OR: [{ name: { contains: s, mode: "insensitive" } }, { email: { contains: s, mode: "insensitive" } }, { phone: { contains: s } }] } : {}) };
    const [rows, total] = await Promise.all([db.user.findMany({ where, select: safeUser, orderBy: { name: "asc" }, skip: p.skip, take: p.take }), db.user.count({ where })]);
    return paged(rows, total, p);
  }),
  route("GET", "/staff/:id", { perm: ["staff.manage", "reports.view"] }, async ({ params }) => {
    const u = await db.user.findUnique({ where: { id: params.id }, select: safeUser });
    if (!u) throw notFound("Staff member");
    return u;
  }),
  route("POST", "/staff", { perm: "staff.manage" }, async (c) => {
    const { password, pin, branchIds, ...d } = await c.body(staffSchema);
    await guardRole(c, d.roleId);
    if (d.allBranches && !c.auth.allBranches) throw forbidden("You cannot grant all-branch access");
    const u = await db.user.create({ data: { ...d, passwordHash: password ? await hashSecret(password) : null, pinHash: pin ? await hashSecret(pin) : null, branches: { create: branchIds.map((branchId) => ({ branchId })) } }, select: safeUser });
    await audit(db, who(c), "staff.create", "User", u.id, { name: u.name, role: u.role.name });
    return u;
  }),
  route("PATCH", "/staff/:id", { perm: "staff.manage" }, async (c) => {
    const target = await db.user.findUnique({ where: { id: c.params.id }, include: { role: true } });
    if (!target) throw notFound("Staff member");
    if (target.role.name === "Owner" && c.auth.role !== "Owner") throw forbidden("Only the Owner can change this account");
    const { password, pin, branchIds, ...d } = await c.patch(staffSchema);
    await guardRole(c, d.roleId);
    if (d.allBranches && !c.auth.allBranches) throw forbidden("You cannot grant all-branch access");
    if (target.id === c.auth.userId && (d.active === false || (d.roleId && d.roleId !== target.roleId))) throw conflict("You cannot deactivate or change the role of your own account");
    const u = await tx(async (t) => {
      if (branchIds) { await t.userBranch.deleteMany({ where: { userId: target.id } }); await t.userBranch.createMany({ data: branchIds.map((branchId) => ({ userId: target.id, branchId })) }); }
      const row = await t.user.update({ where: { id: target.id }, data: { ...d, ...(password ? { passwordHash: await hashSecret(password) } : {}), ...(pin ? { pinHash: await hashSecret(pin), failedLogins: 0, lockedUntil: null } : {}) }, select: safeUser });
      // Changed access or credentials take effect immediately.
      if (password || d.active === false || d.roleId) await t.session.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: new Date() } });
      await audit(t, who(c), "staff.update", "User", target.id, { fields: Object.keys(d), passwordChanged: !!password, pinChanged: !!pin });
      return row;
    });
    return u;
  }),
  route("GET", "/roles", { perm: ["staff.manage", "audit.view"] }, async () => ({ roles: await db.role.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { users: true } } } }), permissions: PERMISSIONS })),
  route("POST", "/roles", { perm: "staff.manage" }, async (c) => {
    const b = await c.body(z.object({ name: zText(40).min(2), permissions: z.array(z.enum(ALL_PERMISSIONS as [Permission, ...Permission[]])) }));
    if (c.auth.role !== "Owner" && b.permissions.some((p) => !c.auth.permissions.has(p))) throw forbidden("You cannot grant access you don't have");
    const r = await db.role.create({ data: b });
    await audit(db, who(c), "role.create", "Role", r.id, b);
    return r;
  }),
  route("PATCH", "/roles/:id", { perm: "staff.manage" }, async (c) => {
    const r = await db.role.findUnique({ where: { id: c.params.id } });
    if (!r) throw notFound("Role");
    if (r.name === "Owner") throw conflict("The Owner role always has full access");
    const b = await c.body(z.object({ name: zText(40).min(2).optional(), permissions: z.array(z.enum(ALL_PERMISSIONS as [Permission, ...Permission[]])).optional() }));
    if (r.system && b.name && b.name !== r.name) throw conflict("Built-in roles can't be renamed");
    if (c.auth.role !== "Owner" && b.permissions?.some((p) => !c.auth.permissions.has(p))) throw forbidden("You cannot grant access you don't have");
    const out = await db.role.update({ where: { id: r.id }, data: b });
    await audit(db, who(c), "role.update", "Role", r.id, { before: r.permissions, after: out.permissions });
    return out;
  }),
  route("DELETE", "/roles/:id", { perm: "staff.manage" }, async (c) => {
    const r = await db.role.findUnique({ where: { id: c.params.id }, include: { _count: { select: { users: true } } } });
    if (!r) throw notFound("Role");
    if (r.system) throw conflict("Built-in roles can't be deleted");
    if (r._count.users) throw conflict("Move staff off this role first");
    await db.role.delete({ where: { id: r.id } });
    await audit(db, who(c), "role.delete", "Role", r.id, { name: r.name });
    return { deleted: true };
  }),

  // Attendance
  route("POST", "/attendance/clock-in", {}, async (c) => {
    const branchId = requireBranch(c.auth);
    if (await db.attendance.findFirst({ where: { userId: c.auth.userId, clockOut: null } })) throw conflict("You are already clocked in");
    return db.attendance.create({ data: { userId: c.auth.userId, branchId } });
  }),
  route("POST", "/attendance/clock-out", {}, async (c) => {
    const a = await db.attendance.findFirst({ where: { userId: c.auth.userId, clockOut: null }, orderBy: { clockIn: "desc" } });
    if (!a) throw conflict("You are not clocked in");
    return db.attendance.update({ where: { id: a.id }, data: { clockOut: new Date() } });
  }),
  route("GET", "/attendance", { perm: ["staff.manage", "reports.view"] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), r = dateRange(q, 7);
    const where: Prisma.AttendanceWhereInput = { clockIn: { gte: r.from, lt: r.to }, ...(branchId ? { branchId } : {}), ...(q.get("userId") ? { userId: q.get("userId")! } : {}) };
    const [rows, total] = await Promise.all([db.attendance.findMany({ where, orderBy: { clockIn: "desc" }, skip: p.skip, take: p.take, include: { user: { select: { id: true, name: true } }, branch: { select: { name: true } } } }), db.attendance.count({ where })]);
    return paged(rows, total, p);
  }),

  // Expenses
  ...crud({ path: "/expense-categories", model: "expenseCategory", entity: "ExpenseCategory", read: ["expenses.record", "reports.view"], write: "expenses.record", softDelete: true,
    schema: z.object({ name: zText(60).min(1), budget: zPositiveMoney.nullish(), active: z.boolean().default(true) }) }),
  route("GET", "/expenses", { perm: ["expenses.record", "reports.view"] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), r = q.get("from") || q.get("to") ? dateRange(q) : null;
    const where: Prisma.ExpenseWhereInput = { ...(branchId ? { branchId } : {}), ...(r ? { spentAt: { gte: r.from, lt: r.to } } : {}), ...(q.get("categoryId") ? { categoryId: q.get("categoryId")! } : {}) };
    const [rows, total, sum] = await Promise.all([db.expense.findMany({ where, orderBy: { spentAt: "desc" }, skip: p.skip, take: p.take, include: { category: { select: { id: true, name: true } }, branch: { select: { name: true } } } }), db.expense.count({ where }), db.expense.aggregate({ where, _sum: { amount: true } })]);
    return { ...paged(rows, total, p), meta: { ...paged(rows, total, p).meta, sum: sum._sum.amount?.toNumber() ?? 0 } };
  }),
  route("POST", "/expenses", { perm: "expenses.record" }, async (c) => {
    const branchId = requireBranch(c.auth);
    const b = await c.body(z.object({ categoryId: zId, amount: zPositiveMoney, method: zText(30).default("Cash"), payee: zText(120).optional(), description: zText().optional(), receiptKey: zText(200).optional(), spentAt: zDate.optional() }));
    return tx(async (t) => {
      const e = await t.expense.create({ data: { ...b, branchId, number: await nextNumber(t, "EXP"), createdById: c.auth.userId } });
      await audit(t, who(c, branchId), "expense.create", "Expense", e.id, { amount: b.amount });
      return e;
    });
  }),
  route("DELETE", "/expenses/:id", { perm: "expenses.record" }, async (c) => {
    const e = await db.expense.findUnique({ where: { id: c.params.id } });
    if (!e || !canAccessBranch(c.auth, e.branchId)) throw notFound("Expense");
    await db.expense.delete({ where: { id: e.id } });
    await audit(db, who(c, e.branchId), "expense.delete", "Expense", e.id, { number: e.number, amount: e.amount.toNumber() });
    return { deleted: true };
  }),

  // Restaurant
  ...crud({ path: "/tables", model: "diningTable", entity: "DiningTable", write: "settings.manage", filter: (c) => ({ branchId: requireBranch(c.auth) }),
    transform: (d, c) => ({ ...d, branchId: requireBranch(c.auth) }),
    schema: z.object({ name: zText(30).min(1), area: zText(40).nullish(), seats: z.number().int().min(1).max(50).default(4), status: z.enum(["FREE", "OCCUPIED", "RESERVED", "CLEANING"]).default("FREE") }) }),
  route("PATCH", "/tables/:id/status", { perm: "sales.make" }, async (c) => {
    const { status } = await c.body(z.object({ status: z.enum(["FREE", "OCCUPIED", "RESERVED", "CLEANING"]) }));
    const { count } = await db.diningTable.updateMany({ where: { id: c.params.id, branchId: requireBranch(c.auth) }, data: { status } });
    if (!count) throw notFound("Table");
    return { id: c.params.id, status };
  }),
  route("GET", "/kots", {}, async ({ auth, query: q }) => {
    const status = q.get("status");
    return db.kot.findMany({ where: { branchId: requireBranch(auth), ...(status ? { status: status as Prisma.KotWhereInput["status"] } : { status: { in: ["NEW", "PREPARING", "READY"] } }) }, orderBy: { createdAt: "asc" }, take: 200, include: { items: true, table: { select: { id: true, name: true } } } });
  }),
  route("POST", "/kots", { perm: "sales.make" }, async (c) => {
    const branchId = requireBranch(c.auth);
    const b = await c.body(z.object({ tableId: zId.optional(), note: zText().optional(), items: z.array(z.object({ productId: zId, quantity: zQty, note: zText(200).optional() })).min(1).max(100) }));
    if (b.tableId && !(await db.diningTable.findFirst({ where: { id: b.tableId, branchId } }))) throw notFound("Table");
    const products = await db.product.findMany({ where: { id: { in: b.items.map((i) => i.productId) } }, select: { id: true, name: true } });
    const names = new Map(products.map((p) => [p.id, p.name]));
    if (b.items.some((i) => !names.has(i.productId))) throw badRequest("Some products are unavailable");
    return tx(async (t) => {
      const k = await t.kot.create({ data: { number: await nextNumber(t, "KOT"), branchId, tableId: b.tableId, note: b.note, createdById: c.auth.userId, items: { create: b.items.map((i) => ({ ...i, name: names.get(i.productId)! })) } }, include: { items: true } });
      if (b.tableId) await t.diningTable.update({ where: { id: b.tableId }, data: { status: "OCCUPIED" } });
      return k;
    });
  }),
  route("PATCH", "/kots/:id/status", {}, async (c) => {
    const { status } = await c.body(z.object({ status: z.enum(["NEW", "PREPARING", "READY", "SERVED", "CANCELLED"]) }));
    const { count } = await db.kot.updateMany({ where: { id: c.params.id, branchId: requireBranch(c.auth) }, data: { status } });
    if (!count) throw notFound("Kitchen order");
    return { id: c.params.id, status };
  }),

  // Notifications
  route("GET", "/notifications", {}, async ({ auth, query: q }) => {
    const p = pageArgs(q);
    const where: Prisma.NotificationWhereInput = {
      AND: [{ OR: [{ userId: auth.userId }, { userId: null }] }, auth.allBranches ? {} : { OR: [{ branchId: null }, { branchId: { in: auth.branchIds } }] }],
      ...(q.get("unread") === "true" ? { readAt: null } : {}),
    };
    const [rows, total, unread] = await Promise.all([db.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take }), db.notification.count({ where }), db.notification.count({ where: { ...where, readAt: null } })]);
    const out = paged(rows, total, p);
    return { ...out, meta: { ...out.meta, unread } };
  }),
  route("POST", "/notifications/read", {}, async (c) => {
    const { ids } = await c.body(z.object({ ids: z.array(zId).max(200).optional() }));
    const r = await db.notification.updateMany({ where: { readAt: null, OR: [{ userId: c.auth.userId }, { userId: null }], ...(ids ? { id: { in: ids } } : {}), ...(c.auth.allBranches ? {} : { AND: [{ OR: [{ branchId: null }, { branchId: { in: c.auth.branchIds } }] }] }) }, data: { readAt: new Date() } });
    return { updated: r.count };
  }),

  // Settings & audit
  route("GET", "/settings", {}, async () => Object.fromEntries((await db.setting.findMany()).map((s) => [s.key, s.value]))),
  route("PUT", "/settings/:key", { perm: "settings.manage" }, async (c) => {
    if (!/^[a-z0-9_.-]{1,60}$/i.test(c.params.key)) throw badRequest("Invalid setting key");
    const { value } = await c.body(z.object({ value: z.json() }));
    if (value === null) throw badRequest("Value is required");
    const s = await db.setting.upsert({ where: { key: c.params.key }, create: { key: c.params.key, value: value as Prisma.InputJsonValue }, update: { value: value as Prisma.InputJsonValue } });
    await audit(db, who(c), "settings.update", "Setting", s.key);
    return s;
  }),
  route("GET", "/audit", { perm: "audit.view" }, async ({ query: q }) => {
    const p = pageArgs(q), r = q.get("from") || q.get("to") ? dateRange(q) : null;
    const where: Prisma.AuditLogWhereInput = { ...(r ? { createdAt: { gte: r.from, lt: r.to } } : {}), ...(q.get("userId") ? { userId: q.get("userId")! } : {}), ...(q.get("entity") ? { entity: q.get("entity")! } : {}), ...(q.get("action") ? { action: { startsWith: q.get("action")! } } : {}) };
    const [rows, total] = await Promise.all([db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { user: { select: { id: true, name: true } } } }), db.auditLog.count({ where })]);
    return paged(rows, total, p);
  }),

  // Uploads: the browser sends files straight to storage with a short-lived URL.
  route("POST", "/uploads/presign", { perm: ["products.edit", "expenses.record", "settings.manage"] }, async (c) => {
    const b = await c.body(z.object({ contentType: z.string().refine((t) => t in UPLOAD_TYPES, "Only JPG, PNG, WebP and PDF are allowed"), size: z.number().int().positive().max(MAX_UPLOAD, "Files can be up to 10 MB"), purpose: z.enum(["product", "receipt", "logo", "import"]) }));
    const key = `${b.purpose}/${randomUUID()}.${UPLOAD_TYPES[b.contentType]}`;
    const url = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: b.contentType, ContentLength: b.size }), { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) });
    await db.upload.create({ data: { key, contentType: b.contentType, size: b.size, purpose: b.purpose, uploadedBy: c.auth.userId } });
    return { key, url, method: "PUT", headers: { "Content-Type": b.contentType }, expiresIn: 300 };
  }),
  route("GET", "/uploads/url", {}, async ({ query: q }) => {
    const key = q.get("key");
    if (!key || !(await db.upload.findUnique({ where: { key } }))) throw notFound("File");
    return { url: await getSignedUrl(s3(), new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }), { expiresIn: 600 }), expiresIn: 600 };
  }),
  route("DELETE", "/uploads", { perm: ["products.edit", "settings.manage"] }, async (c) => {
    const key = c.query.get("key");
    if (!key || !(await db.upload.findUnique({ where: { key } }))) throw notFound("File");
    await s3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    await db.upload.delete({ where: { key } });
    await audit(db, who(c), "upload.delete", "Upload", key);
    return { deleted: true };
  }),
];

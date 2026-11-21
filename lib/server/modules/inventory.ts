import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { audit, D, db, nextNumber, qty3, tx, ZERO } from "../db";
import { badRequest, conflict, forbidden, notFound, paged, pageArgs, route, type Ctx, type Route } from "../http";
import { branchFilter, canAccessBranch, dateRange, requireBranch, zId, zQty, zText } from "../scope";
import { moveStock } from "../stock";

const who = (c: Ctx, branchId?: string | null) => ({ userId: c.auth.userId, branchId: branchId ?? c.auth.branchId, ip: c.ip });
const REASONS = ["Damage", "Theft", "Correction", "Expired", "Internal use"] as const;

export const inventoryRoutes: Route[] = [
  route("GET", "/inventory", {}, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), s = q.get("q")?.trim(), state = q.get("state");
    const bf = branchId ? Prisma.sql`AND st."branchId" = ${branchId}` : Prisma.empty;
    const search = s ? Prisma.sql`AND (p.name ILIKE ${"%" + s + "%"} OR p.sku ILIKE ${"%" + s + "%"} OR p.barcode = ${s})` : Prisma.empty;
    const having = state === "out" ? Prisma.sql`WHERE quantity <= 0` : state === "low" ? Prisma.sql`WHERE quantity > 0 AND quantity < "reorderLevel"` : state === "in" ? Prisma.sql`WHERE quantity >= "reorderLevel" AND quantity > 0` : Prisma.empty;
    const showCost = auth.permissions.has("products.view_cost");
    const rows = await db.$queryRaw<{ id: string; total: number }[]>`
      WITH x AS (
        SELECT p.id, p.sku, p.name, p.cost, p.price, p."reorderLevel", c.name AS category, COALESCE(SUM(st.quantity), 0) AS quantity
        FROM "Product" p JOIN "Category" c ON c.id = p."categoryId" LEFT JOIN "Stock" st ON st."productId" = p.id ${bf}
        WHERE p.active AND p."trackStock" ${search} GROUP BY p.id, c.name
      )
      SELECT *, quantity::float8 AS quantity, cost::float8 AS cost, price::float8 AS price, "reorderLevel"::float8 AS "reorderLevel", COUNT(*) OVER()::int AS total
      FROM x ${having} ORDER BY name LIMIT ${p.take} OFFSET ${p.skip}`;
    const total = rows[0]?.total ?? 0;
    return paged(rows.map(({ total: _t, ...r }) => {
      const x = r as unknown as { quantity: number; reorderLevel: number; cost?: number };
      const out = { ...r, state: x.quantity <= 0 ? "out" : x.quantity < x.reorderLevel ? "low" : "in" } as Record<string, unknown>;
      if (!showCost) delete out.cost;
      return out;
    }), total, p);
  }),

  route("POST", "/inventory/adjust", { perm: "stock.adjust" }, async (c) => {
    const branchId = requireBranch(c.auth);
    const b = await c.body(z.object({ reason: z.enum(REASONS), note: zText().optional(), items: z.array(z.object({ productId: zId, delta: z.coerce.number().refine((n) => n !== 0, "Cannot be 0") })).min(1).max(200) }));
    return tx(async (t) => {
      const out = [];
      for (const i of b.items) {
        const p = await t.product.findUnique({ where: { id: i.productId } });
        if (!p) throw notFound("Product");
        const balance = await moveStock(t, { branchId, productId: p.id, delta: qty3(i.delta), type: "ADJUSTMENT", userId: c.auth.userId, reason: b.note ? `${b.reason}: ${b.note}` : b.reason, unitCost: p.cost, productName: p.name });
        out.push({ productId: p.id, balance });
      }
      await audit(t, who(c, branchId), "stock.adjust", "Stock", null, b);
      return out;
    });
  }),

  route("GET", "/inventory/movements", {}, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q);
    const range = q.get("from") || q.get("to") ? dateRange(q) : null;
    const where: Prisma.StockMovementWhereInput = {
      ...(branchId ? { branchId } : {}), ...(q.get("productId") ? { productId: q.get("productId")! } : {}),
      ...(q.get("type") ? { type: q.get("type") as Prisma.StockMovementWhereInput["type"] } : {}),
      ...(range ? { createdAt: { gte: range.from, lt: range.to } } : {}),
    };
    const [rows, total] = await Promise.all([
      db.stockMovement.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, omit: auth.permissions.has("products.view_cost") ? undefined : { unitCost: true }, include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } }),
      db.stockMovement.count({ where }),
    ]);
    return paged(rows, total, p);
  }),

  route("GET", "/inventory/batches", {}, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), days = Number(q.get("expiringInDays"));
    const where: Prisma.BatchWhereInput = { quantity: { gt: 0 }, ...(branchId ? { branchId } : {}), ...(days > 0 ? { expiresAt: { lte: new Date(Date.now() + days * 86_400_000) } } : {}) };
    const [rows, total] = await Promise.all([
      db.batch.findMany({ where, orderBy: { expiresAt: { sort: "asc", nulls: "last" } }, skip: p.skip, take: p.take, omit: auth.permissions.has("products.view_cost") ? undefined : { cost: true }, include: { product: { select: { name: true, sku: true } }, branch: { select: { name: true } } } }),
      db.batch.count({ where }),
    ]);
    return paged(rows, total, p);
  }),

  // Transfers: stock leaves on dispatch and arrives when the receiving branch confirms.
  route("GET", "/inventory/transfers", {}, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q);
    const where: Prisma.StockTransferWhereInput = branchId ? { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] } : {};
    const [rows, total] = await Promise.all([
      db.stockTransfer.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { fromBranch: { select: { name: true } }, toBranch: { select: { name: true } }, items: { include: { product: { select: { name: true, sku: true } } } } } }),
      db.stockTransfer.count({ where }),
    ]);
    return paged(rows, total, p);
  }),
  route("POST", "/inventory/transfers", { perm: "stock.transfer" }, async (c) => {
    const fromBranchId = requireBranch(c.auth);
    const b = await c.body(z.object({ toBranchId: zId, note: zText().optional(), items: z.array(z.object({ productId: zId, quantity: zQty })).min(1).max(200) }));
    if (b.toBranchId === fromBranchId) throw badRequest("Choose a different destination branch");
    if (new Set(b.items.map((i) => i.productId)).size !== b.items.length) throw badRequest("Each product can appear only once");
    return tx(async (t) => {
      const tr = await t.stockTransfer.create({ data: { number: await nextNumber(t, "TRF"), fromBranchId, toBranchId: b.toBranchId, note: b.note, createdById: c.auth.userId, items: { create: b.items } }, include: { items: true } });
      for (const i of b.items) await moveStock(t, { branchId: fromBranchId, productId: i.productId, delta: D(i.quantity).negated(), type: "TRANSFER_OUT", userId: c.auth.userId, refType: "StockTransfer", refId: tr.id });
      await audit(t, who(c, fromBranchId), "stock.transfer", "StockTransfer", tr.id, { number: tr.number, to: b.toBranchId });
      return tr;
    });
  }),
  route("POST", "/inventory/transfers/:id/receive", { perm: "stock.transfer" }, async (c) => tx(async (t) => {
    const tr = await t.stockTransfer.findUnique({ where: { id: c.params.id }, include: { items: true } });
    if (!tr) throw notFound("Transfer");
    if (!canAccessBranch(c.auth, tr.toBranchId)) throw forbidden("Only the receiving branch can confirm this");
    const { count } = await t.stockTransfer.updateMany({ where: { id: tr.id, status: "IN_TRANSIT" }, data: { status: "RECEIVED", receivedById: c.auth.userId, receivedAt: new Date() } });
    if (!count) throw conflict("Transfer is not in transit");
    for (const i of tr.items) await moveStock(t, { branchId: tr.toBranchId, productId: i.productId, delta: i.quantity, type: "TRANSFER_IN", userId: c.auth.userId, refType: "StockTransfer", refId: tr.id });
    await audit(t, who(c, tr.toBranchId), "stock.transfer_received", "StockTransfer", tr.id);
    return t.stockTransfer.findUnique({ where: { id: tr.id } });
  })),
  route("POST", "/inventory/transfers/:id/cancel", { perm: "stock.transfer" }, async (c) => tx(async (t) => {
    const tr = await t.stockTransfer.findUnique({ where: { id: c.params.id }, include: { items: true } });
    if (!tr || !canAccessBranch(c.auth, tr.fromBranchId)) throw notFound("Transfer");
    const { count } = await t.stockTransfer.updateMany({ where: { id: tr.id, status: "IN_TRANSIT" }, data: { status: "CANCELLED" } });
    if (!count) throw conflict("Transfer is not in transit");
    for (const i of tr.items) await moveStock(t, { branchId: tr.fromBranchId, productId: i.productId, delta: i.quantity, type: "TRANSFER_IN", userId: c.auth.userId, reason: "Transfer cancelled", refType: "StockTransfer", refId: tr.id });
    await audit(t, who(c, tr.fromBranchId), "stock.transfer_cancelled", "StockTransfer", tr.id);
    return t.stockTransfer.findUnique({ where: { id: tr.id } });
  })),

  // Stock takes
  route("GET", "/inventory/stock-takes", { perm: "stock.adjust" }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), where = branchId ? { branchId } : {};
    const [rows, total] = await Promise.all([db.stockTake.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { _count: { select: { items: true } } } }), db.stockTake.count({ where })]);
    return paged(rows, total, p);
  }),
  route("POST", "/inventory/stock-takes", { perm: "stock.adjust" }, async (c) => {
    const branchId = requireBranch(c.auth);
    const b = await c.body(z.object({ note: zText().optional(), categoryId: zId.optional() }));
    return tx(async (t) => {
      if (await t.stockTake.findFirst({ where: { branchId, status: "OPEN" } })) throw conflict("This branch already has an open stock take");
      const products = await t.product.findMany({ where: { active: true, trackStock: true, ...(b.categoryId ? { categoryId: b.categoryId } : {}) }, select: { id: true, stock: { where: { branchId }, select: { quantity: true } } } });
      return t.stockTake.create({ data: { number: await nextNumber(t, "STK"), branchId, note: b.note, createdById: c.auth.userId, items: { create: products.map((p) => ({ productId: p.id, expected: p.stock[0]?.quantity ?? ZERO })) } }, include: { _count: { select: { items: true } } } });
    });
  }),
  route("GET", "/inventory/stock-takes/:id", { perm: "stock.adjust" }, async ({ auth, params }) => {
    const s = await db.stockTake.findUnique({ where: { id: params.id }, include: { items: { include: { product: { select: { name: true, sku: true, barcode: true } } } } } });
    if (!s || !canAccessBranch(auth, s.branchId)) throw notFound("Stock take");
    return s;
  }),
  route("PATCH", "/inventory/stock-takes/:id/counts", { perm: "stock.adjust" }, async (c) => {
    const b = await c.body(z.object({ counts: z.array(z.object({ productId: zId, counted: z.coerce.number().min(0) })).min(1).max(1000) }));
    const s = await db.stockTake.findUnique({ where: { id: c.params.id } });
    if (!s || !canAccessBranch(c.auth, s.branchId)) throw notFound("Stock take");
    if (s.status !== "OPEN") throw conflict("Stock take is closed");
    await tx(async (t) => { for (const i of b.counts) await t.stockTakeItem.update({ where: { stockTakeId_productId: { stockTakeId: s.id, productId: i.productId } }, data: { counted: qty3(i.counted) } }); });
    return { saved: b.counts.length };
  }),
  route("POST", "/inventory/stock-takes/:id/post", { perm: "stock.adjust" }, async (c) => tx(async (t) => {
    const s = await t.stockTake.findUnique({ where: { id: c.params.id }, include: { items: true } });
    if (!s || !canAccessBranch(c.auth, s.branchId)) throw notFound("Stock take");
    const { count } = await t.stockTake.updateMany({ where: { id: s.id, status: "OPEN" }, data: { status: "POSTED", postedAt: new Date() } });
    if (!count) throw conflict("Stock take is closed");
    let adjusted = 0;
    for (const i of s.items) {
      if (i.counted == null) continue;
      // Compare with live stock so sales made during the count aren't overwritten.
      const cur = await t.stock.findUnique({ where: { branchId_productId: { branchId: s.branchId, productId: i.productId } } });
      const sold = i.expected.minus(cur?.quantity ?? ZERO);
      const delta = i.counted.minus(i.expected);
      if (delta.isZero()) continue;
      await moveStock(t, { branchId: s.branchId, productId: i.productId, delta, type: "STOCK_TAKE", userId: c.auth.userId, reason: `Count ${i.counted}, expected ${i.expected}${sold.isZero() ? "" : `, ${sold} moved during count`}`, refType: "StockTake", refId: s.id, allowNegative: true });
      adjusted++;
    }
    await audit(t, who(c, s.branchId), "stock.take_posted", "StockTake", s.id, { adjusted });
    return { id: s.id, status: "POSTED", adjusted };
  })),
];

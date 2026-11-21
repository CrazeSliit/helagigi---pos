import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import type { Auth } from "../auth";
import { audit, D, db, money, nextNumber, tx, ZERO, type Tx } from "../db";
import { conflict, forbidden, notFound, paged, pageArgs, route, type Route } from "../http";
import { branchFilter, canAccessBranch, requireBranch, zMoney, zPositiveMoney, zText } from "../scope";

/** X/Z figures for a shift. Payments are net of change, and refunds are negative. */
async function shiftSummary(t: Tx | typeof db, shiftId: string) {
  const s = await t.shift.findUniqueOrThrow({ where: { id: shiftId } });
  const [byMethod, moves, sales, returns] = await Promise.all([
    t.payment.groupBy({ by: ["method"], where: { shiftId }, _sum: { amount: true } }),
    t.cashMovement.groupBy({ by: ["type"], where: { shiftId }, _sum: { amount: true } }),
    t.sale.aggregate({ where: { shiftId, status: { not: "VOIDED" } }, _sum: { total: true, discount: true, tax: true }, _count: true }),
    t.saleReturn.aggregate({ where: { shiftId }, _sum: { total: true }, _count: true }),
  ]);
  const cashSales = byMethod.find((m) => m.method === "CASH")?._sum.amount ?? ZERO;
  const cashIn = moves.find((m) => m.type === "CASH_IN")?._sum.amount ?? ZERO;
  const cashOut = moves.find((m) => m.type === "CASH_OUT")?._sum.amount ?? ZERO;
  return {
    shift: s, payments: byMethod.map((m) => ({ method: m.method, amount: m._sum.amount ?? ZERO })),
    salesCount: sales._count, grossSales: sales._sum.total ?? ZERO, discounts: sales._sum.discount ?? ZERO, tax: sales._sum.tax ?? ZERO,
    returnsCount: returns._count, returnsTotal: returns._sum.total ?? ZERO,
    openingFloat: s.openingFloat, cashSales, cashIn, cashOut,
    expectedCash: money(s.openingFloat.plus(cashSales).plus(cashIn).minus(cashOut)),
  };
}

async function loadShift(a: Auth, id: string) {
  const s = await db.shift.findUnique({ where: { id } });
  if (!s || !canAccessBranch(a, s.branchId)) throw notFound("Shift");
  // Cashiers see their own shifts; supervisors see the branch.
  if (s.userId !== a.userId && !a.permissions.has("shift.approve") && !a.permissions.has("reports.view")) throw forbidden();
  return s;
}

const NOTE_VALUES = [5000, 2000, 1000, 500, 100, 50, 20, 10, 5, 2, 1] as const;

export const registerRoutes: Route[] = [
  route("GET", "/shifts/current", { perm: "shift.manage" }, async ({ auth }) => {
    const s = await db.shift.findFirst({ where: { userId: auth.userId, branchId: requireBranch(auth), status: "OPEN" } });
    return s ? shiftSummary(db, s.id) : null;
  }),
  route("POST", "/shifts/open", { perm: "shift.manage" }, async ({ auth, body, ip }) => {
    const branchId = requireBranch(auth);
    const b = await body(z.object({ openingFloat: zMoney, note: zText().optional() }));
    return tx(async (t) => {
      // Serialises concurrent opens for this cashier.
      await t.$queryRaw`SELECT id FROM "User" WHERE id = ${auth.userId} FOR UPDATE`;
      if (await t.shift.findFirst({ where: { userId: auth.userId, status: "OPEN" } })) throw conflict("You already have an open shift");
      if (auth.terminalId && await t.shift.findFirst({ where: { terminalId: auth.terminalId, status: "OPEN" } })) throw conflict("This terminal already has an open shift");
      const code = (await t.branch.findUniqueOrThrow({ where: { id: branchId } })).code;
      const s = await t.shift.create({ data: { number: await nextNumber(t, "SHF", code), branchId, terminalId: auth.terminalId, userId: auth.userId, openingFloat: b.openingFloat, note: b.note } });
      await audit(t, { userId: auth.userId, branchId, ip }, "shift.open", "Shift", s.id, { float: b.openingFloat });
      return s;
    });
  }),
  route("POST", "/shifts/:id/cash", { perm: "shift.cash" }, async ({ auth, params, body, ip }) => {
    const s = await loadShift(auth, params.id);
    if (s.userId !== auth.userId && !auth.permissions.has("shift.approve")) throw forbidden();
    const b = await body(z.object({ type: z.enum(["CASH_IN", "CASH_OUT"]), amount: zPositiveMoney, reason: zText(200).min(2) }));
    return tx(async (t) => {
      await t.$queryRaw`SELECT id FROM "Shift" WHERE id = ${s.id} FOR UPDATE`;
      const fresh = await t.shift.findUniqueOrThrow({ where: { id: s.id } });
      if (fresh.status !== "OPEN") throw conflict("Shift is closed");
      if (b.type === "CASH_OUT") {
        const sum = await shiftSummary(t, s.id);
        if (D(b.amount).gt(sum.expectedCash)) throw conflict("Not enough cash in the drawer", { expectedCash: sum.expectedCash });
      }
      const m = await t.cashMovement.create({ data: { shiftId: s.id, type: b.type, amount: b.amount, reason: b.reason, userId: auth.userId } });
      await audit(t, { userId: auth.userId, branchId: s.branchId, ip }, "shift.cash", "Shift", s.id, b);
      return m;
    });
  }),
  route("GET", "/shifts/:id/report", { perm: ["shift.manage", "reports.view"] }, async ({ auth, params }) => {
    const s = await loadShift(auth, params.id);
    const summary = await shiftSummary(db, s.id);
    return { type: s.status === "OPEN" ? "X" : "Z", ...summary };
  }),
  route("POST", "/shifts/:id/close", { perm: "shift.manage" }, async ({ auth, params, body, ip }) => {
    const s = await loadShift(auth, params.id);
    if (s.userId !== auth.userId && !auth.permissions.has("shift.approve")) throw forbidden();
    const b = await body(z.object({
      countedCash: zMoney.optional(), note: zText().optional(),
      denominations: z.record(z.string().refine((k) => (NOTE_VALUES as readonly number[]).includes(Number(k)), "Unknown denomination"), z.number().int().min(0)).optional(),
    }).refine((v) => v.countedCash != null || v.denominations, "Enter the counted cash"));
    const counted = b.denominations ? Object.entries(b.denominations).reduce((acc, [k, n]) => acc.plus(D(k).times(n)), ZERO) : D(b.countedCash!);
    return tx(async (t) => {
      await t.$queryRaw`SELECT id FROM "Shift" WHERE id = ${s.id} FOR UPDATE`;
      const fresh = await t.shift.findUniqueOrThrow({ where: { id: s.id } });
      if (fresh.status !== "OPEN") throw conflict("Shift is already closed");
      const sum = await shiftSummary(t, s.id);
      const variance = money(counted.minus(sum.expectedCash));
      const closed = await t.shift.update({
        where: { id: s.id },
        data: { status: variance.isZero() ? "APPROVED" : "CLOSED", expectedCash: sum.expectedCash, countedCash: counted, variance, denominations: b.denominations as Prisma.InputJsonValue | undefined, note: b.note ?? s.note, closedAt: new Date() },
      });
      if (!variance.isZero()) await t.notification.create({ data: { branchId: s.branchId, type: "Sales", tone: "warning", icon: "Wallet", message: `Shift ${s.number} closed Rs. ${variance.abs().toFixed(2)} ${variance.isNegative() ? "short" : "over"}`, link: "/register/history" } });
      await audit(t, { userId: auth.userId, branchId: s.branchId, ip }, "shift.close", "Shift", s.id, { expected: sum.expectedCash.toNumber(), counted: counted.toNumber(), variance: variance.toNumber() });
      return closed;
    });
  }),
  route("POST", "/shifts/:id/approve", { perm: "shift.approve" }, async ({ auth, params, ip }) => {
    const s = await loadShift(auth, params.id);
    if (s.userId === auth.userId && auth.role !== "Owner") throw forbidden("Someone else must approve your shift");
    const { count } = await db.shift.updateMany({ where: { id: s.id, status: "CLOSED" }, data: { status: "APPROVED", approvedById: auth.userId } });
    if (!count) throw conflict("Only closed shifts can be approved");
    await audit(db, { userId: auth.userId, branchId: s.branchId, ip }, "shift.approve", "Shift", s.id, { variance: s.variance?.toNumber() ?? 0 });
    return db.shift.findUnique({ where: { id: s.id } });
  }),
  route("GET", "/shifts", { perm: ["shift.manage", "reports.view"] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q);
    const supervisor = auth.permissions.has("shift.approve") || auth.permissions.has("reports.view");
    const where: Prisma.ShiftWhereInput = {
      ...(branchId ? { branchId } : auth.allBranches ? {} : { branchId: { in: auth.branchIds } }),
      ...(supervisor ? {} : { userId: auth.userId }),
      ...(q.get("status") ? { status: q.get("status") as Prisma.ShiftWhereInput["status"] } : {}),
    };
    const [rows, total] = await Promise.all([
      db.shift.findMany({ where, orderBy: { openedAt: "desc" }, skip: p.skip, take: p.take, include: { user: { select: { id: true, name: true } }, branch: { select: { name: true } }, terminal: { select: { name: true } } } }),
      db.shift.count({ where }),
    ]);
    return paged(rows, total, p);
  }),
];

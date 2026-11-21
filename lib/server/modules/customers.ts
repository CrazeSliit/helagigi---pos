import { randomBytes } from "node:crypto";
import { z } from "zod";
import { audit, D, db, tx } from "../db";
import { crud } from "../crud";
import { conflict, notFound, paged, pageArgs, route, type Route } from "../http";
import { zDate, zId, zMoney, zPositiveMoney, zText } from "../scope";
import { adjustCustomerBalance } from "./sales";

const SELL = ["sales.make", "reports.view"] as const;
const ADMIN = ["settings.manage", "sales.discount_any"] as const;

const customerSchema = z.object({
  name: zText(160).min(1), phone: zText(30).nullish(), email: z.string().email().max(160).nullish(), address: zText(300).nullish(), nic: zText(20).nullish(),
  birthday: zDate.nullish(), groupId: zId.nullish(), creditLimit: zMoney.default(0), active: z.boolean().default(true),
});

export const customerRoutes: Route[] = [
  ...crud({ path: "/customers", model: "customer", entity: "Customer", read: [...SELL], write: ["sales.make", "sales.credit"], softDelete: true, search: ["name", "phone", "email"],
    include: { group: { select: { id: true, name: true, discountPct: true } } },
    schema: customerSchema,
    // Credit limits are a financial control, so only managers can set them.
    transform: (d, c) => { if (!c.auth.permissions.has("sales.discount_any")) { const { creditLimit: _l, ...rest } = d; return rest; } return d; } }),
  ...crud({ path: "/customer-groups", model: "customerGroup", entity: "CustomerGroup", read: [...SELL], write: [...ADMIN],
    include: { _count: { select: { customers: true } } },
    schema: z.object({ name: zText(60).min(1), discountPct: z.coerce.number().min(0).max(100).default(0) }) }),

  route("GET", "/customers/:id/ledger", { perm: [...SELL] }, async ({ params, query: q }) => {
    const p = pageArgs(q), where = { customerId: params.id };
    const [rows, total] = await Promise.all([db.customerLedger.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take }), db.customerLedger.count({ where })]);
    return paged(rows, total, p);
  }),
  route("GET", "/customers/:id/loyalty", { perm: [...SELL] }, async ({ params, query: q }) => {
    const p = pageArgs(q), where = { customerId: params.id };
    const [rows, total] = await Promise.all([db.loyaltyEntry.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take }), db.loyaltyEntry.count({ where })]);
    return paged(rows, total, p);
  }),
  route("POST", "/customers/:id/payments", { perm: "sales.credit" }, async (c) => {
    const b = await c.body(z.object({ amount: zPositiveMoney, method: z.enum(["Cash", "Card", "LankaQR", "Bank transfer", "Cheque"]), reference: zText(80).optional() }));
    return tx(async (t) => {
      await t.$queryRaw`SELECT id FROM "Customer" WHERE id = ${c.params.id} FOR UPDATE`;
      const cust = await t.customer.findUnique({ where: { id: c.params.id } });
      if (!cust) throw notFound("Customer");
      if (D(b.amount).gt(cust.balance)) throw conflict("Payment is more than the outstanding balance", { balance: cust.balance });
      const balance = await adjustCustomerBalance(t, cust.id, D(b.amount).negated(), "Payment", { userId: c.auth.userId, method: b.method, reference: b.reference }, false);
      // Cash collected at the till belongs in the drawer count.
      if (b.method === "Cash" && c.auth.branchId) {
        const shift = await t.shift.findFirst({ where: { userId: c.auth.userId, branchId: c.auth.branchId, status: "OPEN" } });
        if (!shift) throw conflict("Open a shift to collect cash");
        await t.cashMovement.create({ data: { shiftId: shift.id, type: "CASH_IN", amount: b.amount, reason: `Credit payment: ${cust.name}`, userId: c.auth.userId } });
      }
      await audit(t, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, "customer.payment", "Customer", cust.id, b);
      return { customerId: cust.id, balance };
    });
  }),
  route("GET", "/customers/credit/aging", { perm: ["sales.credit", "reports.view"] }, async () => db.$queryRaw`
    WITH last_charge AS (SELECT "customerId", MAX("createdAt") AS at FROM "CustomerLedger" WHERE amount > 0 GROUP BY 1)
    SELECT c.id, c.name, c.phone, c.balance::float8 AS balance, c."creditLimit"::float8 AS "creditLimit",
      COALESCE(EXTRACT(DAY FROM now() - l.at), 0)::int AS "daysSinceCharge",
      CASE WHEN l.at IS NULL OR now() - l.at <= interval '30 days' THEN '0-30' WHEN now() - l.at <= interval '60 days' THEN '31-60' WHEN now() - l.at <= interval '90 days' THEN '61-90' ELSE '90+' END AS bucket
    FROM "Customer" c LEFT JOIN last_charge l ON l."customerId" = c.id WHERE c.balance > 0 ORDER BY c.balance DESC`),

  // Promotions
  ...crud({ path: "/promotions", model: "promotion", entity: "Promotion", read: [...SELL], write: [...ADMIN], softDelete: true, search: ["name"],
    schema: z.object({ name: zText(120).min(1), type: z.enum(["PERCENTAGE", "FIXED", "BUY_X_GET_Y", "BUNDLE", "HAPPY_HOUR"]), value: zMoney.default(0), buyQty: z.number().int().positive().nullish(), getQty: z.number().int().positive().nullish(), productIds: z.array(zId).default([]), categoryIds: z.array(zId).default([]), branchIds: z.array(zId).default([]), startsAt: zDate, endsAt: zDate.nullish(), startHour: z.number().int().min(0).max(23).nullish(), endHour: z.number().int().min(1).max(24).nullish(), active: z.boolean().default(true) }) }),
  ...crud({ path: "/coupons", model: "coupon", entity: "Coupon", read: [...SELL], write: [...ADMIN], softDelete: true, search: ["code"], orderBy: { createdAt: "desc" },
    transform: (d) => (typeof d.code === "string" ? { ...d, code: d.code.toUpperCase() } : d),
    schema: z.object({ code: zText(40).min(3), type: z.enum(["PERCENT", "FIXED"]), value: zPositiveMoney, minSpend: zMoney.default(0), maxDiscount: zMoney.nullish(), usageLimit: z.number().int().positive().nullish(), startsAt: zDate.nullish(), endsAt: zDate.nullish(), active: z.boolean().default(true) }) }),

  // Gift cards: balance only changes through entries.
  route("GET", "/gift-cards", { perm: [...ADMIN] }, async ({ query: q }) => {
    const p = pageArgs(q);
    const [rows, total] = await Promise.all([db.giftCard.findMany({ orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take }), db.giftCard.count()]);
    return paged(rows, total, p);
  }),
  route("GET", "/gift-cards/lookup/:code", { perm: "sales.make" }, async ({ params }) => {
    const g = await db.giftCard.findUnique({ where: { code: params.code.toUpperCase() }, select: { code: true, balance: true, expiresAt: true, active: true } });
    if (!g) throw notFound("Gift card");
    return g;
  }),
  route("POST", "/gift-cards", { perm: [...ADMIN] }, async (c) => {
    const b = await c.body(z.object({ amount: zPositiveMoney, expiresAt: zDate.optional() }));
    const code = `GC-${randomBytes(6).toString("hex").toUpperCase()}`;
    return tx(async (t) => {
      const g = await t.giftCard.create({ data: { code, initial: b.amount, balance: b.amount, expiresAt: b.expiresAt, entries: { create: { amount: b.amount, balance: b.amount, reason: "Issued" } } } });
      await audit(t, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, "giftcard.issue", "GiftCard", g.id, { amount: b.amount });
      return g;
    });
  }),
  route("POST", "/gift-cards/:id/deactivate", { perm: [...ADMIN] }, async (c) => {
    const g = await db.giftCard.update({ where: { id: c.params.id }, data: { active: false } });
    await audit(db, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, "giftcard.deactivate", "GiftCard", g.id);
    return g;
  }),
];

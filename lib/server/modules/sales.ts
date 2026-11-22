import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import type { CustomerTier, PaymentMethod } from "../../generated/prisma/enums";
import { verifyApproval, type Auth } from "../auth";
import { audit, D, db, money, nextNumber, qty3, tx, ZERO, type Tx } from "../db";
import { badRequest, conflict, forbidden, notFound, paged, pageArgs, route, type Route } from "../http";
import { branchFilter, canAccessBranch, dateRange, requireBranch, zApproval, zId, zMoney, zPositiveMoney, zQty, zText } from "../scope";
import { moveStock } from "../stock";

type Dec = Prisma.Decimal;
const EARN_RATE: Record<CustomerTier, number> = { SILVER: 1, GOLD: 1.5, PLATINUM: 2 };
const MIN_REDEEM_POINTS = 200;
const GOLD_SPEND = 100_000, PLATINUM_SPEND = 500_000;

const saleSchema = z.object({
  clientId: z.string().min(8).max(64).optional(),
  customerId: zId.optional(),
  tableId: zId.optional(),
  couponCode: zText(40).optional(),
  note: zText().optional(),
  soldAt: z.coerce.date().optional(), // offline sales keep their real time
  items: z.array(z.object({
    productId: zId, quantity: zQty, variantLabel: zText(120).optional(),
    unitPrice: zMoney.optional(), // price override
    discountPct: z.coerce.number().min(0).max(100).optional(),
  })).min(1).max(300),
  cartDiscount: z.object({ type: z.enum(["PERCENT", "FIXED"]), value: zMoney }).optional(),
  payments: z.array(z.object({
    method: z.enum(["CASH", "CARD", "LANKAQR", "CREDIT", "GIFT_CARD", "LOYALTY"]),
    amount: zPositiveMoney, reference: zText(80).optional(), giftCardCode: zText(40).optional(),
  })).min(1).max(8),
  approval: zApproval,
});
type SaleInput = z.infer<typeof saleSchema>;

export async function openShiftFor(t: Tx | typeof db, a: Auth, branchId: string) {
  return t.shift.findFirst({ where: { userId: a.userId, branchId, status: "OPEN" } });
}

/** Spreads an amount across weights so the parts always add up exactly. */
function allocate(amount: Dec, weights: Dec[]) {
  const sum = weights.reduce((s, w) => s.plus(w), ZERO);
  if (sum.isZero()) return weights.map(() => ZERO);
  let left = amount;
  return weights.map((w, i) => {
    const part = i === weights.length - 1 ? left : money(amount.times(w).div(sum));
    left = left.minus(part);
    return part;
  });
}

type Line = { productId: string; categoryId: string; qty: Dec; price: Dec; gross: Dec; manual: Dec; promo: Dec };

/** Best active promotion per line. Lines with a manual discount are not stacked. */
async function applyPromotions(t: Tx, lines: Line[], branchId: string, at: Date) {
  const promos = await t.promotion.findMany({
    where: { active: true, startsAt: { lte: at }, OR: [{ endsAt: null }, { endsAt: { gte: at } }] },
  });
  const hour = Number(at.toLocaleString("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", hour12: false })) % 24;
  for (const p of promos) {
    if (p.branchIds.length && !p.branchIds.includes(branchId)) continue;
    if (p.startHour != null && p.endHour != null && (hour < p.startHour || hour >= p.endHour)) continue;
    const scoped = p.productIds.length || p.categoryIds.length;
    const eligible = lines.filter((l) => l.manual.isZero() && (!scoped || p.productIds.includes(l.productId) || p.categoryIds.includes(l.categoryId)));
    if (!eligible.length) continue;
    const offers = new Map<Line, Dec>();
    if (p.type === "PERCENTAGE" || p.type === "HAPPY_HOUR") {
      for (const l of eligible) offers.set(l, money(l.gross.times(p.value).div(100)));
    } else if (p.type === "FIXED") {
      for (const l of eligible) offers.set(l, Prisma.Decimal.min(l.gross, money(l.qty.times(p.value))));
    } else if (p.type === "BUY_X_GET_Y" && p.buyQty && p.getQty) {
      for (const l of eligible) {
        const free = l.qty.div(p.buyQty + p.getQty).floor().times(p.getQty);
        if (free.gt(0)) offers.set(l, money(free.times(l.price)));
      }
    } else if (p.type === "BUNDLE" && p.productIds.length) {
      const members = p.productIds.map((id) => eligible.find((l) => l.productId === id));
      if (members.every(Boolean)) {
        const ls = members as Line[];
        const sets = Prisma.Decimal.min(...ls.map((l) => l.qty.floor()));
        const unit = ls.reduce((s, l) => s.plus(l.price), ZERO);
        const saving = sets.times(unit.minus(p.value));
        if (sets.gt(0) && saving.gt(0)) allocate(money(saving), ls.map((l) => l.price)).forEach((v, i) => offers.set(ls[i], v));
      }
    }
    for (const [l, v] of offers) if (v.gt(l.promo)) l.promo = v;
  }
}

async function adjustCustomerBalance(t: Tx, customerId: string, delta: Dec, type: string, a: { userId: string; refId?: string; method?: string; reference?: string }, enforceLimit: boolean) {
  const rows = enforceLimit
    ? await t.$queryRaw<{ balance: Dec }[]>`UPDATE "Customer" SET balance = balance + ${delta}, "updatedAt" = now() WHERE id = ${customerId} AND balance + ${delta} <= "creditLimit" RETURNING balance`
    : await t.$queryRaw<{ balance: Dec }[]>`UPDATE "Customer" SET balance = balance + ${delta}, "updatedAt" = now() WHERE id = ${customerId} RETURNING balance`;
  if (!rows.length) throw conflict("This sale would exceed the customer's credit limit");
  await t.customerLedger.create({ data: { customerId, amount: delta, balance: rows[0].balance, type, userId: a.userId, refId: a.refId, method: a.method, reference: a.reference } });
  return D(rows[0].balance);
}
export { adjustCustomerBalance };

async function adjustGiftCard(t: Tx, code: string, delta: Dec, reason: string, refId: string) {
  const now = new Date();
  const where: Prisma.GiftCardWhereInput = { code, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], ...(delta.isNegative() ? { balance: { gte: delta.abs() } } : {}) };
  const { count } = await t.giftCard.updateMany({ where, data: { balance: { increment: delta } } });
  if (!count) throw conflict("Gift card is invalid, expired, or has too little balance");
  const c = await t.giftCard.findUniqueOrThrow({ where: { code } });
  await t.giftCardEntry.create({ data: { giftCardId: c.id, amount: delta, balance: c.balance, reason, refId } });
}

async function adjustPoints(t: Tx, customerId: string, delta: number, reason: string, refId: string) {
  if (!delta) return;
  const where = { id: customerId, ...(delta < 0 ? { points: { gte: -delta } } : {}) };
  const { count } = await t.customer.updateMany({ where, data: { points: { increment: delta } } });
  if (!count) throw conflict("Customer does not have enough loyalty points");
  const c = await t.customer.findUniqueOrThrow({ where: { id: customerId }, select: { points: true } });
  await t.loyaltyEntry.create({ data: { customerId, points: delta, balance: c.points, reason, refId } });
}

async function refreshTier(t: Tx, customerId: string) {
  const since = new Date(Date.now() - 365 * 86_400_000);
  const r = await t.sale.aggregate({ where: { customerId, soldAt: { gte: since }, status: { not: "VOIDED" } }, _sum: { total: true, refunded: true } });
  const spend = (r._sum.total ?? ZERO).minus(r._sum.refunded ?? ZERO);
  const earned: CustomerTier = spend.gte(PLATINUM_SPEND) ? "PLATINUM" : spend.gte(GOLD_SPEND) ? "GOLD" : "SILVER";
  // Upgrades only. Imported customers have history outside this table, and downgrades belong to the tier review.
  const rank: Record<CustomerTier, number> = { SILVER: 0, GOLD: 1, PLATINUM: 2 };
  const { tier } = await t.customer.findUniqueOrThrow({ where: { id: customerId }, select: { tier: true } });
  if (rank[earned] > rank[tier]) await t.customer.update({ where: { id: customerId }, data: { tier: earned } });
}

/** The single source of cart pricing, shared by the live quote and the real sale. */
async function priceCart(t: Tx, input: Pick<SaleInput, "cartDiscount" | "couponCode">, lines: Line[], branchId: string, at: Date, consumeCoupon: boolean) {
  await applyPromotions(t, lines, branchId, at);
  const afterLine = lines.map((l) => l.gross.minus(Prisma.Decimal.max(l.manual, l.promo)));
  const subtotal = afterLine.reduce((s, v) => s.plus(v), ZERO);

  let cartOff = ZERO;
  if (input.cartDiscount) cartOff = input.cartDiscount.type === "PERCENT" ? money(subtotal.times(input.cartDiscount.value).div(100)) : money(input.cartDiscount.value);

  let couponId: string | undefined, couponOff = ZERO;
  if (input.couponCode) {
    const c = await t.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    if (!c || !c.active || (c.startsAt && c.startsAt > at) || (c.endsAt && c.endsAt < at)) throw conflict("Coupon is not valid");
    if (subtotal.lt(c.minSpend)) throw conflict(`Coupon needs a minimum spend of Rs. ${c.minSpend.toFixed(2)}`);
    if (c.usageLimit != null && c.used >= c.usageLimit) throw conflict("Coupon has reached its usage limit");
    if (consumeCoupon) {
      const where = { id: c.id, ...(c.usageLimit != null ? { used: { lt: c.usageLimit } } : {}) };
      const { count } = await t.coupon.updateMany({ where, data: { used: { increment: 1 } } });
      if (!count) throw conflict("Coupon has reached its usage limit");
    }
    couponId = c.id;
    couponOff = c.type === "PERCENT" ? money(subtotal.times(c.value).div(100)) : c.value;
    if (c.maxDiscount && couponOff.gt(c.maxDiscount)) couponOff = c.maxDiscount;
  }
  const cartTotalOff = Prisma.Decimal.min(subtotal, cartOff.plus(couponOff));
  return { afterLine, subtotal, cartOff, couponId, cartTotalOff, total: money(subtotal.minus(cartTotalOff)) };
}

const quoteSchema = saleSchema.pick({ items: true, couponCode: true, cartDiscount: true });

async function quoteSale(a: Auth, input: z.infer<typeof quoteSchema>) {
  const branchId = requireBranch(a);
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await db.product.findMany({ where: { id: { in: ids }, active: true }, include: { taxRate: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  if (ids.some((id) => !byId.has(id))) throw badRequest("Some products are unavailable");
  const lines: Line[] = input.items.map((i) => {
    const p = byId.get(i.productId)!, qty = qty3(i.quantity), price = p.price, gross = money(qty.times(price));
    return { productId: p.id, categoryId: p.categoryId, qty, price, gross, manual: money(gross.times(i.discountPct ?? 0).div(100)), promo: ZERO };
  });
  const r = await tx((t) => priceCart(t, input, lines, branchId, new Date(), false));
  const shares = allocate(r.cartTotalOff, r.afterLine);
  const tax = input.items.reduce((sum, i, idx) => {
    const p = byId.get(i.productId)!, lineTotal = money(r.afterLine[idx].minus(shares[idx]));
    const rate = p.taxRate?.onReceipt ? p.taxRate.rate : ZERO;
    return sum.plus(money(lineTotal.minus(lineTotal.div(D(1).plus(rate.div(100))))));
  }, ZERO);
  const list = lines.reduce((acc, l) => acc.plus(l.gross), ZERO);
  return { list, discount: money(list.minus(r.total)), tax, total: r.total };
}

async function createSale(a: Auth, input: SaleInput, ip: string | null) {
  const branchId = requireBranch(a);
  if (input.clientId) {
    const dup = await db.sale.findUnique({ where: { clientId: input.clientId }, include: saleInclude });
    if (dup) return dup; // safe retry
  }
  const shift = await openShiftFor(db, a, branchId);
  if (!shift) throw conflict("Open a shift before making sales");

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await db.product.findMany({ where: { id: { in: ids }, active: true }, include: { taxRate: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw badRequest("Some products are unavailable", { productIds: missing });

  // Permissions that a manager can approve at the till.
  const overrides = input.items.some((i) => i.unitPrice != null && !D(i.unitPrice).eq(byId.get(i.productId)!.price));
  const lines: Line[] = input.items.map((i) => {
    const p = byId.get(i.productId)!;
    if (!p.weighed && !Number.isInteger(i.quantity)) throw badRequest(`${p.name} must be sold in whole units`);
    const price = i.unitPrice != null ? D(i.unitPrice) : p.price;
    const qty = qty3(i.quantity), gross = money(qty.times(price));
    return { productId: p.id, categoryId: p.categoryId, qty, price, gross, manual: money(gross.times(i.discountPct ?? 0).div(100)), promo: ZERO };
  });
  const at = input.soldAt && input.soldAt < new Date() ? input.soldAt : new Date();

  return tx(async (t) => {
    const { afterLine, subtotal, cartOff, couponId, cartTotalOff, total } = await priceCart(t, input, lines, branchId, at, true);

    // Staff-given discount as a share of list price (promotions and coupons don't count).
    const listTotal = lines.reduce((s, l) => s.plus(l.gross), ZERO);
    const manualOff = lines.reduce((s, l) => s.plus(l.manual.gt(l.promo) ? l.manual : ZERO), ZERO).plus(Prisma.Decimal.min(subtotal, cartOff));
    const manualPct = listTotal.isZero() ? ZERO : manualOff.div(listTotal).times(100);
    const need: ("sales.discount" | "sales.discount_any" | "sales.override_price")[] = [];
    if (manualOff.gt(0)) need.push(manualPct.gt(10) ? "sales.discount_any" : "sales.discount");
    if (overrides) need.push("sales.override_price");
    let approvedBy: string | undefined;
    for (const perm of need) {
      if (a.permissions.has(perm)) continue;
      const ok = await verifyApproval(input.approval, perm, branchId, ip);
      if (!ok) throw forbidden("Manager approval is required");
      approvedBy = ok.id;
    }

    // Payments
    const tendered = input.payments.reduce((s, p) => s.plus(p.amount), ZERO);
    if (tendered.lt(total)) throw badRequest("Payment is less than the total", { total, tendered });
    const cashIn = input.payments.filter((p) => p.method === "CASH").reduce((s, p) => s.plus(p.amount), ZERO);
    const change = money(tendered.minus(total));
    if (change.gt(cashIn)) throw badRequest("Only cash payments can exceed the amount due");
    const creditAmt = input.payments.filter((p) => p.method === "CREDIT").reduce((s, p) => s.plus(p.amount), ZERO);
    const pointsAmt = input.payments.filter((p) => p.method === "LOYALTY").reduce((s, p) => s.plus(p.amount), ZERO);
    if (creditAmt.gt(0)) {
      if (!input.customerId) throw badRequest("Select a customer for credit sales");
      if (!a.permissions.has("sales.credit")) throw forbidden("You cannot sell on credit");
    }
    if (pointsAmt.gt(0)) {
      if (!input.customerId) throw badRequest("Select a customer to redeem points");
      if (!pointsAmt.isInteger() || pointsAmt.lt(MIN_REDEEM_POINTS)) throw badRequest(`Redeem at least ${MIN_REDEEM_POINTS} points, in whole rupees`);
    }
    const customer = input.customerId ? await t.customer.findUnique({ where: { id: input.customerId } }) : null;
    if (input.customerId && (!customer || !customer.active)) throw notFound("Customer");

    // Lines: share out the cart discount, then back VAT out of the inclusive price.
    const shares = allocate(cartTotalOff, afterLine);
    let taxTotal = ZERO, costTotal = ZERO;
    const itemRows = input.items.map((i, idx) => {
      const p = byId.get(i.productId)!, l = lines[idx];
      const lineTotal = money(afterLine[idx].minus(shares[idx]));
      const rate = p.taxRate?.onReceipt ? p.taxRate.rate : ZERO;
      const tax = money(lineTotal.minus(lineTotal.div(D(1).plus(rate.div(100)))));
      taxTotal = taxTotal.plus(tax);
      costTotal = costTotal.plus(money(l.qty.times(p.cost)));
      return { productId: p.id, name: p.name, variantLabel: i.variantLabel, quantity: l.qty, unitPrice: l.price, unitCost: p.cost, discount: money(l.gross.minus(lineTotal)), taxRate: rate, tax, total: lineTotal };
    });

    const code = (await t.branch.findUniqueOrThrow({ where: { id: branchId }, select: { code: true } })).code;
    const earnBase = total.minus(creditAmt).minus(pointsAmt);
    const pointsEarned = customer && earnBase.gt(0) ? earnBase.div(100).times(EARN_RATE[customer.tier]).floor().toNumber() : 0;
    const sale = await t.sale.create({
      data: {
        number: await nextNumber(t, "INV", code), clientId: input.clientId, branchId, terminalId: a.terminalId, shiftId: shift.id, cashierId: a.userId,
        customerId: input.customerId, couponId, tableId: input.tableId, status: creditAmt.gt(0) ? "ON_CREDIT" : "COMPLETED",
        subtotal: listTotal, discount: money(listTotal.minus(total)), tax: taxTotal, total, paid: tendered, change, costTotal, pointsEarned, note: input.note, soldAt: at,
        items: { create: itemRows },
      },
    });

    // Cash is stored net of change so drawer maths stays simple.
    let changeLeft = change;
    for (const p of input.payments) {
      let amount = D(p.amount);
      if (p.method === "CASH" && changeLeft.gt(0)) { const c = Prisma.Decimal.min(amount, changeLeft); amount = amount.minus(c); changeLeft = changeLeft.minus(c); }
      if (amount.isZero()) continue;
      if (p.method === "GIFT_CARD") {
        if (!p.giftCardCode) throw badRequest("Enter the gift card code");
        await adjustGiftCard(t, p.giftCardCode.toUpperCase(), amount.negated(), "Sale", sale.id);
      }
      await t.payment.create({ data: { saleId: sale.id, shiftId: shift.id, method: p.method, amount, reference: p.method === "GIFT_CARD" ? p.giftCardCode!.toUpperCase() : p.reference } });
    }

    for (const r of itemRows) {
      const p = byId.get(r.productId)!;
      if (p.trackStock) await moveStock(t, { branchId, productId: p.id, delta: r.quantity.negated(), type: "SALE", userId: a.userId, refType: "Sale", refId: sale.id, unitCost: p.cost, productName: p.name });
    }

    if (customer) {
      if (creditAmt.gt(0)) await adjustCustomerBalance(t, customer.id, creditAmt, "Credit sale", { userId: a.userId, refId: sale.id, reference: sale.number }, true);
      if (pointsAmt.gt(0)) await adjustPoints(t, customer.id, -pointsAmt.toNumber(), "Redeemed", sale.id);
      await adjustPoints(t, customer.id, pointsEarned, "Earned", sale.id);
      await t.customer.update({ where: { id: customer.id }, data: { totalSpent: { increment: total }, visits: { increment: 1 }, lastVisitAt: at } });
      await refreshTier(t, customer.id);
    }
    await audit(t, { userId: a.userId, branchId, ip }, "sale.create", "Sale", sale.id, { number: sale.number, total: total.toNumber(), approvedBy: approvedBy ?? null });
    return t.sale.findUniqueOrThrow({ where: { id: sale.id }, include: saleInclude });
  }).catch(async (e) => {
    // Two retries of one offline sale racing each other: return the winner.
    if (input.clientId && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const dup = await db.sale.findUnique({ where: { clientId: input.clientId }, include: saleInclude });
      if (dup) return dup;
    }
    throw e;
  });
}

const saleInclude = {
  items: true, payments: true,
  customer: { select: { id: true, name: true, phone: true, points: true, balance: true } },
  cashier: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true, code: true } },
  returns: { include: { items: true } },
} satisfies Prisma.SaleInclude;

async function loadSale(a: Auth, idOrNumber: string) {
  const s = await db.sale.findFirst({ where: { OR: [{ id: idOrNumber }, { number: idOrNumber }] }, include: saleInclude });
  if (!s || !canAccessBranch(a, s.branchId)) throw notFound("Sale");
  return s;
}

const stripCost = <T extends { costTotal?: unknown; items?: { unitCost?: unknown }[] }>(a: Auth, s: T): T => {
  if (a.permissions.has("products.view_cost")) return s;
  const { costTotal: _c, items, ...rest } = s;
  return { ...rest, ...(items ? { items: items.map(({ unitCost: _u, ...i }) => i) } : {}) } as unknown as T;
};

const voidSchema = z.object({ reason: zText(300).min(3), approval: zApproval });
const returnSchema = z.object({
  method: z.enum(["CASH", "CARD", "LANKAQR", "CREDIT", "GIFT_CARD"]),
  giftCardCode: zText(40).optional(), reference: zText(80).optional(), note: zText().optional(), approval: zApproval,
  items: z.array(z.object({ saleItemId: zId, quantity: zQty, reason: zText(80).min(2), restock: z.boolean().default(true) })).min(1).max(300),
});

async function voidSale(a: Auth, id: string, input: z.infer<typeof voidSchema>, ip: string | null) {
  const s = await loadSale(a, id);
  let approver: string | null = null;
  if (!a.permissions.has("sales.void")) {
    const ok = await verifyApproval(input.approval, "sales.void", s.branchId, ip);
    if (!ok) throw forbidden("Manager approval is required");
    approver = ok.id;
  }
  return tx(async (t) => {
    // Claiming the status inside the transaction stops a double void.
    const claimed = await t.sale.updateMany({ where: { id: s.id, status: { in: ["COMPLETED", "ON_CREDIT"] }, refunded: 0 }, data: { status: "VOIDED", voidReason: input.reason, voidedById: approver ?? a.userId, voidedAt: new Date() } });
    if (!claimed.count) throw conflict("Only unrefunded, active sales can be voided");
    if (!s.shiftId) throw conflict("This sale has no shift");
    const shift = await t.shift.findUniqueOrThrow({ where: { id: s.shiftId } });
    if (shift.status !== "OPEN") throw conflict("The shift is closed. Process a return instead");

    for (const p of s.payments) {
      await t.payment.create({ data: { saleId: s.id, shiftId: s.shiftId, method: p.method, amount: p.amount.negated(), reference: p.reference } });
      if (p.method === "GIFT_CARD" && p.reference) await adjustGiftCard(t, p.reference, p.amount, "Void", s.id);
      if (p.method === "CREDIT" && s.customerId) await adjustCustomerBalance(t, s.customerId, p.amount.negated(), "Void", { userId: a.userId, refId: s.id, reference: s.number }, false);
      if (p.method === "LOYALTY" && s.customerId) await adjustPoints(t, s.customerId, p.amount.toNumber(), "Void refund", s.id);
    }
    const tracked = await t.product.findMany({ where: { id: { in: s.items.map((i) => i.productId) }, trackStock: true }, select: { id: true } });
    const trackedIds = new Set(tracked.map((p) => p.id));
    for (const i of s.items) if (trackedIds.has(i.productId)) await moveStock(t, { branchId: s.branchId, productId: i.productId, delta: i.quantity, type: "VOID", userId: a.userId, refType: "Sale", refId: s.id, unitCost: i.unitCost });
    if (s.couponId) await t.coupon.update({ where: { id: s.couponId }, data: { used: { decrement: 1 } } });
    if (s.customerId) {
      if (s.pointsEarned) {
        const c = await t.customer.findUniqueOrThrow({ where: { id: s.customerId }, select: { points: true } });
        await adjustPoints(t, s.customerId, -Math.min(c.points, s.pointsEarned), "Void", s.id);
      }
      await t.customer.update({ where: { id: s.customerId }, data: { totalSpent: { decrement: s.total }, visits: { decrement: 1 } } });
      await refreshTier(t, s.customerId);
    }
    await audit(t, { userId: a.userId, branchId: s.branchId, ip }, "sale.void", "Sale", s.id, { number: s.number, reason: input.reason, approvedBy: approver });
    return t.sale.findUniqueOrThrow({ where: { id: s.id }, include: saleInclude });
  });
}

async function createReturn(a: Auth, saleId: string, input: z.infer<typeof returnSchema>, ip: string | null) {
  const branchId = requireBranch(a);
  const s0 = await loadSale(a, saleId);
  let approver: string | null = null;
  if (!a.permissions.has("sales.refund")) {
    const ok = await verifyApproval(input.approval, "sales.refund", branchId, ip);
    if (!ok) throw forbidden("Manager approval is required");
    approver = ok.id;
  }
  const shift = await openShiftFor(db, a, branchId);
  if (input.method === "CASH" && !shift) throw conflict("Open a shift to refund cash");

  return tx(async (t) => {
    // Lock the sale so concurrent returns can't over-refund.
    await t.$queryRaw`SELECT id FROM "Sale" WHERE id = ${s0.id} FOR UPDATE`;
    const s = await t.sale.findUniqueOrThrow({ where: { id: s0.id }, include: { items: { include: { returnItems: true } }, payments: true } });
    if (s.status === "VOIDED") throw conflict("This sale was voided");

    let refund = ZERO;
    const rows: { saleItemId: string; quantity: Dec; amount: Dec; reason: string; restock: boolean; productId: string; unitCost: Dec }[] = [];
    for (const r of input.items) {
      const i = s.items.find((x) => x.id === r.saleItemId);
      if (!i) throw badRequest("Item is not on this sale");
      const q = qty3(r.quantity), remaining = i.quantity.minus(i.returnedQty);
      if (q.gt(remaining)) throw conflict(`Only ${remaining} of ${i.name} can be returned`);
      const already = i.returnItems.reduce((acc, x) => acc.plus(x.amount), ZERO);
      const amount = q.eq(remaining) ? i.total.minus(already) : money(i.total.times(q).div(i.quantity));
      await t.saleItem.update({ where: { id: i.id }, data: { returnedQty: { increment: q } } });
      refund = refund.plus(amount);
      rows.push({ saleItemId: i.id, quantity: q, amount, reason: r.reason, restock: r.restock, productId: i.productId, unitCost: i.unitCost });
    }

    // Refund goes back the way the money came in.
    const netOf = (ms: PaymentMethod[]) => s.payments.filter((p) => ms.includes(p.method)).reduce((acc, p) => acc.plus(p.amount), ZERO);
    const creditLeft = netOf(["CREDIT"]), paidLeft = netOf(["CASH", "CARD", "LANKAQR", "GIFT_CARD", "LOYALTY"]);
    if (input.method === "CREDIT" && (!s.customerId || refund.gt(creditLeft))) throw conflict("Refund to credit cannot exceed the amount charged to credit", { creditLeft });
    if (input.method !== "CREDIT" && refund.gt(paidLeft)) throw conflict("Refund exceeds what was actually paid. Refund the rest to credit", { paidLeft, creditLeft });

    const ret = await t.saleReturn.create({
      data: {
        number: await nextNumber(t, "RET"), saleId: s.id, branchId, shiftId: shift?.id, userId: a.userId, total: refund, method: input.method, note: input.note,
        items: { create: rows.map(({ saleItemId, quantity, amount, reason, restock }) => ({ saleItemId, quantity, amount, reason, restock })) },
      },
    });
    let reference = input.reference;
    if (input.method === "GIFT_CARD") {
      if (!input.giftCardCode) throw badRequest("Enter the gift card code");
      reference = input.giftCardCode.toUpperCase();
      await adjustGiftCard(t, reference, refund, "Refund", ret.id);
    }
    if (input.method === "CREDIT") await adjustCustomerBalance(t, s.customerId!, refund.negated(), "Return", { userId: a.userId, refId: ret.id, reference: ret.number }, false);
    await t.payment.create({ data: { saleId: s.id, returnId: ret.id, shiftId: shift?.id, method: input.method, amount: refund.negated(), reference } });

    const tracked = await t.product.findMany({ where: { id: { in: rows.map((r) => r.productId) }, trackStock: true }, select: { id: true } });
    const ids = new Set(tracked.map((p) => p.id));
    for (const r of rows) if (r.restock && ids.has(r.productId)) await moveStock(t, { branchId, productId: r.productId, delta: r.quantity, type: "SALE_RETURN", userId: a.userId, reason: r.reason, refType: "SaleReturn", refId: ret.id, unitCost: r.unitCost });

    const refunded = s.refunded.plus(refund);
    const allBack = s.items.every((i) => { const add = rows.filter((r) => r.saleItemId === i.id).reduce((acc, r) => acc.plus(r.quantity), ZERO); return i.returnedQty.plus(add).gte(i.quantity); });
    await t.sale.update({ where: { id: s.id }, data: { refunded, status: allBack ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    if (s.customerId) {
      const claw = s.total.isZero() ? 0 : refund.div(s.total).times(s.pointsEarned).floor().toNumber();
      if (claw) { const c = await t.customer.findUniqueOrThrow({ where: { id: s.customerId }, select: { points: true } }); await adjustPoints(t, s.customerId, -Math.min(claw, c.points), "Return", ret.id); }
      await t.customer.update({ where: { id: s.customerId }, data: { totalSpent: { decrement: refund } } });
      await refreshTier(t, s.customerId);
    }
    await audit(t, { userId: a.userId, branchId, ip }, "sale.return", "SaleReturn", ret.id, { sale: s.number, total: refund.toNumber(), method: input.method, approvedBy: approver });
    return t.saleReturn.findUniqueOrThrow({ where: { id: ret.id }, include: { items: true, payments: true, sale: { select: { number: true, status: true } } } });
  });
}

const heldSchema = z.object({ customerId: zId.optional(), note: zText().optional(), total: zMoney, cart: z.array(z.record(z.string(), z.unknown())).min(1).max(300) });

export const salesRoutes: Route[] = [
  route("GET", "/sales", { perm: ["sales.make", "reports.view"] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q);
    const range = q.get("from") || q.get("to") ? dateRange(q) : null;
    const search = q.get("q")?.trim(), status = q.get("status");
    const where: Prisma.SaleWhereInput = {
      ...(branchId ? { branchId } : auth.allBranches ? {} : { branchId: { in: auth.branchIds } }),
      ...(range ? { soldAt: { gte: range.from, lt: range.to } } : {}),
      ...(status ? { status: status as Prisma.SaleWhereInput["status"] } : {}),
      ...(q.get("customerId") ? { customerId: q.get("customerId")! } : {}),
      ...(q.get("cashierId") ? { cashierId: q.get("cashierId")! } : {}),
      ...(q.get("method") ? { payments: { some: { method: q.get("method") as PaymentMethod } } } : {}),
      ...(search ? { OR: [{ number: { contains: search, mode: "insensitive" } }, { customer: { name: { contains: search, mode: "insensitive" } } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      db.sale.findMany({ where, orderBy: { soldAt: "desc" }, skip: p.skip, take: p.take, include: { customer: { select: { id: true, name: true } }, cashier: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } }, payments: { select: { method: true, amount: true } }, _count: { select: { items: true } } } }),
      db.sale.count({ where }),
    ]);
    return paged(rows.map((s) => stripCost(auth, s)), total, p);
  }),
  route("POST", "/sales", { perm: "sales.make" }, async ({ auth, body, ip }) => stripCost(auth, await createSale(auth, await body(saleSchema), ip))),
  route("POST", "/sales/quote", { perm: "sales.make" }, async ({ auth, body }) => quoteSale(auth, await body(quoteSchema))),
  route("POST", "/sales/sync", { perm: "sales.make" }, async ({ auth, body, ip }) => {
    // Offline queue replay: each sale stands alone, so one failure doesn't block the rest.
    const { sales } = await body(z.object({ sales: z.array(saleSchema.extend({ clientId: z.string().min(8).max(64) })).min(1).max(100) }));
    const results = [];
    for (const s of sales) {
      try { const r = await createSale(auth, s, ip); results.push({ clientId: s.clientId, ok: true, id: r.id, number: r.number }); }
      catch (e) { results.push({ clientId: s.clientId, ok: false, error: e instanceof Error ? e.message : "Failed" }); }
    }
    return results;
  }),
  route("GET", "/sales/held", { perm: "sales.make" }, async ({ auth }) => db.heldOrder.findMany({ where: { branchId: requireBranch(auth) }, orderBy: { createdAt: "desc" }, include: { customer: { select: { id: true, name: true } } } })),
  route("POST", "/sales/held", { perm: "sales.make" }, async ({ auth, body }) => {
    const branchId = requireBranch(auth), b = await body(heldSchema);
    return tx(async (t) => t.heldOrder.create({ data: { number: await nextNumber(t, "HLD"), branchId, cashierId: auth.userId, customerId: b.customerId, note: b.note, total: b.total, cart: b.cart as Prisma.InputJsonValue } }));
  }),
  route("DELETE", "/sales/held/:id", { perm: "sales.make" }, async ({ auth, params }) => {
    const { count } = await db.heldOrder.deleteMany({ where: { id: params.id, branchId: requireBranch(auth) } });
    if (!count) throw notFound("Held order");
    return { deleted: true };
  }),
  route("GET", "/sales/:id", { perm: ["sales.make", "sales.refund", "reports.view"] }, async ({ auth, params }) => stripCost(auth, await loadSale(auth, params.id))),
  route("POST", "/sales/:id/void", { perm: "sales.make" }, async ({ auth, params, body, ip }) => stripCost(auth, await voidSale(auth, params.id, await body(voidSchema), ip))),
  route("POST", "/sales/:id/returns", { perm: "sales.make" }, async ({ auth, params, body, ip }) => createReturn(auth, params.id, await body(returnSchema), ip)),
  route("GET", "/returns", { perm: ["sales.make", "sales.refund", "reports.view"] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q);
    const where: Prisma.SaleReturnWhereInput = branchId ? { branchId } : auth.allBranches ? {} : { branchId: { in: auth.branchIds } };
    const [rows, total] = await Promise.all([
      db.saleReturn.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { items: { include: { saleItem: { select: { name: true } } } }, sale: { select: { number: true, customer: { select: { name: true } } } } } }),
      db.saleReturn.count({ where }),
    ]);
    return paged(rows, total, p);
  }),
];

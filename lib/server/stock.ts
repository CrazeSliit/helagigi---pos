import type { MovementType } from "../generated/prisma/enums";
import { D, type Tx } from "./db";
import { conflict } from "./http";

type Move = {
  branchId: string; productId: string; delta: number | string | ReturnType<typeof D>; type: MovementType;
  userId?: string | null; reason?: string | null; refType?: string; refId?: string; unitCost?: ReturnType<typeof D> | number;
  allowNegative?: boolean; productName?: string;
};

/** The only way stock changes: atomic balance update plus a movement row. */
export async function moveStock(t: Tx, m: Move) {
  const delta = D(m.delta);
  await t.stock.upsert({ where: { branchId_productId: { branchId: m.branchId, productId: m.productId } }, create: { branchId: m.branchId, productId: m.productId, quantity: 0 }, update: {} });
  const where = { branchId: m.branchId, productId: m.productId, ...(delta.isNegative() && !m.allowNegative ? { quantity: { gte: delta.abs() } } : {}) };
  const { count } = await t.stock.updateMany({ where, data: { quantity: { increment: delta } } });
  if (!count) {
    const s = await t.stock.findUnique({ where: { branchId_productId: { branchId: m.branchId, productId: m.productId } } });
    throw conflict(`Not enough stock${m.productName ? ` for ${m.productName}` : ""}`, { productId: m.productId, available: s?.quantity ?? 0, requested: delta.abs() });
  }
  const after = await t.stock.findUniqueOrThrow({ where: { branchId_productId: { branchId: m.branchId, productId: m.productId } } });
  await t.stockMovement.create({
    data: { branchId: m.branchId, productId: m.productId, type: m.type, quantity: delta, balance: after.quantity, unitCost: m.unitCost, reason: m.reason, refType: m.refType, refId: m.refId, userId: m.userId },
  });
  if (delta.isNegative()) await consumeBatches(t, m.branchId, m.productId, delta.abs());
  return after.quantity;
}

/** First-expiry-first-out. Unbatched stock is simply left alone. */
async function consumeBatches(t: Tx, branchId: string, productId: string, amount: ReturnType<typeof D>) {
  const batches = await t.batch.findMany({ where: { branchId, productId, quantity: { gt: 0 } }, orderBy: [{ expiresAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }] });
  let left = amount;
  for (const b of batches) {
    if (left.lte(0)) break;
    const take = b.quantity.lt(left) ? b.quantity : left;
    await t.batch.update({ where: { id: b.id }, data: { quantity: { decrement: take } } });
    left = left.minus(take);
  }
}

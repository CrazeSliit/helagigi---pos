import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { audit, D, db, money, nextNumber, qty3, tx, ZERO } from "../db";
import { crud } from "../crud";
import { badRequest, conflict, notFound, paged, pageArgs, route, type Ctx, type Route } from "../http";
import { branchFilter, canAccessBranch, requireBranch, zId, zMoney, zPositiveMoney, zQty, zText } from "../scope";
import { moveStock } from "../stock";

const who = (c: Ctx, branchId?: string | null) => ({ userId: c.auth.userId, branchId: branchId ?? c.auth.branchId, ip: c.ip });
const VIEW = ["stock.receive", "suppliers.pay", "reports.view"] as const;
const poItems = z.array(z.object({ productId: zId, quantity: zQty, unitCost: zMoney })).min(1).max(300)
  .refine((a) => new Set(a.map((i) => i.productId)).size === a.length, "Each product can appear only once");
const totalOf = (items: { quantity: number; unitCost: number }[]) => items.reduce((s, i) => s.plus(money(D(i.quantity).times(i.unitCost))), ZERO);

const grnSchema = z.object({
  supplierId: zId.optional(), orderId: zId.optional(), invoiceNo: zText(60).optional(), note: zText().optional(), updateCost: z.boolean().default(true),
  items: z.array(z.object({ productId: zId, quantity: zQty, unitCost: zMoney, batchNo: zText(60).optional(), expiresAt: z.coerce.date().optional() })).min(1).max(300),
}).refine((v) => v.supplierId || v.orderId, "Choose a supplier or purchase order");

export const purchasingRoutes: Route[] = [
  ...crud({ path: "/suppliers", model: "supplier", entity: "Supplier", read: [...VIEW], write: "stock.receive", softDelete: true, search: ["name", "contact", "phone"],
    schema: z.object({ name: zText(160).min(1), contact: zText(120).nullish(), phone: zText(30).nullish(), email: z.string().email().max(160).nullish(), address: zText(300).nullish(), vatNo: zText(40).nullish(), paymentTermsDays: z.coerce.number().int().min(0).max(365).default(30), onHold: z.boolean().default(false), active: z.boolean().default(true) }) }),

  route("GET", "/purchase-orders", { perm: [...VIEW] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q);
    const where: Prisma.PurchaseOrderWhereInput = { ...(branchId ? { branchId } : {}), ...(q.get("status") ? { status: q.get("status") as Prisma.PurchaseOrderWhereInput["status"] } : {}), ...(q.get("supplierId") ? { supplierId: q.get("supplierId")! } : {}) };
    const [rows, total] = await Promise.all([db.purchaseOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { supplier: { select: { id: true, name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } } }), db.purchaseOrder.count({ where })]);
    return paged(rows, total, p);
  }),
  route("GET", "/purchase-orders/:id", { perm: [...VIEW] }, async ({ auth, params }) => {
    const o = await db.purchaseOrder.findUnique({ where: { id: params.id }, include: { supplier: true, items: { include: { product: { select: { name: true, sku: true } } } }, grns: true } });
    if (!o || !canAccessBranch(auth, o.branchId)) throw notFound("Purchase order");
    return o;
  }),
  route("POST", "/purchase-orders", { perm: "stock.receive" }, async (c) => {
    const branchId = requireBranch(c.auth);
    const b = await c.body(z.object({ supplierId: zId, expectedAt: z.coerce.date().optional(), note: zText().optional(), send: z.boolean().default(false), items: poItems }));
    const sup = await db.supplier.findUnique({ where: { id: b.supplierId } });
    if (!sup || !sup.active) throw notFound("Supplier");
    if (sup.onHold) throw conflict("This supplier is on hold");
    return tx(async (t) => {
      const o = await t.purchaseOrder.create({ data: { number: await nextNumber(t, "PO"), supplierId: b.supplierId, branchId, expectedAt: b.expectedAt, note: b.note, status: b.send ? "SENT" : "DRAFT", total: totalOf(b.items), createdById: c.auth.userId, items: { create: b.items } }, include: { items: true } });
      await audit(t, who(c, branchId), "po.create", "PurchaseOrder", o.id, { number: o.number, total: o.total.toNumber() });
      return o;
    });
  }),
  route("PATCH", "/purchase-orders/:id", { perm: "stock.receive" }, async (c) => {
    const b = await c.body(z.object({ expectedAt: z.coerce.date().nullish(), note: zText().nullish(), items: poItems.optional() }));
    const o = await db.purchaseOrder.findUnique({ where: { id: c.params.id } });
    if (!o || !canAccessBranch(c.auth, o.branchId)) throw notFound("Purchase order");
    if (o.status !== "DRAFT") throw conflict("Only draft orders can be edited");
    return tx(async (t) => {
      if (b.items) await t.purchaseOrderItem.deleteMany({ where: { orderId: o.id } });
      return t.purchaseOrder.update({ where: { id: o.id }, data: { expectedAt: b.expectedAt, note: b.note, ...(b.items ? { total: totalOf(b.items), items: { create: b.items } } : {}) }, include: { items: true } });
    });
  }),
  ...(["send", "cancel"] as const).map((action) => route("POST", `/purchase-orders/:id/${action}`, { perm: "stock.receive" }, async (c) => {
    const o = await db.purchaseOrder.findUnique({ where: { id: c.params.id } });
    if (!o || !canAccessBranch(c.auth, o.branchId)) throw notFound("Purchase order");
    const from: ("DRAFT" | "SENT")[] = action === "send" ? ["DRAFT"] : ["DRAFT", "SENT"];
    const { count } = await db.purchaseOrder.updateMany({ where: { id: o.id, status: { in: from } }, data: { status: action === "send" ? "SENT" : "CANCELLED" } });
    if (!count) throw conflict(`This order cannot be ${action === "send" ? "sent" : "cancelled"}`);
    await audit(db, who(c, o.branchId), `po.${action}`, "PurchaseOrder", o.id);
    return db.purchaseOrder.findUnique({ where: { id: o.id } });
  })),

  route("GET", "/grns", { perm: [...VIEW] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), where = branchId ? { branchId } : {};
    const [rows, total] = await Promise.all([db.grn.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { supplier: { select: { name: true } }, order: { select: { number: true } }, items: { include: { product: { select: { name: true } } } } } }), db.grn.count({ where })]);
    return paged(rows, total, p);
  }),
  route("POST", "/grns", { perm: "stock.receive" }, async (c) => {
    const branchId = requireBranch(c.auth), b = await c.body(grnSchema);
    return tx(async (t) => {
      let supplierId = b.supplierId;
      if (b.orderId) {
        await t.$queryRaw`SELECT id FROM "PurchaseOrder" WHERE id = ${b.orderId} FOR UPDATE`;
        const o = await t.purchaseOrder.findUnique({ where: { id: b.orderId }, include: { items: true } });
        if (!o || o.branchId !== branchId) throw notFound("Purchase order");
        if (!["SENT", "PARTIAL"].includes(o.status)) throw conflict("This order is not open for receiving");
        supplierId = o.supplierId;
        for (const i of b.items) {
          const line = o.items.find((x) => x.productId === i.productId);
          if (!line) throw badRequest("A received item is not on this order", { productId: i.productId });
          const q = qty3(i.quantity);
          if (line.received.plus(q).gt(line.quantity)) throw conflict("Received quantity exceeds what was ordered", { productId: i.productId, remaining: line.quantity.minus(line.received) });
          await t.purchaseOrderItem.update({ where: { id: line.id }, data: { received: { increment: q } } });
        }
        const after = await t.purchaseOrderItem.findMany({ where: { orderId: o.id } });
        await t.purchaseOrder.update({ where: { id: o.id }, data: { status: after.every((x) => x.received.gte(x.quantity)) ? "RECEIVED" : "PARTIAL" } });
      }
      const total = totalOf(b.items);
      const grn = await t.grn.create({ data: { number: await nextNumber(t, "GRN"), supplierId: supplierId!, branchId, orderId: b.orderId, invoiceNo: b.invoiceNo, note: b.note, total, receivedById: c.auth.userId, items: { create: b.items } }, include: { items: true } });
      for (const i of b.items) {
        await moveStock(t, { branchId, productId: i.productId, delta: i.quantity, type: "PURCHASE", userId: c.auth.userId, refType: "Grn", refId: grn.id, unitCost: i.unitCost });
        if (i.batchNo) await t.batch.upsert({ where: { branchId_productId_batchNo: { branchId, productId: i.productId, batchNo: i.batchNo } }, create: { branchId, productId: i.productId, batchNo: i.batchNo, expiresAt: i.expiresAt, quantity: i.quantity, cost: i.unitCost }, update: { quantity: { increment: i.quantity } } });
        if (b.updateCost) await t.product.update({ where: { id: i.productId }, data: { cost: i.unitCost } });
      }
      await t.supplier.update({ where: { id: supplierId! }, data: { outstanding: { increment: total } } });
      await audit(t, who(c, branchId), "grn.create", "Grn", grn.id, { number: grn.number, total: total.toNumber() });
      return grn;
    });
  }),

  route("GET", "/supplier-payments", { perm: [...VIEW] }, async ({ query: q }) => {
    const p = pageArgs(q), where = q.get("supplierId") ? { supplierId: q.get("supplierId")! } : {};
    const [rows, total] = await Promise.all([db.supplierPayment.findMany({ where, orderBy: { paidAt: "desc" }, skip: p.skip, take: p.take, include: { supplier: { select: { name: true } } } }), db.supplierPayment.count({ where })]);
    return paged(rows, total, p);
  }),
  route("POST", "/supplier-payments", { perm: "suppliers.pay" }, async (c) => {
    const b = await c.body(z.object({ supplierId: zId, amount: zPositiveMoney, method: z.enum(["Cash", "Bank transfer", "Cheque", "Card"]), reference: zText(80).optional(), note: zText().optional() }));
    return tx(async (t) => {
      const { count } = await t.supplier.updateMany({ where: { id: b.supplierId, outstanding: { gte: b.amount } }, data: { outstanding: { decrement: b.amount } } });
      if (!count) throw conflict("Payment is more than the supplier's outstanding balance");
      const pay = await t.supplierPayment.create({ data: { ...b, number: await nextNumber(t, "SPY"), paidById: c.auth.userId } });
      await audit(t, who(c), "supplier.pay", "SupplierPayment", pay.id, { supplierId: b.supplierId, amount: b.amount });
      return pay;
    });
  }),

  route("GET", "/purchase-returns", { perm: [...VIEW] }, async ({ auth, query: q }) => {
    const p = pageArgs(q), branchId = branchFilter(auth, q), where = branchId ? { branchId } : {};
    const [rows, total] = await Promise.all([db.purchaseReturn.findMany({ where, orderBy: { createdAt: "desc" }, skip: p.skip, take: p.take, include: { supplier: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } } }), db.purchaseReturn.count({ where })]);
    return paged(rows, total, p);
  }),
  route("POST", "/purchase-returns", { perm: "stock.receive" }, async (c) => {
    const branchId = requireBranch(c.auth);
    const b = await c.body(z.object({ supplierId: zId, reason: zText(200).optional(), items: poItems }));
    return tx(async (t) => {
      const total = totalOf(b.items);
      const r = await t.purchaseReturn.create({ data: { number: await nextNumber(t, "PRT"), supplierId: b.supplierId, branchId, reason: b.reason, total, createdById: c.auth.userId, items: { create: b.items } }, include: { items: true } });
      for (const i of b.items) await moveStock(t, { branchId, productId: i.productId, delta: D(i.quantity).negated(), type: "PURCHASE_RETURN", userId: c.auth.userId, reason: b.reason, refType: "PurchaseReturn", refId: r.id, unitCost: i.unitCost });
      // Credit note: reduce what we owe, never below zero.
      const s = await t.supplier.findUniqueOrThrow({ where: { id: b.supplierId } });
      await t.supplier.update({ where: { id: s.id }, data: { outstanding: Prisma.Decimal.max(ZERO, s.outstanding.minus(total)) } });
      await audit(t, who(c, branchId), "purchase_return.create", "PurchaseReturn", r.id, { number: r.number, total: total.toNumber() });
      return r;
    });
  }),
];

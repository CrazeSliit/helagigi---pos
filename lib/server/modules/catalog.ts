import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";
import { audit, db, ZERO } from "../db";
import { crud } from "../crud";
import { badRequest, notFound, paged, pageArgs, route, type Ctx, type Route } from "../http";
import { branchFilter, requireBranch, zId, zMoney, zText } from "../scope";
import { moveStock } from "../stock";

const productSchema = z.object({
  sku: zText(40).min(1), barcode: zText(40).nullish(), name: zText(160).min(1), nameSi: zText(160).nullish(), nameTa: zText(160).nullish(), description: zText(1000).nullish(),
  categoryId: zId, brandId: zId.nullish(), unitId: zId, taxRateId: zId.nullish(),
  price: zMoney, cost: zMoney.default(0), mrp: zMoney.nullish(), reorderLevel: z.coerce.number().min(0).default(0),
  icon: zText(40).nullish(), imageKey: zText(200).nullish(), weighed: z.boolean().default(false), favorite: z.boolean().default(false), trackStock: z.boolean().default(true),
  variantGroups: z.array(z.object({ group: zText(40), options: z.array(zText(60)).min(1).max(50) })).max(5).nullish(), active: z.boolean().default(true),
});
const productInclude = { category: { select: { id: true, code: true, name: true, color: true } }, brand: { select: { id: true, name: true } }, unit: { select: { id: true, code: true, name: true } }, taxRate: { select: { id: true, name: true, rate: true } } } as const;

export const stockState = (q: Prisma.Decimal, reorder: Prisma.Decimal) => (q.lte(0) ? "out" : q.lt(reorder) ? "low" : "in");

/** Cost and margin never leave the server for roles without the permission. */
function shapeProduct(c: Ctx, p: Record<string, unknown>) {
  if (c.auth.permissions.has("products.view_cost")) return p;
  const { cost: _cost, ...rest } = p;
  return rest;
}
const toData = (d: z.infer<typeof productSchema>) => ({ ...d, variantGroups: d.variantGroups === null ? Prisma.DbNull : d.variantGroups });

async function createWithOpening(c: Ctx, d: z.infer<typeof productSchema>, opening?: number) {
  const p = await db.product.create({ data: toData(d), include: productInclude });
  if (opening && c.auth.branchId) await db.$transaction((t) => moveStock(t, { branchId: c.auth.branchId!, productId: p.id, delta: opening, type: "OPENING", userId: c.auth.userId, unitCost: p.cost }));
  await audit(db, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, "product.create", "Product", p.id, { sku: p.sku, name: p.name });
  return p;
}

const productRoutes: Route[] = [
  route("GET", "/products", {}, async (c) => {
    const q = c.query, p = pageArgs(q), branchId = branchFilter(c.auth, q), s = q.get("q")?.trim();
    const where: Prisma.ProductWhereInput = {
      ...(q.get("includeInactive") === "true" ? {} : { active: true }),
      ...(q.get("categoryId") ? { categoryId: q.get("categoryId")! } : {}),
      ...(q.get("brandId") ? { brandId: q.get("brandId")! } : {}),
      ...(q.get("favorite") === "true" ? { favorite: true } : {}),
      ...(s ? { OR: [{ name: { contains: s, mode: "insensitive" } }, { nameSi: { contains: s } }, { sku: { contains: s, mode: "insensitive" } }, { barcode: s }] } : {}),
    };
    const [rows, total] = await Promise.all([
      db.product.findMany({ where, include: { ...productInclude, stock: { where: branchId ? { branchId } : {}, select: { quantity: true } } }, orderBy: { name: "asc" }, skip: p.skip, take: p.take }),
      db.product.count({ where }),
    ]);
    return paged(rows.map(({ stock, ...r }) => {
      const quantity = stock.reduce((a, x) => a.plus(x.quantity), ZERO);
      return shapeProduct(c, { ...r, stock: quantity, stockState: stockState(quantity, r.reorderLevel) });
    }), total, p);
  }),
  route("GET", "/products/barcode/:code", {}, async (c) => {
    const row = await db.product.findFirst({ where: { active: true, OR: [{ barcode: c.params.code }, { sku: c.params.code }] }, include: productInclude });
    if (!row) throw notFound("Product");
    const branchId = requireBranch(c.auth);
    const st = await db.stock.findUnique({ where: { branchId_productId: { branchId, productId: row.id } } });
    return shapeProduct(c, { ...row, stock: st?.quantity ?? ZERO });
  }),
  route("POST", "/products", { perm: "products.edit" }, async (c) => {
    const { openingStock, ...d } = await c.body(productSchema.extend({ openingStock: z.coerce.number().positive().optional() }));
    return shapeProduct(c, await createWithOpening(c, d, openingStock));
  }),
  route("POST", "/products/import", { perm: "products.edit" }, async (c) => {
    const { rows } = await c.body(z.object({ rows: z.array(productSchema.extend({ openingStock: z.coerce.number().positive().optional() })).min(1).max(1000) }));
    if (rows.some((r) => r.openingStock) && !c.auth.branchId) throw badRequest("Select a branch to import opening stock");
    const results: { sku: string; ok: boolean; error?: string }[] = [];
    for (const { openingStock, ...d } of rows) {
      try { await createWithOpening(c, d, openingStock); results.push({ sku: d.sku, ok: true }); }
      catch (e) { results.push({ sku: d.sku, ok: false, error: e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" ? "SKU or barcode already exists" : "Could not import" }); }
    }
    return { imported: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok), };
  }),
  route("GET", "/products/:id", {}, async (c) => {
    const row = await db.product.findUnique({ where: { id: c.params.id }, include: { ...productInclude, stock: { include: { branch: { select: { id: true, name: true } } } } } });
    if (!row) throw notFound("Product");
    return shapeProduct(c, row);
  }),
  route("PATCH", "/products/:id", { perm: "products.edit" }, async (c) => {
    const before = await db.product.findUnique({ where: { id: c.params.id } });
    if (!before) throw notFound("Product");
    const d = await c.patch(productSchema);
    const row = await db.product.update({ where: { id: before.id }, data: { ...d, variantGroups: d.variantGroups === null ? Prisma.DbNull : d.variantGroups }, include: productInclude });
    await audit(db, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, "product.update", "Product", row.id, {
      fields: Object.keys(d), ...(d.price != null && !before.price.eq(d.price) ? { priceFrom: before.price.toNumber(), priceTo: d.price } : {}),
    });
    return shapeProduct(c, row);
  }),
  route("DELETE", "/products/:id", { perm: "products.edit" }, async (c) => {
    await db.product.update({ where: { id: c.params.id }, data: { active: false } });
    await audit(db, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, "product.delete", "Product", c.params.id);
    return { deleted: true };
  }),
];

export const catalogRoutes: Route[] = [
  ...productRoutes,
  ...crud({ path: "/categories", model: "category", entity: "Category", write: "products.edit", softDelete: true, search: ["name", "code"],
    include: { _count: { select: { products: true } } },
    schema: z.object({ code: zText(20).min(1), name: zText(80).min(1), nameSi: zText(80).nullish(), nameTa: zText(80).nullish(), icon: zText(40).nullish(), color: zText(20).nullish(), active: z.boolean().default(true) }) }),
  ...crud({ path: "/brands", model: "brand", entity: "Brand", write: "products.edit", softDelete: true, search: ["name"],
    include: { _count: { select: { products: true } } }, schema: z.object({ name: zText(80).min(1), active: z.boolean().default(true) }) }),
  ...crud({ path: "/units", model: "unit", entity: "Unit", write: "products.edit", search: ["name", "code"],
    schema: z.object({ code: zText(10).min(1), name: zText(40).min(1), kind: z.enum(["COUNT", "WEIGHT", "VOLUME"]).default("COUNT") }) }),
  ...crud({ path: "/tax-rates", model: "taxRate", entity: "TaxRate", write: "settings.manage", softDelete: true,
    schema: z.object({ name: zText(40).min(1), rate: z.coerce.number().min(0).max(100), onReceipt: z.boolean().default(true), active: z.boolean().default(true) }) }),
];

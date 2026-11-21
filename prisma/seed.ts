// Loads the catalogue and master data from lib/data.ts. Safe to re-run: it never resets stock,
// balances or credentials on existing rows. Transaction history is not seeded.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type CustomerTier } from "../lib/generated/prisma/client";
import { DEFAULT_ROLES } from "../lib/server/permissions";
import { branches, categories, customers, expenseCats, products, staff, suppliers } from "../lib/data";

const url = process.env.DATABASE_URL!.replace("sslmode=require", "sslmode=verify-full");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }, { schema: new URL(url).searchParams.get("schema") ?? undefined }) });

const OWNER_EMAIL = (process.env.SEED_OWNER_EMAIL ?? "craze@heladigi.lk").toLowerCase();
const BRANCH_CODE: Record<string, string> = { cmb: "CMB", kdy: "KDY", kur: "KUR" };
const UNITS = [{ code: "pcs", name: "Pieces", kind: "COUNT" }, { code: "pack", name: "Pack", kind: "COUNT" }, { code: "kg", name: "Kilogram", kind: "WEIGHT" }, { code: "L", name: "Litre", kind: "VOLUME" }] as const;

async function main() {
  const password = process.env.SEED_OWNER_PASSWORD, pin = process.env.SEED_OWNER_PIN;
  if (!password || password.length < 10 || !pin || !/^\d{4,6}$/.test(pin)) throw new Error("Set SEED_OWNER_PASSWORD (10+ chars) and SEED_OWNER_PIN (4-6 digits) in .env");

  const roles = new Map<string, string>();
  for (const [name, permissions] of Object.entries(DEFAULT_ROLES)) {
    const r = await db.role.upsert({ where: { name }, create: { name, permissions, system: true }, update: {} });
    roles.set(name, r.id);
  }

  const branchIds = new Map<string, string>();
  for (const b of branches) {
    const row = await db.branch.upsert({ where: { code: BRANCH_CODE[b.id] }, create: { code: BRANCH_CODE[b.id], name: b.name, address: b.address, phone: b.phone }, update: {} });
    branchIds.set(b.name, row.id);
    for (let i = 1; i <= b.terminals; i++) await db.terminal.upsert({ where: { branchId_name: { branchId: row.id, name: `Terminal ${i}` } }, create: { branchId: row.id, name: `Terminal ${i}` }, update: {} });
  }

  const [vat] = await Promise.all([
    db.taxRate.upsert({ where: { name: "VAT" }, create: { name: "VAT", rate: 18 }, update: {} }),
    db.taxRate.upsert({ where: { name: "SSCL" }, create: { name: "SSCL", rate: 2.5, onReceipt: false }, update: {} }),
  ]);
  const exempt = await db.taxRate.upsert({ where: { name: "VAT Exempt" }, create: { name: "VAT Exempt", rate: 0 }, update: {} });

  const unitIds = new Map<string, string>();
  for (const u of UNITS) unitIds.set(u.code, (await db.unit.upsert({ where: { code: u.code }, create: u, update: {} })).id);
  const catIds = new Map<string, string>();
  for (const c of categories) catIds.set(c.id, (await db.category.upsert({ where: { code: c.id }, create: { code: c.id, name: c.name[0], nameSi: c.name[1], nameTa: c.name[2], icon: c.icon, color: c.color }, update: {} })).id);
  const brandIds = new Map<string, string>();
  for (const name of new Set(products.map((p) => p.brand))) brandIds.set(name, (await db.brand.upsert({ where: { name }, create: { name }, update: {} })).id);

  const home = branchIds.get("Colombo 03")!;
  let newProducts = 0;
  for (const p of products) {
    if (await db.product.findUnique({ where: { sku: p.sku } })) continue;
    const row = await db.product.create({
      data: {
        sku: p.sku, barcode: p.barcode, name: p.name, nameSi: p.si, categoryId: catIds.get(p.cat)!, brandId: brandIds.get(p.brand), unitId: unitIds.get(p.unit)!,
        // Settings page: rice and fresh vegetables are VAT exempt.
        taxRateId: p.cat === "fresh" ? exempt.id : vat.id,
        price: p.price, cost: p.cost, mrp: p.mrp, reorderLevel: p.reorder, icon: p.icon, weighed: !!p.weighed, favorite: !!p.fav,
        variantGroups: p.variants ?? undefined,
      },
    });
    await db.stock.create({ data: { branchId: home, productId: row.id, quantity: p.stock } });
    if (p.stock > 0) await db.stockMovement.create({ data: { branchId: home, productId: row.id, type: "OPENING", quantity: p.stock, balance: p.stock, unitCost: p.cost, reason: "Seed" } });
    newProducts++;
  }

  const groups = new Map<string, string>();
  for (const name of ["Retail", "Wholesale", "VIP"]) groups.set(name, (await db.customerGroup.upsert({ where: { name }, create: { name }, update: {} })).id);
  for (const c of customers) {
    await db.customer.upsert({
      where: { phone: c.phone }, update: {},
      create: { name: c.name, phone: c.phone, email: c.email, groupId: groups.get(c.group), tier: c.tier.toUpperCase() as CustomerTier, points: c.points, balance: c.credit, creditLimit: c.limit, totalSpent: c.spent, visits: c.visits },
    });
  }
  for (const s of suppliers) await db.supplier.upsert({ where: { name: s.name }, update: {}, create: { name: s.name, contact: s.contact, phone: s.phone, email: s.email, outstanding: s.outstanding, onHold: s.status === "On hold" } });
  for (const name of expenseCats) await db.expenseCategory.upsert({ where: { name }, create: { name }, update: {} });

  // Only the Owner gets credentials. Other staff get theirs from /staff.
  for (const s of staff) {
    const isOwner = s.role === "Owner";
    const email = isOwner ? OWNER_EMAIL : null;
    const exists = await db.user.findFirst({ where: isOwner ? { email: OWNER_EMAIL } : { name: s.name, phone: s.phone } });
    if (exists) continue;
    await db.user.create({
      data: {
        name: s.name, email, phone: s.phone, color: s.color, active: s.status === "Active", roleId: roles.get(s.role)!, allBranches: isOwner,
        passwordHash: isOwner ? await bcrypt.hash(password, 11) : null, pinHash: isOwner ? await bcrypt.hash(pin, 11) : null,
        branches: isOwner ? undefined : { create: [{ branchId: branchIds.get(s.branch)! }] },
      },
    });
  }

  await db.setting.upsert({ where: { key: "business" }, update: {}, create: { key: "business", value: { name: "HeladiGi Mart (Pvt) Ltd", vatNo: "114567890-7000", currency: "LKR", timezone: "Asia/Colombo", pricesIncludeTax: true } } });
  await db.setting.upsert({ where: { key: "loyalty" }, update: {}, create: { key: "loyalty", value: { earnPer: 100, tiers: { SILVER: 1, GOLD: 1.5, PLATINUM: 2 }, redeemValue: 1, minRedeem: 200, goldSpend: 100000, platinumSpend: 500000 } } });
  console.log(`Seed complete. New products: ${newProducts}. Owner: ${OWNER_EMAIL}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());

import { Prisma } from "../../generated/prisma/client";
import { db } from "../db";
import { notFound, route, type Route } from "../http";
import { branchFilter, dateRange } from "../scope";

type Args = { from: Date; to: Date; branchId?: string };
const TZ = Prisma.raw(`'Asia/Colombo'`);
const inBranch = (alias: string, b?: string) => (b ? Prisma.sql`AND ${Prisma.raw(`${alias}."branchId"`)} = ${b}` : Prisma.empty);
const q = <T = Record<string, unknown>>(s: Prisma.Sql) => db.$queryRaw<T[]>(s);
// A line's revenue and cost after any returned quantity.
const NET_REV = Prisma.raw(`(i.total * (1 - i."returnedQty" / NULLIF(i.quantity, 0)))`);
const NET_QTY = Prisma.raw(`(i.quantity - i."returnedQty")`);
const NET_COST = Prisma.raw(`((i.quantity - i."returnedQty") * i."unitCost")`);
const liveSales = (a: Args) => Prisma.sql`s.status <> 'VOIDED' AND s."soldAt" >= ${a.from} AND s."soldAt" < ${a.to} ${inBranch("s", a.branchId)}`;

const salesSummary = (a: Args) => q(Prisma.sql`
  SELECT to_char(s."soldAt" AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day, COUNT(*)::int AS transactions,
    SUM(s.total - s.refunded)::float8 AS sales, SUM(s.discount)::float8 AS discounts, SUM(s.refunded)::float8 AS refunds, SUM(s.tax)::float8 AS tax
  FROM "Sale" s WHERE ${liveSales(a)} GROUP BY 1 ORDER BY 1`);

const byItem = (a: Args, col: "product" | "category" | "brand") => {
  const key = col === "product" ? Prisma.sql`p.name` : col === "category" ? Prisma.sql`c.name` : Prisma.sql`COALESCE(b.name, 'Unbranded')`;
  return q(Prisma.sql`
    SELECT ${key} AS name, SUM(${NET_QTY})::float8 AS quantity, SUM(${NET_REV})::float8 AS sales, SUM(${NET_COST})::float8 AS cost, (SUM(${NET_REV}) - SUM(${NET_COST}))::float8 AS profit
    FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId" JOIN "Product" p ON p.id = i."productId" JOIN "Category" c ON c.id = p."categoryId" LEFT JOIN "Brand" b ON b.id = p."brandId"
    WHERE ${liveSales(a)} GROUP BY 1 ORDER BY sales DESC LIMIT 200`);
};

async function profitLoss(a: Args) {
  const [[rev], [exp], byCat] = await Promise.all([
    q<{ revenue: number; cogs: number }>(Prisma.sql`SELECT COALESCE(SUM(${NET_REV}), 0)::float8 AS revenue, COALESCE(SUM(${NET_COST}), 0)::float8 AS cogs FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId" WHERE ${liveSales(a)}`),
    q<{ expenses: number }>(Prisma.sql`SELECT COALESCE(SUM(e.amount), 0)::float8 AS expenses FROM "Expense" e WHERE e."spentAt" >= ${a.from} AND e."spentAt" < ${a.to} ${inBranch("e", a.branchId)}`),
    q(Prisma.sql`SELECT c.name, SUM(e.amount)::float8 AS amount FROM "Expense" e JOIN "ExpenseCategory" c ON c.id = e."categoryId" WHERE e."spentAt" >= ${a.from} AND e."spentAt" < ${a.to} ${inBranch("e", a.branchId)} GROUP BY 1 ORDER BY 2 DESC`),
  ]);
  const grossProfit = rev.revenue - rev.cogs;
  return { revenue: rev.revenue, cogs: rev.cogs, grossProfit, grossMargin: rev.revenue ? grossProfit / rev.revenue : 0, expenses: exp.expenses, netProfit: grossProfit - exp.expenses, expensesByCategory: byCat };
}

const REPORTS: Record<string, (a: Args, p: URLSearchParams) => Promise<unknown>> = {
  "sales-summary": salesSummary,
  "sales-by-product": (a, p) => byItem(a, p.get("by") === "category" ? "category" : p.get("by") === "brand" ? "brand" : "product"),
  "sales-by-hour": (a) => q(Prisma.sql`SELECT EXTRACT(ISODOW FROM s."soldAt" AT TIME ZONE ${TZ})::int AS weekday, EXTRACT(HOUR FROM s."soldAt" AT TIME ZONE ${TZ})::int AS hour, COUNT(*)::int AS transactions, SUM(s.total - s.refunded)::float8 AS sales FROM "Sale" s WHERE ${liveSales(a)} GROUP BY 1, 2 ORDER BY 1, 2`),
  "sales-by-branch": (a) => q(Prisma.sql`SELECT b.name, COUNT(*)::int AS transactions, SUM(s.total - s.refunded)::float8 AS sales FROM "Sale" s JOIN "Branch" b ON b.id = s."branchId" WHERE ${liveSales(a)} GROUP BY 1 ORDER BY sales DESC`),
  "payment-methods": (a) => q(Prisma.sql`SELECT pm.method::text AS method, COUNT(*) FILTER (WHERE pm.amount > 0)::int AS transactions, SUM(pm.amount)::float8 AS amount FROM "Payment" pm JOIN "Sale" s ON s.id = pm."saleId" WHERE ${liveSales(a)} GROUP BY 1 ORDER BY amount DESC`),
  discounts: (a) => q(Prisma.sql`SELECT COALESCE(co.code, CASE WHEN s.discount > 0 THEN 'Promotion / manual' ELSE 'No discount' END) AS name, COUNT(*)::int AS transactions, SUM(s.discount)::float8 AS discount, SUM(s.total)::float8 AS sales FROM "Sale" s LEFT JOIN "Coupon" co ON co.id = s."couponId" WHERE ${liveSales(a)} GROUP BY 1 ORDER BY discount DESC`),
  returns: (a) => q(Prisma.sql`SELECT ri.reason, u.name AS cashier, i.name AS product, SUM(ri.quantity)::float8 AS quantity, SUM(ri.amount)::float8 AS amount FROM "SaleReturnItem" ri JOIN "SaleReturn" r ON r.id = ri."returnId" JOIN "SaleItem" i ON i.id = ri."saleItemId" JOIN "User" u ON u.id = r."userId" WHERE r."createdAt" >= ${a.from} AND r."createdAt" < ${a.to} ${inBranch("r", a.branchId)} GROUP BY 1, 2, 3 ORDER BY amount DESC`),
  "inventory-valuation": (a) => q(Prisma.sql`SELECT b.name AS branch, COUNT(*) FILTER (WHERE st.quantity > 0)::int AS products, SUM(st.quantity)::float8 AS units, SUM(st.quantity * p.cost)::float8 AS "atCost", SUM(st.quantity * p.price)::float8 AS "atRetail" FROM "Stock" st JOIN "Product" p ON p.id = st."productId" JOIN "Branch" b ON b.id = st."branchId" WHERE p.active ${inBranch("st", a.branchId)} GROUP BY 1 ORDER BY 1`),
  "stock-movement": (a) => q(Prisma.sql`SELECT m.type::text AS type, COUNT(*)::int AS entries, SUM(m.quantity) FILTER (WHERE m.quantity > 0)::float8 AS "in", (-SUM(m.quantity) FILTER (WHERE m.quantity < 0))::float8 AS out FROM "StockMovement" m WHERE m."createdAt" >= ${a.from} AND m."createdAt" < ${a.to} ${inBranch("m", a.branchId)} GROUP BY 1 ORDER BY 1`),
  "dead-stock": (a, p) => {
    const days = [30, 60, 90].includes(Number(p.get("days"))) ? Number(p.get("days")) : 30;
    const since = new Date(Date.now() - days * 86_400_000);
    return q(Prisma.sql`SELECT p.id, p.name, st.quantity::float8 AS quantity, (st.quantity * p.cost)::float8 AS "valueAtCost", MAX(s."soldAt") AS "lastSold"
      FROM "Stock" st JOIN "Product" p ON p.id = st."productId" LEFT JOIN "SaleItem" i ON i."productId" = p.id LEFT JOIN "Sale" s ON s.id = i."saleId" AND s."branchId" = st."branchId" AND s.status <> 'VOIDED'
      WHERE p.active AND st.quantity > 0 ${inBranch("st", a.branchId)} GROUP BY p.id, st.quantity HAVING MAX(s."soldAt") IS NULL OR MAX(s."soldAt") < ${since} ORDER BY "valueAtCost" DESC LIMIT 200`);
  },
  "supplier-purchases": (a) => q(Prisma.sql`SELECT su.name, COUNT(g.id)::int AS deliveries, COALESCE(SUM(g.total), 0)::float8 AS purchased, su.outstanding::float8 AS outstanding FROM "Supplier" su LEFT JOIN "Grn" g ON g."supplierId" = su.id AND g."createdAt" >= ${a.from} AND g."createdAt" < ${a.to} ${a.branchId ? Prisma.sql`AND g."branchId" = ${a.branchId}` : Prisma.empty} GROUP BY su.id ORDER BY purchased DESC`),
  customers: (a) => q(Prisma.sql`SELECT c.id, c.name, c.tier::text AS tier, COUNT(s.id)::int AS visits, SUM(s.total - s.refunded)::float8 AS spent, (c."createdAt" >= ${a.from}) AS "isNew" FROM "Sale" s JOIN "Customer" c ON c.id = s."customerId" WHERE ${liveSales(a)} GROUP BY c.id ORDER BY spent DESC LIMIT 200`),
  receivables: () => q(Prisma.sql`
    WITH last_charge AS (SELECT "customerId", MAX("createdAt") AS at FROM "CustomerLedger" WHERE amount > 0 GROUP BY 1),
    x AS (SELECT c.balance, CASE WHEN l.at IS NULL OR now() - l.at <= interval '30 days' THEN '0-30' WHEN now() - l.at <= interval '60 days' THEN '31-60' WHEN now() - l.at <= interval '90 days' THEN '61-90' ELSE '90+' END AS bucket FROM "Customer" c LEFT JOIN last_charge l ON l."customerId" = c.id WHERE c.balance > 0)
    SELECT bucket, COUNT(*)::int AS customers, SUM(balance)::float8 AS amount FROM x GROUP BY 1 ORDER BY 1`),
  "sales-by-staff": (a) => q(Prisma.sql`SELECT u.id, u.name, COUNT(*)::int AS transactions, SUM(s.total - s.refunded)::float8 AS sales, AVG(s.total - s.refunded)::float8 AS "avgBasket", (SUM(s.total - s.refunded) * u."commissionRate" / 100)::float8 AS commission FROM "Sale" s JOIN "User" u ON u.id = s."cashierId" WHERE ${liveSales(a)} GROUP BY u.id ORDER BY sales DESC`),
  "shift-variance": (a) => q(Prisma.sql`SELECT sh.number, u.name AS cashier, sh."closedAt", sh."expectedCash"::float8 AS expected, sh."countedCash"::float8 AS counted, sh.variance::float8 AS variance, sh.status::text AS status FROM "Shift" sh JOIN "User" u ON u.id = sh."userId" WHERE sh."closedAt" >= ${a.from} AND sh."closedAt" < ${a.to} ${inBranch("sh", a.branchId)} ORDER BY sh."closedAt" DESC`),
  "profit-loss": profitLoss,
  tax: async (a) => {
    const [rates, [t]] = await Promise.all([
      q(Prisma.sql`SELECT i."taxRate"::float8 AS rate, SUM(${NET_REV})::float8 AS "grossSales", SUM(i.tax * (1 - i."returnedQty" / NULLIF(i.quantity, 0)))::float8 AS "vatCollected" FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId" WHERE ${liveSales(a)} GROUP BY 1 ORDER BY 1 DESC`),
      q<{ turnover: number }>(Prisma.sql`SELECT COALESCE(SUM(${NET_REV}), 0)::float8 AS turnover FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId" WHERE ${liveSales(a)}`),
    ]);
    const sscl = await db.taxRate.findUnique({ where: { name: "SSCL" } });
    const ssclRate = sscl?.rate.toNumber() ?? 0;
    return { rates, turnover: t.turnover, ssclRate, ssclPayable: Math.round(t.turnover * ssclRate) / 100 };
  },
};

export const reportRoutes: Route[] = [
  route("GET", "/dashboard", { perm: "reports.view" }, async ({ auth, query: p }) => {
    const branchId = branchFilter(auth, p);
    const today = dateRange(new URLSearchParams(), 1);
    const yesterday: Args = { from: new Date(today.from.getTime() - 86_400_000), to: today.from, branchId };
    const now: Args = { from: today.from, to: today.to, branchId };
    const week: Args = { from: new Date(today.to.getTime() - 7 * 86_400_000), to: today.to, branchId };
    const kpi = (a: Args) => q<{ sales: number; transactions: number; profit: number }>(Prisma.sql`
      SELECT COALESCE(SUM(${NET_REV}), 0)::float8 AS sales, COUNT(DISTINCT s.id)::int AS transactions, COALESCE(SUM(${NET_REV}) - SUM(${NET_COST}), 0)::float8 AS profit
      FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId" WHERE ${liveSales(a)}`);
    const hourly = (a: Args) => q(Prisma.sql`SELECT EXTRACT(HOUR FROM s."soldAt" AT TIME ZONE ${TZ})::int AS hour, SUM(s.total - s.refunded)::float8 AS sales FROM "Sale" s WHERE ${liveSales(a)} GROUP BY 1 ORDER BY 1`);
    const [[k], [prev], hoursNow, hoursPrev, daily, paymentMix, top, categories, [low], recent] = await Promise.all([
      kpi(now), kpi(yesterday), hourly(now), hourly(yesterday), salesSummary(week), REPORTS["payment-methods"](now, p) as Promise<unknown[]>,
      q(Prisma.sql`SELECT p.id, p.name, SUM(${NET_QTY})::float8 AS quantity, SUM(${NET_REV})::float8 AS sales FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId" JOIN "Product" p ON p.id = i."productId" WHERE ${liveSales(now)} GROUP BY p.id ORDER BY sales DESC LIMIT 5`),
      byItem(now, "category"),
      q<{ low: number; out: number }>(Prisma.sql`SELECT COUNT(*) FILTER (WHERE x.q > 0 AND x.q < x.r)::int AS low, COUNT(*) FILTER (WHERE x.q <= 0)::int AS out FROM (SELECT p.id, COALESCE(SUM(st.quantity), 0) AS q, p."reorderLevel" AS r FROM "Product" p LEFT JOIN "Stock" st ON st."productId" = p.id ${branchId ? Prisma.sql`AND st."branchId" = ${branchId}` : Prisma.empty} WHERE p.active AND p."trackStock" GROUP BY p.id) x`),
      db.sale.findMany({ where: { ...(branchId ? { branchId } : {}) }, orderBy: { soldAt: "desc" }, take: 8, select: { id: true, number: true, total: true, status: true, soldAt: true, customer: { select: { name: true } }, cashier: { select: { name: true } } } }),
    ]);
    return {
      today: { ...k, avgBasket: k.transactions ? k.sales / k.transactions : 0 },
      yesterday: { ...prev, avgBasket: prev.transactions ? prev.sales / prev.transactions : 0 },
      hourly: { today: hoursNow, yesterday: hoursPrev }, daily, paymentMix, topProducts: top, categories, stock: low, recentSales: recent,
    };
  }),
  route("GET", "/reports/:slug", { perm: "reports.view" }, async ({ auth, params, query: p }) => {
    const fn = REPORTS[params.slug];
    if (!fn || !Object.prototype.hasOwnProperty.call(REPORTS, params.slug)) throw notFound("Report");
    const r = dateRange(p), branchId = branchFilter(auth, p);
    const data = await fn({ from: r.from, to: r.to, branchId }, p);
    return { slug: params.slug, from: r.fromDay, to: r.toDay, branchId: branchId ?? "all", rows: data };
  }),
  route("GET", "/reports/:slug/export", { perm: "data.export" }, async ({ auth, params, query: p }) => {
    const fn = REPORTS[params.slug];
    if (!fn || !Object.prototype.hasOwnProperty.call(REPORTS, params.slug)) throw notFound("Report");
    const r = dateRange(p), branchId = branchFilter(auth, p);
    const out = await fn({ from: r.from, to: r.to, branchId }, p);
    const rows = (Array.isArray(out) ? out : [out]) as Record<string, unknown>[];
    const cols = [...new Set(rows.flatMap((x) => Object.keys(x)))].filter((c) => rows.every((x) => typeof x[c] !== "object" || x[c] === null || x[c] instanceof Date));
    // Prefix formula characters so names can't execute when opened in Excel.
    const cell = (v: unknown) => {
      if (v == null) return "";
      if (typeof v === "number") return String(v);
      let s = v instanceof Date ? v.toISOString() : String(v);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = "﻿" + [cols.join(","), ...rows.map((x) => cols.map((c) => cell(x[c])).join(","))].join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${params.slug}-${r.fromDay}-${r.toDay}.csv"` } });
  }),
];

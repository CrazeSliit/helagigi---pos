"use client";
import {
  ArrowLeftRight, BadgePercent, Boxes, Building2, Calculator, Calendar, Clock, CreditCard, Download, HandCoins, Landmark, Mail, Package,
  PackageX, Printer, Truck, TrendingUp, Undo2, UserCog, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { Button, Card, PageHeader, Select, Status } from "./ui";
import { Dropdown, MenuItem } from "./overlays";
import { Donut, HBars, Heatmap, TrendChart, VBars } from "./charts";
import { REPORTS } from "@/lib/reports";
import { branches, catSales, customers, daily, paymentMix, products, staff } from "@/lib/data";
import { cn, rs, rsShort } from "@/lib/format";
import { useApp } from "@/lib/store";

const ICONS: Record<string, LucideIcon> = { TrendingUp, Package, Clock, Building2, CreditCard, BadgePercent, Undo2, Boxes, ArrowLeftRight, PackageX, Truck, Users, HandCoins, UserCog, Wallet, Calculator, Landmark };
export function ReportIcon({ name, size = 22 }: { name: string; size?: number }) {
  const I = ICONS[name] ?? TrendingUp;
  return <I size={size} />;
}

type Row = { k: string; cells: (string | number)[] };
function dataFor(slug: string): { kpis: [string, string, string?][]; head: string[]; rows: Row[] } {
  switch (slug) {
    case "profit-loss":
      return {
        kpis: [["Revenue", rs(26_842_300, { decimals: false })], ["Gross profit", rs(4_294_770, { decimals: false }), "16.0%"], ["Expenses", rs(945_810, { decimals: false })], ["Net profit", rs(3_348_960, { decimals: false }), "12.5%"]],
        head: ["Line", "October", "November", "Change"],
        rows: [["Revenue", 25_118_400, 26_842_300], ["Cost of goods sold", -21_204_600, -22_547_530], ["Gross profit", 3_913_800, 4_294_770], ["Rent", -185_000, -185_000], ["Utilities", -55_100, -52_460], ["Salaries", -642_000, -642_000], ["Other expenses", -44_600, -66_350], ["Net profit", 2_987_100, 3_348_960]].map(([a, b, c]) => ({ k: a as string, cells: [a as string, rs(b as number), rs(c as number), `${((((c as number) - (b as number)) / Math.abs(b as number)) * 100).toFixed(1)}%`] })),
      };
    case "tax":
      return {
        kpis: [["Taxable sales (excl.)", rs(20_416_880, { decimals: false })], ["Output VAT 18%", rs(3_675_038, { decimals: false })], ["Input VAT (purchases)", rs(3_097_820, { decimals: false })], ["VAT payable", rs(577_218, { decimals: false })]],
        head: ["Tax class", "Sales (incl.)", "Taxable value", "Tax"],
        rows: [["VAT 18%", 24_091_918, 20_416_880, 3_675_038], ["VAT exempt (fresh produce, rice)", 2_750_382, 0, 0], ["SSCL 2.5% (on turnover)", 26_842_300, 26_842_300, 671_058]].map((r) => ({ k: r[0] as string, cells: [r[0] as string, rs(r[1] as number), rs(r[2] as number), rs(r[3] as number)] })),
      };
    case "sales-by-staff":
    case "shift-variance":
      return {
        kpis: [["Staff on shift", "8"], ["Top seller", "Kasun J."], ["Avg basket", rs(1_180.22)], ["Net variance", rs(-3_147)]],
        head: ["Staff", "Branch", "Sales", "Transactions", "Avg basket"],
        rows: staff.filter((s) => s.sales).map((s) => ({ k: s.id, cells: [s.name, s.branch, rs(s.sales!), s.tx!, rs(s.sales! / (s.tx || 1))] })),
      };
    case "customers":
    case "receivables":
      return {
        kpis: [["Active customers", "1,842"], ["New this month", "214"], ["Returning rate", "68.4%"], ["Receivables", rs(308_100, { decimals: false })]],
        head: ["Customer", "Group", "Spent", "Visits", "Credit due"],
        rows: customers.map((c) => ({ k: c.id, cells: [c.name, c.group, rs(c.spent, { decimals: false }), c.visits, rs(c.credit)] })),
      };
    case "sales-by-branch":
      return { kpis: [["Total sales", rs(997_450, { decimals: false })], ["Best branch", "Colombo 03"], ["Branches", "3"], ["Terminals", "9"]], head: ["Branch", "Sales", "Transactions", "Avg basket", "Gross margin"], rows: branches.map((b, i) => ({ k: b.id, cells: [b.name, rs(b.today), [412, 268, 171][i], rs(b.today / [412, 268, 171][i]), ["16.4%", "15.1%", "14.8%"][i]] })) };
    default:
      return {
        kpis: [["Net sales", rs(6_225_150, { decimals: false })], ["Transactions", "5,318"], ["Avg basket", rs(1_170.58)], ["Gross margin", "16.1%"]],
        head: ["Product", "Category", "Qty sold", "Revenue", "Gross profit", "Margin"],
        rows: products.slice(0, 12).map((p, i) => { const q = [612, 548, 503, 461, 420, 388, 352, 310, 288, 241, 207, 188][i]; return { k: p.id, cells: [p.name, p.cat, q, rs(q * p.price), rs(q * (p.price - p.cost)), `${(((p.price - p.cost) / p.price) * 100).toFixed(1)}%`] }; }),
      };
  }
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hrs = ["07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
const heat = days.map((_, d) => hrs.map((_, h) => { const base = [4, 12, 18, 22, 26, 38, 34, 28, 26, 30, 42, 52, 46, 30, 14][h]; return Math.round(base * (d >= 5 ? 1.35 : d === 4 ? 1.15 : 1) * (0.9 + ((d * 7 + h * 3) % 5) / 20)); }));

export function ReportViewer({ slug }: { slug: string }) {
  const r = REPORTS.find((x) => x.slug === slug)!;
  const { toast } = useApp();
  const d = dataFor(slug);
  const chart = {
    trend: <TrendChart data={daily} nowLabel="This week" prevLabel="Last week" height={300} />,
    bars: <VBars height={300} data={slug === "sales-by-branch" || slug === "inventory-valuation" ? branches.map((b) => ({ x: b.name, a: b.today * (slug === "inventory-valuation" ? 22 : 1), b: b.today * (slug === "inventory-valuation" ? 26 : 0.9) })) : ["Wk 44", "Wk 45", "Wk 46", "Wk 47"].map((w, i) => ({ x: w, a: [612, 688, 702, 741][i] * 1000, b: [42, 51, 38, 47][i] * 1000 }))} keys={[{ k: "a", label: slug === "inventory-valuation" ? "At cost" : slug === "tax" ? "Output VAT" : "This period" }, { k: "b", label: slug === "inventory-valuation" ? "At retail" : slug === "tax" ? "Input VAT" : "Previous", color: "#FF7A00" }]} />,
    hbars: <HBars data={slug === "sales-by-staff" ? staff.filter((s) => s.sales).map((s) => ({ name: s.name.split(" ")[0], value: s.sales! })) : catSales} height={300} />,
    donut: <div className="mx-auto max-w-sm"><Donut data={paymentMix} height={300} center={{ label: "Total", value: rsShort(997_450) }} /></div>,
    heatmap: <Heatmap rows={days} cols={hrs} values={heat} />,
    stacked: <VBars stacked height={300} data={["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((m, i) => ({ x: m, a: [3.4, 3.6, 3.8, 3.7, 3.9, 4.3][i] * 1e6, b: [0.9, 0.92, 0.95, 0.9, 0.93, 0.95][i] * 1e6 }))} keys={[{ k: "a", label: slug === "customers" ? "Returning" : "Gross profit" }, { k: "b", label: slug === "customers" ? "New" : "Expenses", color: "#FF7A00" }]} />,
    aging: <VBars height={300} data={["0–30", "31–60", "61–90", "90+"].map((x, i) => ({ x: x + " days", a: [142_300, 88_400, 46_900, 30_500][i] }))} keys={[{ k: "a", label: "Outstanding" }]} />,
  }[r.chart];
  return (
    <>
      <PageHeader title={r.title} sub={r.desc} crumbs={["Reports", r.group, r.title]}
        actions={<>
          <Button icon={Mail} onClick={() => toast({ tone: "success", title: "Scheduled", body: "Every Monday 08:00 to craze@heladigi.lk" })}>Schedule email</Button>
          <Button icon={Printer} onClick={() => window.print()}>Print</Button>
          <Dropdown trigger={() => <Button variant="secondary" icon={Download}>Export</Button>} width="w-40"><MenuItem>PDF</MenuItem><MenuItem>Excel (.xlsx)</MenuItem><MenuItem>CSV</MenuItem></Dropdown>
        </>} />
      <div className="card mb-6 flex flex-wrap items-center gap-2 p-3">
        <Button icon={Calendar}>01/11/2026 – 21/11/2026</Button>
        {[["All branches", "Colombo 03", "Kandy", "Kurunegala"], ["All cashiers", "Kasun J.", "Sachini P.", "Mohamed I."], ["All categories", "Dairy", "Beverages", "Snacks"], ["All payment methods", "Cash", "Card", "LankaQR"]].map((o) => <Select key={o[0]} options={o} className="w-full sm:w-auto sm:min-w-[160px]" aria-label={o[0]} />)}
        <Button variant="ghost" className="ml-auto">Reset</Button>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {d.kpis.map(([l, v, s]) => <div key={l} className="card p-5"><p className="text-sm text-fg2">{l}</p><p className="mt-1 font-heading text-xl font-semibold tnum">{v}</p>{s && <p className="text-cap font-semibold text-success">{s} margin</p>}</div>)}
      </div>
      <Card className="mb-6" title="Overview">{chart}</Card>
      <Card title="Details" pad={false}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr>{d.head.map((h, i) => <th key={h} className={cn(i > 0 && "text-right")}>{h}</th>)}</tr></thead>
            <tbody>{d.rows.map((row) => <tr key={row.k} className={cn((row.k === "Net profit" || row.k === "Gross profit") && "bg-tint font-semibold")}>{row.cells.map((c, i) => <td key={i} className={cn(i === 0 ? "font-semibold" : "text-right", typeof c === "string" && c.startsWith("−") && "text-danger")}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        {slug === "tax" && <div className="flex items-center justify-between border-t border-line p-4"><Status s="Pending" label="Not yet filed · due 20/12/2026" /><Button variant="primary">Export for IRD e-filing</Button></div>}
      </Card>
    </>
  );
}

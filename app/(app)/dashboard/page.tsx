"use client";
import Link from "next/link";
import { useState } from "react";
import { BadgePercent, Calendar, ChevronDown, Package, PackagePlus, Plus, Receipt, ScanBarcode, ShoppingBasket, TrendingUp, Undo2, Users, Wallet, Crown } from "lucide-react";
import { Button, Card, Segmented, StatCard, Status, Avatar, Badge } from "@/components/ui";
import { Donut, HBars, Legend, TrendChart, VBars } from "@/components/charts";
import { ProductThumb } from "@/components/pos-kit";
import { branches, catSales, daily, hourly, orders, paymentMix, products, staff, stockState } from "@/lib/data";
import { rs, rsShort, cn } from "@/lib/format";
import { useApp } from "@/lib/store";

const RANGES = ["Today", "Yesterday", "This week", "This month", "Custom"] as const;

export default function Dashboard() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Today");
  const { branch } = useApp();
  const top = [products[0], products[1], products[12], products[6], products[3]].map((p, i) => ({ p, qty: [148, 131, 118, 96, 74][i] }));
  const low = products.filter((p) => stockState(p) !== "in").slice(0, 5);
  const totalPay = paymentMix.reduce((s, d) => s + d.value, 0);
  const isToday = range === "Today" || range === "Yesterday";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">Good afternoon, Craze 👋</h1>
          <p className="mt-1 text-sm text-fg2">Saturday, 21/11/2026 · <span className="font-medium text-fg">{branch}</span> · Last synced 14:58</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
            <Segmented value={range} onChange={setRange} options={RANGES.map((r) => ({ v: r, label: r === "Custom" ? <span className="inline-flex items-center gap-1"><Calendar size={13} />Custom</span> : r }))} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "New Sale", i: ScanBarcode, h: "/pos", primary: true },
          { l: "Add Product", i: PackagePlus, h: "/products/new" },
          { l: "Receive Stock", i: Package, h: "/purchasing/grn" },
          { l: "Add Expense", i: Receipt, h: "/expenses/new" },
        ].map((a) => (
          <Link key={a.l} href={a.h} className={cn("flex h-14 items-center gap-3 rounded-card border px-4 font-semibold transition", a.primary ? "border-orange-500 bg-orange-500 text-navy-900 hover:bg-orange-600" : "border-line bg-surface hover:border-orange-500/50 hover:shadow-soft")}>
            <span className={cn("grid h-9 w-9 place-items-center rounded-ctl", a.primary ? "bg-white/30" : "bg-tint")}><a.i size={18} /></span>{a.l}
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Today's Sales" value={rs(486_250)} delta={12.4} icon={Wallet} spark={[22, 31, 28, 40, 38, 52, 49, 61]} />
        <StatCard label="Transactions" value="412" delta={8.1} icon={ShoppingBasket} spark={[30, 34, 31, 40, 44, 41, 48, 52]} />
        <StatCard label="Avg Basket Value" value={rs(1_180.22)} delta={3.9} icon={TrendingUp} spark={[40, 38, 42, 41, 44, 43, 46, 47]} />
        <StatCard label="Gross Profit" value={rs(78_420)} delta={10.6} icon={BadgePercent} spark={[18, 22, 20, 26, 25, 30, 29, 34]} />
        <StatCard label="Items Sold" value="2,184" delta={-2.3} icon={Package} spark={[52, 50, 48, 51, 46, 47, 44, 45]} />
        <StatCard label="Returns" value={rs(6_840)} delta={-18.2} invert icon={Undo2} spark={[12, 10, 11, 9, 8, 9, 7, 6]} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Sales trend" sub={isToday ? "Hourly · today vs last Saturday" : "Daily · this period vs previous"}
          action={<Legend items={[{ label: isToday ? "Today" : "This period", color: "#FF7A00" }, { label: isToday ? "Last Sat" : "Previous", color: "#8A96AD", dashed: true }]} />}>
          <TrendChart data={isToday ? hourly : daily} nowLabel={isToday ? "Today" : "This period"} prevLabel={isToday ? "Last Saturday" : "Previous"} />
        </Card>
        <Card title="Payment methods" sub="Share of today's takings">
          <Donut data={paymentMix} center={{ label: "Total", value: rsShort(totalPay) }} />
          <ul className="mt-2 space-y-2">
            {paymentMix.map((p) => (
              <li key={p.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color === "#0B1E4F" ? "var(--navy-swatch, #0B1E4F)" : p.color }} />
                <span className="flex-1 text-fg2">{p.name}</span><span className="font-semibold tnum">{rs(p.value, { decimals: false })}</span>
                <span className="w-12 text-right text-cap text-fg2 tnum">{((p.value / totalPay) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Top selling products" action={<Link href="/reports/sales-by-product" className="text-cap font-semibold text-fg2 hover:text-fg">View all</Link>}>
          <ol className="space-y-3">
            {top.map(({ p, qty }, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className={cn("w-5 text-center font-heading text-sm font-bold", i === 0 ? "text-orange-500" : "text-fg2")}>{i + 1}</span>
                <ProductThumb p={p} className="h-11 w-11 shrink-0" size={20} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-cap text-fg2 tnum">{qty} sold</p></div>
                <span className="text-sm font-semibold tnum">{rs(qty * p.price, { decimals: false })}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Sales by category"><HBars data={catSales} height={250} /></Card>
        <Card title="Low stock alerts" sub={`${low.length} items below reorder level`} className="lg:col-span-2 xl:col-span-1"
          action={<Link href="/inventory" className="text-cap font-semibold text-fg2 hover:text-fg">Inventory</Link>}>
          <ul className="divide-y divide-line">
            {low.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <ProductThumb p={p} className="h-10 w-10 shrink-0" size={18} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="text-cap text-fg2 tnum">{p.stock} left · reorder at {p.reorder}</p></div>
                <Status s={p.stock <= 0 ? "Out of Stock" : "Low Stock"} label={p.stock <= 0 ? "Out" : "Low"} />
              </li>
            ))}
          </ul>
          <Link href="/purchasing/orders/new" className="btn btn-m btn-secondary mt-3 w-full"><Plus size={18} />Create PO</Link>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Recent transactions" pad={false} action={<Link href="/orders" className="text-cap font-semibold text-fg2 hover:text-fg">All orders</Link>}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Invoice</th><th>Time</th><th>Customer</th><th>Method</th><th className="text-right">Total</th><th>Status</th></tr></thead>
              <tbody>
                {orders.slice(0, 10).map((o) => (
                  <tr key={o.id}><td className="font-semibold">{o.id}</td><td className="text-fg2">{o.time}</td><td>{o.customer}</td><td className="text-fg2">{o.method}</td><td className="text-right font-semibold">{rs(o.total)}</td><td><Status s={o.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Branch comparison" sub="Today">
            <VBars data={branches.map((b) => ({ x: b.name, today: b.today, last: Math.round(b.today * 0.89) }))} keys={[{ k: "today", label: "Today" }, { k: "last", label: "Last Sat", color: "#FFA940" }]} height={200} />
          </Card>
          <Card title="Staff leaderboard" sub="Top cashiers today">
            <ol className="space-y-3">
              {staff.filter((s) => s.sales).slice(0, 4).map((s, i) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.name} color={s.color} size={36} />
                  <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 truncate text-sm font-semibold">{s.name}{i === 0 && <Crown size={14} className="text-amber-400" />}</p><p className="text-cap text-fg2 tnum">{s.tx} sales · {s.branch}</p></div>
                  {i === 0 ? <Badge tone="orange">{rs(s.sales!, { decimals: false })}</Badge> : <span className="text-sm font-semibold tnum">{rs(s.sales!, { decimals: false })}</span>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
      <p className="flex items-center gap-1.5 pb-4 text-cap text-fg2"><Users size={13} />All figures are sample data · Asia/Colombo time</p>
    </div>
  );
}

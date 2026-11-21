"use client";
import { useState } from "react";
import { Cake, HandCoins, Mail, MessageCircle, Pencil, Phone, ShoppingBag, TrendingUp, CalendarCheck } from "lucide-react";
import { Avatar, Badge, Button, Card, PageHeader, Progress, Status, Tabs, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { Modal } from "@/components/overlays";
import { Keypad } from "@/components/pos-kit";
import { customers, orders } from "@/lib/data";
import { cn, rs } from "@/lib/format";

export default function CustomerProfile() {
  const c = customers[0];
  const [tab, setTab] = useState("history");
  const [pay, setPay] = useState(false);
  const [amt, setAmt] = useState("2500");
  return (
    <>
      <PageHeader title="Customer profile" crumbs={["Customers", c.name]} actions={<><Button icon={MessageCircle}>Message</Button><Button icon={Pencil}>Edit</Button></>} />
      <SubNav module="customers" />
      <div className="card mb-6 flex flex-wrap items-center gap-5 p-6">
        <Avatar name={c.name} size={72} color="#1A3170" />
        <div className="min-w-[200px] flex-1">
          <div className="flex items-center gap-2"><h2 className="font-heading text-xl font-semibold">{c.name}</h2><Badge tone="amber">★ {c.tier}</Badge></div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg2"><span className="inline-flex items-center gap-1.5"><Phone size={14} />{c.phone}</span><span className="inline-flex items-center gap-1.5"><Mail size={14} />{c.email}</span><span className="inline-flex items-center gap-1.5"><Cake size={14} />14/12</span><span>Member since {c.since}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[["Lifetime value", rs(c.spent, { decimals: false }), TrendingUp], ["Visits", c.visits, CalendarCheck], ["Avg spend", rs(Math.round(c.spent / c.visits), { decimals: false }), ShoppingBag], ["Points", c.points.toLocaleString(), HandCoins]].map(([l, v, I]) => { const Ic = I as typeof Phone; return <div key={l as string}><p className="flex items-center gap-1.5 text-cap text-fg2"><Ic size={13} />{l as string}</p><p className="font-heading text-lg font-semibold tnum">{v as string}</p></div>; })}
        </div>
      </div>
      <Tabs value={tab} onChange={setTab} className="mb-6" tabs={[{ v: "history", label: "Purchase history", count: 62 }, { v: "loyalty", label: "Loyalty points" }, { v: "credit", label: "Credit account" }, { v: "notes", label: "Notes" }]} />
      {tab === "history" && (
        <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Invoice</th><th>Date</th><th>Branch</th><th className="text-right">Items</th><th className="text-right">Total</th><th>Status</th></tr></thead>
          <tbody>{orders.filter((o) => o.customer !== "Walk-in Customer").slice(0, 8).map((o) => <tr key={o.id}><td className="font-semibold">{o.id}</td><td className="text-fg2">{o.date} {o.time}</td><td className="text-fg2">{o.branch}</td><td className="text-right">{o.items}</td><td className="text-right font-semibold">{rs(o.total)}</td><td><Status s={o.status} /></td></tr>)}</tbody></table></div>
      )}
      {tab === "loyalty" && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card><p className="text-sm text-fg2">Points balance</p><p className="font-heading text-[40px] font-bold leading-tight text-orange-500 tnum">{c.points.toLocaleString()}</p><p className="text-sm text-fg2">Worth {rs(c.points)} at checkout</p><div className="mt-5"><div className="mb-1 flex justify-between text-cap"><span className="font-semibold">Gold</span><span className="text-fg2">Rs. 215,350 to Platinum</span></div><Progress value={57} tone="orange" /></div></Card>
          <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Date</th><th>Activity</th><th>Reference</th><th className="text-right">Points</th><th className="text-right">Balance</th></tr></thead>
            <tbody>{[["21/11/2026", "Earned", "INV-C03-018453", 50, 2846], ["18/11/2026", "Redeemed", "INV-C03-018101", -500, 2796], ["18/11/2026", "Earned", "INV-C03-018101", 38, 3296], ["10/11/2026", "Birthday bonus", "—", 200, 3258], ["02/11/2026", "Earned", "INV-KDY-009340", 64, 3058]].map((r, i) => <tr key={i}><td className="text-fg2">{r[0]}</td><td>{r[1]}</td><td className="font-mono text-cap">{r[2]}</td><td className={cn("text-right font-semibold", (r[3] as number) < 0 ? "text-danger" : "text-success")}>{(r[3] as number) > 0 ? "+" : ""}{r[3]}</td><td className="text-right">{(r[4] as number).toLocaleString()}</td></tr>)}</tbody></table></div>
        </div>
      )}
      {tab === "credit" && (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card>
            <p className="text-sm text-fg2">Outstanding balance</p><p className="font-heading text-[40px] font-bold leading-tight tnum">{rs(c.credit)}</p>
            <div className="mt-3"><Progress value={(c.credit / c.limit) * 100} tone="orange" /><p className="mt-1.5 text-cap text-fg2 tnum">{rs(c.limit - c.credit)} available of {rs(c.limit)} limit</p></div>
            <Button variant="primary" size="l" className="mt-5 w-full" icon={HandCoins} onClick={() => setPay(true)}>Receive payment</Button>
          </Card>
          <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th className="text-right">Amount</th><th className="text-right">Balance</th></tr></thead>
            <tbody>{[["20/11/2026", "Credit sale", "INV-C03-018390", 2_350, 4_500], ["15/11/2026", "Payment · Cash", "RCPT-00412", -5_000, 2_150], ["09/11/2026", "Credit sale", "INV-C03-017720", 4_820, 7_150], ["01/11/2026", "Credit sale", "INV-C03-017244", 2_330, 2_330]].map((r, i) => <tr key={i}><td className="text-fg2">{r[0]}</td><td>{r[1]}</td><td className="font-mono text-cap">{r[2]}</td><td className={cn("text-right font-semibold", (r[3] as number) < 0 && "text-success")}>{rs(r[3] as number)}</td><td className="text-right">{rs(r[4] as number)}</td></tr>)}</tbody></table></div>
        </div>
      )}
      {tab === "notes" && <Card><Textarea defaultValue="Prefers Anchor 1kg packs — call when restocked. Delivers to No. 45, Flower Road, Colombo 07." /><Button variant="secondary" className="mt-3">Save note</Button></Card>}
      <Modal open={pay} onClose={() => setPay(false)} title="Receive credit payment" sub={`${c.name} · balance ${rs(c.credit)}`} size="m" footer={<Button size="pos" variant="primary" className="w-full" onClick={() => setPay(false)}>Receive {rs(+amt || 0)}</Button>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><div className="flex h-16 items-center justify-end rounded-card border-2 border-orange-500 px-4 font-heading text-[32px] font-semibold tnum"><span className="mr-auto text-base text-fg2">Rs.</span>{(+amt || 0).toLocaleString()}</div>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button onClick={() => setAmt(String(c.credit))}>Full balance</Button><Button onClick={() => setAmt("1000")}>Rs. 1,000</Button></div>
            <p className="mt-3 text-sm text-fg2">New balance: <b className="text-fg tnum">{rs(Math.max(0, c.credit - (+amt || 0)))}</b></p></div>
          <Keypad size="m" onKey={(k) => setAmt((v) => (k === "⌫" ? v.slice(0, -1) : (v + k).slice(0, 8)))} />
        </div>
      </Modal>
    </>
  );
}

"use client";
import { useState } from "react";
import { ArrowRight, Building2, Check, Plus, Send, Truck } from "lucide-react";
import { Button, Card, PageHeader, Select, Status, Tabs, Input, QtyStepper } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn } from "@/lib/format";

const list = [
  { id: "TRF-00142", from: "Colombo 03", to: "Kandy", items: 14, units: 186, date: "21/11/2026", by: "Dilani F.", status: "In Transit" },
  { id: "TRF-00141", from: "Colombo 03", to: "Kurunegala", items: 8, units: 96, date: "20/11/2026", by: "Dilani F.", status: "Received" },
  { id: "TRF-00140", from: "Kandy", to: "Colombo 03", items: 3, units: 24, date: "19/11/2026", by: "Ruwan B.", status: "Received" },
  { id: "TRF-00143", from: "Colombo 03", to: "Kandy", items: 5, units: 60, date: "21/11/2026", by: "Craze W.", status: "Draft" },
  { id: "TRF-00139", from: "Kurunegala", to: "Kandy", items: 6, units: 42, date: "17/11/2026", by: "Nuwan E.", status: "Received" },
];

export default function Transfers() {
  const [tab, setTab] = useState<"list" | "new" | "receive">("new");
  const [from, setFrom] = useState("Colombo 03");
  const [to, setTo] = useState("Kandy");
  const [lines, setLines] = useState([{ p: products[0], q: 24 }, { p: products[1], q: 36 }, { p: products[3], q: 12 }]);
  const rec = [{ p: products[0], sent: 24, got: 24 }, { p: products[1], sent: 36, got: 34 }, { p: products[3], sent: 12, got: 12 }, { p: products[10], sent: 48, got: 48 }];
  return (
    <>
      <PageHeader title="Stock transfers" sub="Move stock between branches" actions={<Button variant="primary" icon={Plus} onClick={() => setTab("new")}>New transfer</Button>} />
      <SubNav module="inventory" />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ v: "list", label: "All transfers", count: 142 }, { v: "new", label: "Create transfer" }, { v: "receive", label: "Receive TRF-00142" }]} />
      {tab === "list" && (
        <DataTable rows={list} onRow={() => setTab("receive")} cols={[
          { key: "id", label: "Transfer #", render: (r) => <span className="font-semibold">{r.id}</span> },
          { key: "route", label: "Route", render: (r) => <span className="inline-flex items-center gap-2">{r.from}<ArrowRight size={14} className="text-orange-500" />{r.to}</span> },
          { key: "items", label: "Items", align: "right" }, { key: "units", label: "Units", align: "right" },
          { key: "date", label: "Date", render: (r) => <span className="text-fg2">{r.date}</span> }, { key: "by", label: "Created by" },
          { key: "status", label: "Status", render: (r) => <Status s={r.status} /> },
        ]} />
      )}
      {tab === "new" && (
        <div className="space-y-6">
          <Card>
            <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-card border border-line p-4"><p className="label">From branch</p><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-ctl bg-tint"><Building2 size={20} /></span><Select options={["Colombo 03", "Kandy", "Kurunegala"]} value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1" /></div></div>
              <div className="flex items-center justify-center gap-1 text-orange-500"><span className="h-0.5 w-8 bg-orange-500 md:w-12" /><span className="grid h-12 w-12 place-items-center rounded-full bg-orange-500 text-navy-900 shadow-lift"><Truck size={22} /></span><span className="h-0.5 w-8 bg-orange-500 md:w-12" /><ArrowRight size={22} className="-ml-2" /></div>
              <div className="rounded-card border border-line p-4"><p className="label">To branch</p><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-ctl bg-orange-100 text-navy-900"><Building2 size={20} /></span><Select options={["Kandy", "Kurunegala", "Colombo 03"]} value={to} onChange={(e) => setTo(e.target.value)} className="flex-1" /></div></div>
            </div>
          </Card>
          <Card title="Items" pad={false}>
            <table className="tbl"><thead><tr><th>Product</th><th className="text-right">Available at {from}</th><th>Qty to send</th></tr></thead>
              <tbody>{lines.map((l, i) => <tr key={l.p.id}><td><span className="flex items-center gap-3"><ProductThumb p={l.p} className="h-10 w-10" size={18} /><span className="font-semibold">{l.p.name}</span></span></td><td className="text-right">{l.p.stock}</td><td><QtyStepper value={l.q} onChange={(q) => setLines(lines.map((x, j) => (j === i ? { ...x, q } : x)))} /></td></tr>)}</tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4"><Button variant="ghost" icon={Plus}>Add product</Button><div className="flex gap-2"><Button>Save draft</Button><Button variant="primary" icon={Send}>Send {lines.reduce((s, l) => s + l.q, 0)} units to {to}</Button></div></div>
          </Card>
        </div>
      )}
      {tab === "receive" && (
        <Card title="Receive TRF-00142" sub="Colombo 03 → Kandy · sent 21/11/2026 09:40 by Dilani F. · Driver: Saman (WP LK-4471)" pad={false}>
          <table className="tbl"><thead><tr><th>Product</th><th className="text-right">Sent</th><th>Received</th><th>Variance</th></tr></thead>
            <tbody>{rec.map((r) => { const d = r.got - r.sent; return <tr key={r.p.id} className={cn(d && "bg-warning/10")}><td><span className="flex items-center gap-3"><ProductThumb p={r.p} className="h-10 w-10" size={18} /><span className="font-semibold">{r.p.name}</span></span></td><td className="text-right">{r.sent}</td><td><Input defaultValue={r.got} className="h-10 w-24" inputMode="numeric" /></td><td>{d ? <Status s="Short" label={`${d} short`} /> : <Status s="Balanced" label="Matches" />}</td></tr>; })}</tbody>
          </table>
          <div className="flex justify-end gap-2 border-t border-line p-4"><Button>Report issue</Button><Button variant="primary" icon={Check}>Confirm received</Button></div>
        </Card>
      )}
    </>
  );
}

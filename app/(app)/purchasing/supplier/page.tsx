"use client";
import { useState } from "react";
import { FileText, Mail, MapPin, MessageCircle, Phone, Wallet, Building2 } from "lucide-react";
import { Avatar, Button, Card, PageHeader, Status, Tabs, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { VBars } from "@/components/charts";
import { products, suppliers } from "@/lib/data";
import { rs } from "@/lib/format";

export default function SupplierProfile() {
  const s = suppliers[0];
  const [tab, setTab] = useState("history");
  return (
    <>
      <PageHeader title={s.name} crumbs={["Purchasing", "Suppliers", s.name]} actions={<><Button icon={Wallet}>Record payment</Button><Button variant="primary" icon={FileText}>New purchase order</Button></>} />
      <SubNav module="purchasing" />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-card bg-orange-100 text-navy-900"><Building2 size={26} /></span><div><p className="font-semibold">{s.name}</p><Status s={s.status} /></div></div>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-3"><Avatar name={s.contact} size={28} color="#1A3170" />{s.contact} · Sales Rep</li>
              <li className="flex items-center gap-3 text-fg2"><Phone size={16} />{s.phone}</li>
              <li className="flex items-center gap-3 text-fg2"><Mail size={16} />{s.email}</li>
              <li className="flex items-start gap-3 text-fg2"><MapPin size={16} className="mt-0.5" />No. 205, Nawala Road, Nugegoda</li>
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-2"><Button icon={MessageCircle}>WhatsApp</Button><Button icon={Mail}>Email</Button></div>
          </Card>
          <Card>
            <p className="text-sm text-fg2">Outstanding payable</p>
            <p className="font-heading text-2xl font-bold text-orange-600 tnum dark:text-orange-500">{rs(s.outstanding)}</p>
            <dl className="mt-4 space-y-2 text-sm">{[["Total purchases (YTD)", rs(s.total)], ["Payment terms", "Net 30"], ["Credit limit", rs(500_000)], ["Oldest unpaid invoice", "24 days"]].map(([a, b]) => <div key={a} className="flex justify-between"><dt className="text-fg2">{a}</dt><dd className="font-semibold tnum">{b}</dd></div>)}</dl>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Monthly purchases"><VBars data={["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((m, i) => ({ x: m, v: [412, 388, 455, 501, 476, 284][i] * 1000 }))} keys={[{ k: "v", label: "Purchases" }]} height={200} /></Card>
          <div>
            <Tabs value={tab} onChange={setTab} className="mb-4" tabs={[{ v: "history", label: "Purchase history", count: 38 }, { v: "payments", label: "Payments", count: 31 }, { v: "products", label: "Products supplied", count: 42 }, { v: "notes", label: "Notes" }]} />
            {tab === "history" && (
              <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>PO #</th><th>Date</th><th className="text-right">Total</th><th>Status</th></tr></thead>
                <tbody>{[["PO-C03-00418", "19/11/2026", 96_400, "Partially Received"], ["PO-C03-00402", "08/11/2026", 188_100, "Received"], ["PO-C03-00391", "28/10/2026", 142_750, "Received"], ["PO-KDY-00120", "21/10/2026", 76_200, "Received"]].map(([a, b, c, d]) => <tr key={a as string}><td className="font-semibold">{a}</td><td className="text-fg2">{b}</td><td className="text-right">{rs(c as number)}</td><td><Status s={d as string} /></td></tr>)}</tbody></table></div>
            )}
            {tab === "payments" && (
              <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th></tr></thead>
                <tbody>{[["15/11/2026", "Bank transfer", "BOC TT 88213", 150_000], ["01/11/2026", "Cheque", "Sampath 004512 · 05/11/2026", 188_100], ["18/10/2026", "Cash", "PV-00214", 25_000]].map(([a, b, c, d]) => <tr key={c as string}><td className="text-fg2">{a}</td><td>{b}</td><td className="font-mono text-cap">{c}</td><td className="text-right font-semibold">{rs(d as number)}</td></tr>)}</tbody></table></div>
            )}
            {tab === "products" && <div className="grid gap-3 sm:grid-cols-2">{[products[1], products[4], products[29], products[28]].map((p) => <div key={p.id} className="card flex items-center gap-3 p-3"><ProductThumb p={p} className="h-12 w-12" size={20} /><div className="flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-cap text-fg2">Last cost {rs(p.cost)}</p></div></div>)}</div>}
            {tab === "notes" && <Card><Textarea defaultValue="Delivers Tuesdays & Fridays before 10 am. Call Asanka for urgent orders. 2% discount if paid within 7 days." /></Card>}
          </div>
        </div>
      </div>
    </>
  );
}

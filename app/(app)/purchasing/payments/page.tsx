"use client";
import { useState } from "react";
import { Banknote, Building, FileCheck2 } from "lucide-react";
import { AddonInput, Button, Card, Checkbox, Field, Input, PageHeader, Select, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { suppliers } from "@/lib/data";
import { cn, rs } from "@/lib/format";

const invs = [{ id: "CBL/INV/77120", date: "19/11/2026", due: "19/12/2026", amt: 96_400 }, { id: "CBL/INV/76988", date: "08/11/2026", due: "08/12/2026", amt: 188_100 }];

export default function SupplierPayments() {
  const [m, setM] = useState("Cheque");
  const [sel, setSel] = useState<string[]>(["CBL/INV/76988"]);
  const amt = invs.filter((i) => sel.includes(i.id)).reduce((s, i) => s + i.amt, 0);
  return (
    <>
      <PageHeader title="Supplier payments" sub="Record payments against supplier invoices" />
      <SubNav module="purchasing" />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card title="Outstanding invoices" sub={suppliers[0].name} pad={false}>
            <table className="tbl"><thead><tr><th className="w-12" /><th>Invoice</th><th>Date</th><th>Due</th><th className="text-right">Amount</th></tr></thead>
              <tbody>{invs.map((i) => <tr key={i.id} className={cn(sel.includes(i.id) && "sel")}><td><Checkbox checked={sel.includes(i.id)} onChange={(v) => setSel(v ? [...sel, i.id] : sel.filter((x) => x !== i.id))} /></td><td className="font-semibold">{i.id}</td><td className="text-fg2">{i.date}</td><td className="text-fg2">{i.due}</td><td className="text-right font-semibold">{rs(i.amt)}</td></tr>)}</tbody>
            </table>
          </Card>
          <Card title="Payment history" pad={false}>
            <table className="tbl"><thead><tr><th>Date</th><th>Supplier</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
              <tbody>{[["15/11/2026", suppliers[0].name, "Bank transfer", "BOC TT 88213", 150_000, "Completed"], ["12/11/2026", suppliers[1].name, "Cheque", "Sampath 004509 · 20/11/2026", 240_000, "Pending"], ["05/11/2026", suppliers[5].name, "Cash", "PV-00221", 18_400, "Completed"]].map((r) => <tr key={r[3] as string}><td className="text-fg2">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td className="font-mono text-cap">{r[3]}</td><td className="text-right font-semibold">{rs(r[4] as number)}</td><td><Status s={r[5] as string} label={r[5] === "Pending" ? "Cheque not cleared" : "Cleared"} /></td></tr>)}</tbody>
            </table>
          </Card>
        </div>
        <Card title="Record payment" className="h-fit">
          <div className="space-y-4">
            <Field label="Supplier"><Select options={suppliers.map((s) => s.name)} /></Field>
            <div className="grid grid-cols-3 gap-2">{[["Cash", Banknote], ["Bank transfer", Building], ["Cheque", FileCheck2]].map(([l, I]) => { const Ic = I as typeof Banknote; return <button key={l as string} onClick={() => setM(l as string)} aria-pressed={m === l} className={cn("flex h-16 flex-col items-center justify-center gap-1 rounded-ctl border text-cap font-semibold", m === l ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}><Ic size={20} />{l as string}</button>; })}</div>
            <Field label="Amount"><AddonInput prefix="Rs." value={amt.toLocaleString("en-LK", { minimumFractionDigits: 2 })} readOnly className="h-12 font-semibold" /></Field>
            {m === "Cheque" && <div className="grid grid-cols-2 gap-3"><Field label="Cheque number"><Input defaultValue="004513" /></Field><Field label="Cheque date"><Input type="date" defaultValue="2026-11-28" /></Field><Field label="Bank" className="col-span-2"><Select options={["Sampath Bank", "Commercial Bank", "Bank of Ceylon", "People's Bank", "HNB"]} /></Field></div>}
            {m === "Bank transfer" && <Field label="Transfer reference"><Input placeholder="e.g. BOC TT 88214" /></Field>}
            <Field label="Payment date"><Input type="date" defaultValue="2026-11-21" /></Field>
            <Button variant="primary" size="l" className="w-full" disabled={!amt}>Record {rs(amt)}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

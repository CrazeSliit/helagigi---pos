"use client";
import { useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, SearchInput, Select, Textarea, Avatar, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

export default function Adjust() {
  const [reason, setReason] = useState("Damage");
  const [lines, setLines] = useState([{ p: products[2], cur: 18, next: 15 }, { p: products[6], cur: 220, next: 214 }, { p: products[29], cur: 340, next: 352 }]);
  const value = lines.reduce((s, l) => s + (l.next - l.cur) * l.p.cost, 0);
  return (
    <>
      <PageHeader title="Stock adjustment" sub="ADJ-C03-00087 · Draft" actions={<><Button>Save draft</Button><Button variant="primary" icon={ShieldCheck}>Submit for approval</Button></>} />
      <SubNav module="inventory" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Items" pad={false} action={<SearchInput placeholder="Scan or search to add…" className="w-64" />}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Product</th><th className="text-right">Current qty</th><th>New qty</th><th className="text-right">Difference</th><th className="text-right">Value</th><th className="w-12" /></tr></thead>
              <tbody>
                {lines.map((l, i) => {
                  const d = l.next - l.cur;
                  return (
                    <tr key={l.p.id}>
                      <td><span className="flex items-center gap-3"><ProductThumb p={l.p} className="h-10 w-10" size={18} /><span className="font-semibold">{l.p.name}</span></span></td>
                      <td className="text-right">{l.cur}</td>
                      <td><Input inputMode="numeric" value={l.next} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, next: +e.target.value || 0 } : x)))} className="h-10 w-24" /></td>
                      <td className={cn("text-right font-semibold", d < 0 ? "text-danger" : d > 0 ? "text-success" : "")}>{d > 0 ? "+" : d < 0 ? "−" : ""}{Math.abs(d)}</td>
                      <td className={cn("text-right", d < 0 ? "text-danger" : "text-success")}>{rs(d * l.p.cost)}</td>
                      <td><button aria-label="Remove" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-fg2 hover:text-danger"><Trash2 size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line p-4"><Button variant="ghost" icon={Plus}>Add product</Button><span className="text-sm">Net value: <b className={cn("tnum", value < 0 ? "text-danger" : "text-success")}>{rs(value)}</b></span></div>
        </Card>
        <div className="space-y-6">
          <Card title="Details">
            <div className="space-y-4">
              <Field label="Branch"><Select options={["Colombo 03", "Kandy", "Kurunegala"]} /></Field>
              <Field label="Reason"><div className="grid grid-cols-2 gap-2">{["Damage", "Theft", "Correction", "Expired", "Internal use"].map((r) => <button key={r} onClick={() => setReason(r)} aria-pressed={reason === r} className={cn("h-11 rounded-ctl border text-sm font-semibold", reason === r ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}>{r}</button>)}</div></Field>
              <Field label="Notes"><Textarea defaultValue="Cream Soda crate dropped during unloading — 3 bottles broken. Yoghurt cups leaking in chiller 2." /></Field>
            </div>
          </Card>
          <Card title="Approval">
            <div className="flex items-center gap-3"><Avatar name="Dilani Fernando" color="#1A3170" /><div className="flex-1"><p className="text-sm font-semibold">Dilani Fernando</p><p className="text-cap text-fg2">Manager · required for losses over Rs. 1,000</p></div><Status s="Pending" /></div>
          </Card>
        </div>
      </div>
    </>
  );
}

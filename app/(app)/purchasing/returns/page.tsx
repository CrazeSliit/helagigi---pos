"use client";
import { FileDown, Send } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products, suppliers } from "@/lib/data";
import { rs } from "@/lib/format";

const lines = [{ p: products[6], q: 12, reason: "Expired", batch: "HL-2611-A" }, { p: products[2], q: 3, reason: "Damaged in transit", batch: "EH-CS-1102" }];

export default function PurchaseReturns() {
  const total = lines.reduce((s, l) => s + l.q * l.p.cost, 0);
  return (
    <>
      <PageHeader title="Purchase return" sub="PR-C03-00027 · Debit note DN-00027" actions={<><Button icon={FileDown}>Preview debit note</Button><Button variant="primary" icon={Send}>Return & send debit note</Button></>} />
      <SubNav module="purchasing" />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card><div className="grid gap-4 md:grid-cols-3"><Field label="Supplier"><Select options={[suppliers[2].name, ...suppliers.map((s) => s.name)]} /></Field><Field label="Branch"><Select options={["Colombo 03", "Kandy", "Kurunegala"]} /></Field><Field label="Against GRN"><Input defaultValue="GRN-C03-00298" /></Field></div></Card>
          <Card title="Items to return" pad={false}>
            <table className="tbl"><thead><tr><th>Product</th><th>Batch</th><th>Qty</th><th>Reason</th><th className="text-right">Value</th></tr></thead>
              <tbody>{lines.map((l) => <tr key={l.p.id}><td><span className="flex items-center gap-3"><ProductThumb p={l.p} className="h-10 w-10" size={18} /><span className="font-semibold">{l.p.name}</span></span></td><td className="font-mono text-cap">{l.batch}</td><td><Input defaultValue={l.q} className="h-10 w-20" /></td><td><Select className="w-48" options={[l.reason, "Expired", "Damaged in transit", "Wrong item", "Quality issue"]} /></td><td className="text-right font-semibold">{rs(l.q * l.p.cost)}</td></tr>)}</tbody>
            </table>
          </Card>
          <Card title="Note"><Textarea defaultValue="Collected by EH distribution van on 22/11/2026. Credit to be adjusted against next invoice." /></Card>
        </div>
        <Card title="Debit note preview">
          <div className="rounded-ctl border border-line bg-white p-5 text-[12px] text-black">
            <div className="flex items-start justify-between">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/wordmark.png" alt="HeladiGi" className="w-28" /><div className="text-right"><p className="font-bold">DEBIT NOTE</p><p>DN-00027</p><p>21/11/2026</p></div></div>
            <p className="mt-4 font-semibold">To: {suppliers[2].name}</p><p>Ref: GRN-C03-00298</p>
            <table className="mt-3 w-full"><tbody>{lines.map((l) => <tr key={l.p.id} className="border-b border-gray-200"><td className="py-1">{l.p.name} × {l.q}</td><td className="py-1 text-right">{rs(l.q * l.p.cost)}</td></tr>)}</tbody></table>
            <div className="mt-2 flex justify-between font-bold"><span>Total debit (incl. VAT)</span><span>{rs(total * 1.18)}</span></div>
          </div>
        </Card>
      </div>
    </>
  );
}

"use client";
import { useState } from "react";
import { Mail, MessageCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Select, Textarea, Badge } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products, suppliers, stockState } from "@/lib/data";
import { rs } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function NewPO() {
  const { toast } = useApp();
  const [lines, setLines] = useState([{ p: products[1], q: 48, c: 468, suggested: false }, { p: products[4], q: 36, c: 318, suggested: false }]);
  const suggest = () => {
    const low = products.filter((p) => stockState(p) !== "in" && !lines.some((l) => l.p.id === p.id)).slice(0, 4);
    setLines([...lines, ...low.map((p) => ({ p, q: Math.max(p.reorder * 2 - p.stock, 12), c: p.cost, suggested: true }))]);
    toast({ tone: "info", title: `${low.length} low-stock items added`, body: "Quantities fill stock to 2× reorder level" });
  };
  const sub = lines.reduce((s, l) => s + l.q * l.c, 0);
  return (
    <>
      <PageHeader title="New purchase order" sub="PO-C03-00421 · Draft" actions={<><Button>Save draft</Button><Button icon={MessageCircle}>Send via WhatsApp</Button><Button variant="primary" icon={Mail}>Send to supplier</Button></>} />
      <SubNav module="purchasing" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Supplier" required><Select options={suppliers.map((s) => s.name)} /></Field>
              <Field label="Deliver to branch"><Select options={["Colombo 03", "Kandy", "Kurunegala"]} /></Field>
              <Field label="Expected delivery"><Input type="date" defaultValue="2026-11-25" /></Field>
            </div>
          </Card>
          <Card title="Line items" pad={false} action={<Button icon={Sparkles} variant="secondary" size="s" onClick={suggest}>Suggest reorder items</Button>}>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Product</th><th>Qty</th><th>Unit cost</th><th className="text-right">Tax</th><th className="text-right">Total</th><th className="w-12" /></tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.p.id}>
                      <td><span className="flex items-center gap-3"><ProductThumb p={l.p} className="h-10 w-10" size={18} /><span><span className="block font-semibold">{l.p.name}</span><span className="text-cap text-fg2">In stock {l.p.stock} · reorder {l.p.reorder}</span></span>{l.suggested && <Badge tone="orange">Suggested</Badge>}</span></td>
                      <td><Input value={l.q} inputMode="numeric" onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, q: +e.target.value || 0 } : x)))} className="h-10 w-20" /></td>
                      <td><AddonInput prefix="Rs." value={l.c} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, c: +e.target.value || 0 } : x)))} className="h-10 w-32" /></td>
                      <td className="text-right text-fg2">18%</td>
                      <td className="text-right font-semibold">{rs(l.q * l.c)}</td>
                      <td><button aria-label="Remove" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-fg2 hover:text-danger"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line p-4"><Button variant="ghost" icon={Plus}>Add product</Button></div>
          </Card>
          <Card title="Notes to supplier"><Textarea defaultValue="Please deliver before 10:00 am. Pallets to rear entrance on Lauries Road." /></Card>
        </div>
        <Card title="Summary" className="h-fit xl:sticky xl:top-24">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-fg2">Items</dt><dd className="tnum">{lines.length}</dd></div>
            <div className="flex justify-between"><dt className="text-fg2">Units</dt><dd className="tnum">{lines.reduce((s, l) => s + l.q, 0)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg2">Subtotal</dt><dd className="tnum">{rs(sub)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg2">VAT 18%</dt><dd className="tnum">{rs(sub * 0.18)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd className="font-heading text-xl tnum">{rs(sub * 1.18)}</dd></div>
          </dl>
          <p className="mt-4 rounded-ctl bg-surface-2 p-3 text-cap text-fg2">The supplier receives a PDF of this order by email or WhatsApp.</p>
        </Card>
      </div>
    </>
  );
}

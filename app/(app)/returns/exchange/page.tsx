"use client";
import { useState } from "react";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { Button, Card, PageHeader, SearchInput, QtyStepper } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

export default function Exchange() {
  const [back] = useState([{ p: products[22], qty: 1, price: 310, v: "120g · Herbal" }]);
  const [out, setOut] = useState([{ p: products[22], qty: 1, price: 400, v: "160g · Strong Teeth" }, { p: products[25], qty: 1, price: 180, v: "" }]);
  const a = back.reduce((s, l) => s + l.qty * l.price, 0);
  const b = out.reduce((s, l) => s + l.qty * l.price, 0);
  const diff = b - a;
  return (
    <>
      <PageHeader title="Exchange" sub="INV-C03-018390 · Fathima Rizwan · 20/11/2026" />
      <SubNav module="returns" />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <Card title="Items coming back" sub="From the original invoice">
          {back.map((l) => (
            <div key={l.p.id} className="flex items-center gap-3 rounded-card bg-danger/5 p-3">
              <ProductThumb p={l.p} className="h-12 w-12" size={20} />
              <div className="flex-1"><p className="font-semibold">{l.p.name}</p><p className="text-cap text-fg2">{l.v} · Reason: Wrong item</p></div>
              <span className="font-semibold tnum text-danger">− {rs(l.price)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm"><span className="text-fg2">Credit from return</span><span className="font-semibold tnum">{rs(a)}</span></div>
        </Card>
        <div className="grid place-items-center self-center"><span className="grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-navy-900 shadow-lift"><ArrowLeftRight size={24} /></span></div>
        <Card title="New items" sub="Scan or search to add">
          <SearchInput placeholder="Scan barcode or search…" className="mb-3" />
          <div className="space-y-2">
            {out.map((l, i) => (
              <div key={i} className="flex items-center gap-3 rounded-card border border-line p-3">
                <ProductThumb p={l.p} className="h-12 w-12" size={20} />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{l.p.name}</p><p className="text-cap text-fg2">{l.v || "—"} · {rs(l.price)}</p></div>
                <QtyStepper value={l.qty} min={1} onChange={(q) => setOut(out.map((x, j) => (j === i ? { ...x, qty: q } : x)))} />
                <button aria-label="Remove" onClick={() => setOut(out.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-ctl text-fg2 hover:bg-danger/10 hover:text-danger"><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
          <Button variant="ghost" icon={Plus} className="mt-2">Add item</Button>
          <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm"><span className="text-fg2">New items total</span><span className="font-semibold tnum">{rs(b)}</span></div>
        </Card>
      </div>
      <div className={cn("mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card p-6", diff > 0 ? "bg-orange-100 text-navy-900" : "bg-success/10")}>
        <div><p className="text-sm font-semibold opacity-80">{diff > 0 ? "Customer pays the difference" : "Refund to customer"}</p><p className="font-heading text-[40px] font-bold leading-tight tnum">{rs(Math.abs(diff))}</p><p className="text-sm opacity-80 tnum">{rs(b)} new − {rs(a)} returned</p></div>
        <Button variant="primary" size="pos">{diff > 0 ? `Collect ${rs(diff)}` : `Refund ${rs(-diff)}`}</Button>
      </div>
    </>
  );
}

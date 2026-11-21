"use client";
import { useState } from "react";
import { Printer, Plus, Trash2 } from "lucide-react";
import { Button, Card, PageHeader, QtyStepper, SearchInput, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

const TEMPLATES = [{ id: "s", name: "Shelf 38 × 25 mm", w: 152, h: 100 }, { id: "m", name: "Product 50 × 30 mm", w: 200, h: 120 }, { id: "l", name: "Price tag 60 × 40 mm", w: 220, h: 146 }];

function Bars({ code }: { code: string }) {
  const bits = code.split("").flatMap((d, i) => [1 + ((+d + i) % 3), 1 + ((+d * 7 + i) % 2)]);
  return (
    <svg viewBox={`0 0 ${bits.reduce((a, b) => a + b, 0) + 4} 30`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden>
      {bits.reduce<{ x: number; el: React.ReactElement[] }>((acc, w, i) => { if (i % 2 === 0) acc.el.push(<rect key={i} x={acc.x + 2} y="0" width={w} height="30" fill="#000" />); acc.x += w; return acc; }, { x: 0, el: [] }).el}
    </svg>
  );
}

export default function Labels() {
  const [items, setItems] = useState([{ p: products[0], n: 4 }, { p: products[1], n: 6 }, { p: products[3], n: 2 }, { p: products[10], n: 4 }]);
  const [tpl, setTpl] = useState("m");
  const [showPrice, setShowPrice] = useState(true);
  const t = TEMPLATES.find((x) => x.id === tpl)!;
  const all = items.flatMap((i) => Array.from({ length: i.n }, () => i.p));
  return (
    <>
      <PageHeader title="Barcode labels" sub={`${all.length} labels ready`} actions={<Button variant="primary" icon={Printer}>Print {all.length} labels</Button>} />
      <SubNav module="products" />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card title="Products">
            <SearchInput placeholder="Search or scan to add…" className="mb-3" />
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li key={it.p.id} className="flex items-center gap-3 rounded-card border border-line p-2.5">
                  <ProductThumb p={it.p} className="h-10 w-10" size={18} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{it.p.name}</span><span className="font-mono text-[11px] text-fg2">{it.p.barcode}</span></span>
                  <QtyStepper value={it.n} min={1} onChange={(n) => setItems(items.map((x, j) => (j === i ? { ...x, n } : x)))} />
                  <button aria-label="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-ctl text-fg2 hover:text-danger"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" icon={Plus} className="mt-2">Add products</Button>
          </Card>
          <Card title="Template">
            <div className="space-y-2">
              {TEMPLATES.map((x) => (
                <button key={x.id} onClick={() => setTpl(x.id)} aria-pressed={tpl === x.id} className={cn("flex h-14 w-full items-center gap-3 rounded-ctl border px-4 text-left text-sm font-semibold", tpl === x.id ? "border-orange-500 bg-orange-100/50" : "border-line hover:bg-tint")}>
                  <span className="rounded border-2 border-current" style={{ width: x.w / 8, height: x.h / 8 }} />{x.name}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3"><Toggle checked={showPrice} onChange={setShowPrice} label="Show price" /><Toggle checked label="Show product name" /><Toggle checked={false} label="Show MRP" /></div>
          </Card>
        </div>
        <Card title="Live preview" sub="A4 sheet · Zebra ZD220 compatible">
          <div className="rounded-card bg-surface-2 p-6">
            <div className="mx-auto flex max-w-[760px] flex-wrap gap-3 bg-white p-4 shadow-soft">
              {all.map((p, i) => (
                <div key={i} className="flex flex-col justify-between rounded border border-dashed border-gray-300 p-2 text-black" style={{ width: t.w, height: t.h }}>
                  <p className="truncate text-[10px] font-semibold leading-tight">{p.name}</p>
                  <Bars code={p.barcode} />
                  <div className="flex items-end justify-between"><span className="font-mono text-[9px]">{p.barcode}</span>{showPrice && <span className="text-[13px] font-bold">{rs(p.price)}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

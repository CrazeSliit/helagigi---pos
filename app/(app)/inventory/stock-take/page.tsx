"use client";
import { useState } from "react";
import { CheckCircle2, Pause, ScanBarcode } from "lucide-react";
import { Button, Card, PageHeader, Progress, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

export default function StockTake() {
  const [rows] = useState(products.slice(0, 12).map((p, i) => ({ p, exp: p.stock, got: i === 2 ? p.stock - 3 : i === 6 ? p.stock + 4 : i === 9 ? p.stock - 1 : i > 9 ? null : p.stock })));
  const counted = rows.filter((r) => r.got !== null).length;
  const variance = rows.reduce((s, r) => s + (r.got === null ? 0 : (r.got - r.exp) * r.p.cost), 0);
  return (
    <>
      <PageHeader title="Stock take · Dairy & Beverages" sub="SC-C03-0019 · started 21/11/2026 07:30 by Nuwan E." actions={<><Button icon={Pause}>Pause session</Button><Button variant="primary" icon={CheckCircle2}>Finalize & apply</Button></>} />
      <SubNav module="inventory" />
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <Card><p className="text-sm text-fg2">Progress</p><p className="font-heading text-xl font-semibold tnum">{counted + 100} / 186 items</p><div className="mt-3"><Progress value={((counted + 100) / 186) * 100} /></div></Card>
        <Card><p className="text-sm text-fg2">Items with variance</p><p className="font-heading text-xl font-semibold tnum text-[#8A6500] dark:text-warning">3</p><p className="text-cap text-fg2">Recount suggested before finalizing</p></Card>
        <Card><p className="text-sm text-fg2">Variance value</p><p className={cn("font-heading text-xl font-semibold tnum", variance < 0 ? "text-danger" : "text-success")}>{rs(variance)}</p><p className="text-cap text-fg2">at cost price</p></Card>
      </div>
      <div className="card mb-6 flex items-center gap-4 border-2 border-orange-500 p-4">
        <span className="grid h-14 w-14 place-items-center rounded-card bg-orange-100 text-navy-900"><ScanBarcode size={28} /></span>
        <div className="flex-1"><p className="font-semibold">Scanner ready — scan items to count</p><p className="text-sm text-fg2">Last scan: Highland Set Yoghurt 80g · +1 (count 224)</p></div>
        <input className="field h-12 w-64" placeholder="Or type barcode…" />
      </div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Product</th><th className="text-right">Expected</th><th className="text-right">Counted</th><th className="text-right">Variance</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const d = r.got === null ? null : r.got - r.exp;
                return (
                  <tr key={r.p.id} className={cn(d ? (d < 0 ? "bg-danger/[.06]" : "bg-warning/10") : "")}>
                    <td><span className="flex items-center gap-3"><ProductThumb p={r.p} className="h-10 w-10" size={18} /><span className="font-semibold">{r.p.name}</span></span></td>
                    <td className="text-right">{r.exp}</td>
                    <td className="text-right font-semibold">{r.got ?? <span className="text-muted">—</span>}</td>
                    <td className={cn("text-right font-semibold", d && d < 0 ? "text-danger" : d ? "text-[#8A6500] dark:text-warning" : "")}>{d === null ? "" : d > 0 ? `+${d}` : d === 0 ? "0" : `−${-d}`}</td>
                    <td>{d === null ? <Status s="Draft" label="Not counted" /> : d === 0 ? <Status s="Balanced" label="Matches" /> : d < 0 ? <Status s="Short" label="Short" /> : <Status s="Over" label="Over" />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

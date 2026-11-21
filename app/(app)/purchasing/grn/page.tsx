"use client";
import { AlertTriangle, Check } from "lucide-react";
import { AddonInput, Banner, Button, Card, Input, PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

const rows = [
  { p: products[1], ord: 48, rec: 48, cost: 468, newCost: 468, batch: "MC-2611", exp: "2027-05-14" },
  { p: products[4], ord: 36, rec: 30, cost: 318, newCost: 318, batch: "MB-2611", exp: "2027-04-02" },
  { p: products[29], ord: 200, rec: 200, cost: 46, newCost: 48, batch: "CB-TR-1120", exp: "2027-01-20" },
  { p: products[28], ord: 24, rec: 26, cost: 430, newCost: 430, batch: "KD-1109", exp: "2027-08-30" },
];

export default function GRN() {
  return (
    <>
      <PageHeader title="Goods received note" sub="GRN-C03-00312 against PO-C03-00418 · Ceylon Biscuits Ltd (Munchee)" actions={<><Button>Save draft</Button><Button variant="primary" icon={Check}>Post GRN & update stock</Button></>} />
      <SubNav module="purchasing" />
      <div className="mb-6"><Banner tone="warning" title="3 discrepancies found">Maliban Gold Marie short by 6 · Kandos over by 2 · Tiara cost increased Rs. 46.00 → Rs. 48.00</Banner></div>
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Product</th><th className="text-right">Ordered</th><th>Received</th><th>Batch #</th><th>Expiry</th><th>Unit cost</th><th>Check</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const d = r.rec - r.ord; const costUp = r.newCost !== r.cost;
                return (
                  <tr key={r.p.id} className={cn((d || costUp) && "bg-warning/[.08]")}>
                    <td><span className="flex items-center gap-3"><ProductThumb p={r.p} className="h-10 w-10" size={18} /><span className="font-semibold">{r.p.name}</span></span></td>
                    <td className="text-right">{r.ord}</td>
                    <td><Input defaultValue={r.rec} inputMode="numeric" className={cn("h-10 w-20", d && "border-warning")} /></td>
                    <td><Input defaultValue={r.batch} className="h-10 w-32 font-mono text-cap" /></td>
                    <td><Input type="date" defaultValue={r.exp} className="h-10 w-40" /></td>
                    <td><div className="flex items-center gap-2"><AddonInput prefix="Rs." defaultValue={r.newCost.toFixed(2)} className={cn("h-10 w-32", costUp && "border-warning")} />{costUp && <span className="text-cap text-[#8A6500] dark:text-warning">was {rs(r.cost)}</span>}</div></td>
                    <td>{d < 0 ? <Status s="Short" label={`${-d} short`} /> : d > 0 ? <Status s="Over" label={`${d} over`} /> : costUp ? <span className="inline-flex items-center gap-1 text-cap font-semibold text-[#8A6500] dark:text-warning"><AlertTriangle size={14} />Cost change</span> : <Status s="Balanced" label="OK" />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-5 text-sm">
          <span className="text-fg2">Supplier invoice <b className="text-fg">CBL/INV/77120</b> · delivered by Asanka D.</span>
          <span>Received value <b className="font-heading text-lg tnum">{rs(rows.reduce((s, r) => s + r.rec * r.newCost, 0) * 1.18)}</b> <span className="text-fg2">incl. VAT</span></span>
        </div>
      </Card>
    </>
  );
}

"use client";
import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { PageHeader, Segmented, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { products } from "@/lib/data";
import { cn } from "@/lib/format";

const batches = [
  { p: 6, b: "HL-2611-A", exp: "18/11/2026", days: -3, qty: 12, br: "Colombo 03" },
  { p: 6, b: "HL-2611-C", exp: "24/11/2026", days: 3, qty: 48, br: "Colombo 03" },
  { p: 5, b: "KM-1124", exp: "26/11/2026", days: 5, qty: 7, br: "Colombo 03" },
  { p: 11, b: "KJ-0926", exp: "04/12/2026", days: 13, qty: 31, br: "Kandy" },
  { p: 31, b: "KK-1102", exp: "12/12/2026", days: 21, qty: 19, br: "Colombo 03" },
  { p: 7, b: "EH-IC-1031", exp: "19/12/2026", days: 28, qty: 34, br: "Kurunegala" },
  { p: 0, b: "AN-2607", exp: "15/02/2027", days: 86, qty: 84, br: "Colombo 03" },
  { p: 1, b: "MC-2610", exp: "28/03/2027", days: 127, qty: 142, br: "Colombo 03" },
  { p: 26, b: "PN-25X", exp: "30/06/2028", days: 587, qty: 480, br: "Kandy" },
].map((x, i) => ({ id: i, ...x, prod: products[x.p] }));

export default function Batches() {
  const [view, setView] = useState<"table" | "timeline">("table");
  const status = (d: number) => (d < 0 ? <Status s="Expired" /> : d <= 30 ? <Status s="Expiring" label={`${d} days left`} /> : <Status s="Active" label="Good" />);
  return (
    <>
      <PageHeader title="Batches & expiry" sub="14 batches expire in the next 30 days · 1 expired" />
      <SubNav module="inventory" />
      <FilterBar placeholder="Search product or batch…" filters={[{ label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }, { label: "Any expiry", options: ["Expired", "Within 7 days", "Within 30 days"] }]}>
        <Segmented value={view} onChange={setView} options={[{ v: "table", label: <span className="inline-flex items-center gap-1"><List size={14} />Table</span> }, { v: "timeline", label: <span className="inline-flex items-center gap-1"><CalendarDays size={14} />Timeline</span> }]} />
      </FilterBar>
      {view === "table" ? (
        <DataTable rows={batches} cols={[
          { key: "prod", label: "Product", render: (r) => <span className="font-semibold">{r.prod.name}</span> },
          { key: "b", label: "Batch #", render: (r) => <span className="font-mono text-cap">{r.b}</span> },
          { key: "br", label: "Branch", render: (r) => <span className="text-fg2">{r.br}</span> },
          { key: "qty", label: "Qty", align: "right" },
          { key: "exp", label: "Expiry date", render: (r) => <span className={cn("font-semibold", r.days < 0 ? "text-danger" : r.days <= 30 ? "text-[#8A6500] dark:text-warning" : "")}>{r.exp}</span>, sort: (r) => r.days },
          { key: "st", label: "Status", render: (r) => status(r.days) },
        ]} />
      ) : (
        <div className="card overflow-x-auto p-6">
          <div className="relative min-w-[760px]">
            <div className="mb-3 ml-56 grid grid-cols-6 text-cap font-semibold text-fg2">{["Today", "+1 wk", "+2 wk", "+3 wk", "+4 wk", "+5 wk"].map((w) => <span key={w}>{w}</span>)}</div>
            <span className="absolute bottom-0 top-6 w-0.5 bg-orange-500" style={{ left: "calc(14rem + 0px)" }} />
            {batches.filter((b) => b.days < 40).map((b) => (
              <div key={b.id} className="flex h-12 items-center border-t border-line">
                <span className="w-56 shrink-0 truncate pr-3 text-sm font-semibold">{b.prod.name}<span className="block font-mono text-[11px] font-normal text-fg2">{b.b} · {b.qty} units</span></span>
                <div className="relative h-full flex-1">
                  <span className={cn("absolute top-1/2 flex h-7 -translate-y-1/2 items-center rounded-full px-3 text-[11px] font-bold", b.days < 0 ? "bg-danger text-white" : b.days <= 7 ? "bg-warning text-navy-900" : b.days <= 30 ? "bg-amber-400/60 text-navy-900" : "bg-sky-300 text-navy-900")}
                    style={{ left: `${Math.max(0, (b.days / 42) * 100)}%` }}>{b.exp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

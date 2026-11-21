"use client";
import { Crown } from "lucide-react";
import { Avatar, Card, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { HBars } from "@/components/charts";
import { staff } from "@/lib/data";
import { cn, rs } from "@/lib/format";

export default function Performance() {
  const ppl = staff.filter((s) => s.sales);
  return (
    <>
      <PageHeader title="Staff performance" sub="Today · all branches" />
      <SubNav module="staff" />
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ppl.map((s, i) => (
          <div key={s.id} className={cn("card p-5", i === 0 && "border-orange-500 ring-4 ring-orange-500/10")}>
            <div className="flex items-center gap-3"><Avatar name={s.name} size={44} color={s.color} /><div><p className="flex items-center gap-1.5 font-semibold">{s.name}{i === 0 && <Crown size={15} className="text-amber-400" />}</p><p className="text-cap text-fg2">{s.branch}</p></div></div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-cap text-fg2">Sales</dt><dd className="font-heading font-semibold tnum">{rs(s.sales!, { decimals: false })}</dd></div>
              <div><dt className="text-cap text-fg2">Transactions</dt><dd className="font-heading font-semibold tnum">{s.tx}</dd></div>
              <div><dt className="text-cap text-fg2">Avg basket</dt><dd className="font-semibold tnum">{rs(s.sales! / s.tx!, { decimals: false })}</dd></div>
              <div><dt className="text-cap text-fg2">Refunds</dt><dd className="font-semibold tnum">{[1, 0, 2, 0][i]}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <Card title="Sales by staff"><HBars data={ppl.map((s) => ({ name: s.name.split(" ")[0], value: s.sales! }))} height={220} /></Card>
    </>
  );
}

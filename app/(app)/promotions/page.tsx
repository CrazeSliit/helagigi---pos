"use client";
import Link from "next/link";
import { useState } from "react";
import { BadgePercent, CalendarClock, Clock, Gift, Layers, Package, Plus, Tag } from "lucide-react";
import { Badge, PageHeader, Tabs, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { cn } from "@/lib/format";

const promos = [
  { n: "Avurudu Special", t: "% off", i: BadgePercent, d: "10% off orders over Rs. 2,500", p: "01/11 – 30/11/2026", used: 1_284, s: "active" },
  { n: "Munchee 2 + 1", t: "Buy X Get Y", i: Gift, d: "Buy 2 Super Cream Crackers, get 1 free", p: "15/11 – 15/12/2026", used: 412, s: "active" },
  { n: "Tea-time Happy Hour", t: "Happy hour", i: Clock, d: "15% off Tea & Coffee · weekdays 3–5 pm", p: "Mon–Fri · 15:00–17:00", used: 236, s: "active" },
  { n: "Breakfast Bundle", t: "Bundle price", i: Layers, d: "Anchor 400g + Kist Jam + Bread for Rs. 2,150", p: "01/11 – 31/12/2026", used: 98, s: "active" },
  { n: "Household Week", t: "Category-wide", i: Package, d: "8% off all Household items", p: "01/12 – 07/12/2026", used: 0, s: "scheduled" },
  { n: "Christmas Rs. 500 off", t: "Fixed amount", i: Tag, d: "Rs. 500 off orders over Rs. 7,500", p: "20/12 – 26/12/2026", used: 0, s: "scheduled" },
  { n: "Vesak Dansal Pack", t: "Bundle price", i: Layers, d: "Bulk EGB + Cream Soda cases", p: "08/05 – 14/05/2026", used: 64, s: "expired" },
];

export default function Promotions() {
  const [tab, setTab] = useState("active");
  const [on, setOn] = useState<Record<string, boolean>>({});
  return (
    <>
      <PageHeader title="Promotions" sub="Discounts applied automatically at the POS" actions={<Link href="/promotions/new" className="btn btn-m btn-primary"><Plus size={18} />Create promotion</Link>} />
      <SubNav module="promotions" />
      <Tabs value={tab} onChange={setTab} className="mb-6" tabs={[{ v: "active", label: "Active", count: 4 }, { v: "scheduled", label: "Scheduled", count: 2 }, { v: "expired", label: "Expired", count: 1 }]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promos.filter((p) => p.s === tab).map((p) => (
          <div key={p.n} className={cn("card p-5", p.s === "expired" && "opacity-70")}>
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-card bg-orange-100 text-navy-900"><p.i size={22} /></span>
              <Toggle checked={on[p.n] ?? p.s !== "expired"} onChange={(v) => setOn({ ...on, [p.n]: v })} disabled={p.s === "expired"} />
            </div>
            <Badge tone="sky" className="mt-4">{p.t}</Badge>
            <h3 className="mt-2 font-heading text-lg font-semibold">{p.n}</h3>
            <p className="text-sm text-fg2">{p.d}</p>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-cap">
              <span className="inline-flex items-center gap-1.5 text-fg2"><CalendarClock size={14} />{p.p}</span>
              <span className="font-semibold tnum">{p.used.toLocaleString()} uses</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

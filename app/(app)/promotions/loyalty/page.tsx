"use client";
import { useState } from "react";
import { Crown, Medal, Star } from "lucide-react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Select, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { cn } from "@/lib/format";

const tiers = [
  { n: "Silver", min: "Rs. 0", earn: "1 pt / Rs. 100", perks: ["Points on every purchase", "Birthday SMS offer"], cls: "bg-surface border-2 border-line", chip: "bg-surface-2 text-fg", i: Medal, members: 2_418 },
  { n: "Gold", min: "Rs. 100,000 / yr", earn: "1.5 pts / Rs. 100", perks: ["Everything in Silver", "Exclusive member prices", "Birthday bonus 200 pts"], cls: "bg-gradient-to-br from-amber-400 to-orange-500 text-navy-900", chip: "bg-white/40 text-navy-900", i: Star, members: 742 },
  { n: "Platinum", min: "Rs. 500,000 / yr", earn: "2 pts / Rs. 100", perks: ["Everything in Gold", "Free delivery in Colombo", "Priority credit approval"], cls: "bg-navy-900 text-white", chip: "bg-orange-500 text-navy-900", i: Crown, members: 44 },
];

export default function Loyalty() {
  const [enabled, setEnabled] = useState(true);
  return (
    <>
      <PageHeader title="Loyalty programme" sub="HeladiGi Rewards · 3,204 members" actions={<Button variant="primary">Save changes</Button>} />
      <SubNav module="promotions" />
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.n} className={cn("relative overflow-hidden rounded-card p-6 shadow-soft", t.cls)}>
            <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="flex items-center justify-between"><span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-cap font-bold", t.chip)}><t.i size={14} />{t.n.toUpperCase()}</span><span className="text-cap opacity-80 tnum">{t.members.toLocaleString()} members</span></div>
            <p className="mt-6 font-heading text-2xl font-bold">{t.earn}</p>
            <p className="text-sm opacity-80">From {t.min} spend</p>
            <ul className="mt-4 space-y-1.5 text-sm">{t.perks.map((p) => <li key={p} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-current" />{p}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Earning & redeeming">
          <div className="mb-4"><Toggle checked={enabled} onChange={setEnabled} label="Loyalty programme enabled" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Earn rate" hint="Base rate for Silver"><div className="flex items-center gap-2"><Input defaultValue="1" className="w-20" /><span className="text-sm text-fg2">point per</span><AddonInput prefix="Rs." defaultValue="100" className="w-32" /></div></Field>
            <Field label="Redeem rate"><div className="flex items-center gap-2"><Input defaultValue="1" className="w-20" /><span className="text-sm text-fg2">point =</span><AddonInput prefix="Rs." defaultValue="1.00" className="w-32" /></div></Field>
            <Field label="Minimum points to redeem"><Input defaultValue="200" /></Field>
            <Field label="Max redemption per bill"><AddonInput suffix="%" defaultValue="50" /></Field>
          </div>
        </Card>
        <Card title="Tier thresholds & expiry">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Gold from (12-month spend)"><AddonInput prefix="Rs." defaultValue="100,000" /></Field>
            <Field label="Platinum from (12-month spend)"><AddonInput prefix="Rs." defaultValue="500,000" /></Field>
            <Field label="Points expire after"><Select options={["12 months of inactivity", "24 months", "Never"]} /></Field>
            <Field label="Tier review"><Select options={["Every 12 months", "Every 6 months"]} /></Field>
          </div>
          <div className="mt-4 space-y-3"><Toggle checked label="Earn points on discounted items" /><Toggle checked={false} label="Earn points on credit sales" /></div>
        </Card>
      </div>
    </>
  );
}

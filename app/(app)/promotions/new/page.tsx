"use client";
import { useState } from "react";
import { BadgePercent, Clock, Gift, Layers, Package, Tag, Sparkles, Check } from "lucide-react";
import { AddonInput, Button, Card, Checkbox, Field, Input, PageHeader, Select } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

const TYPES = [
  { v: "pct", l: "% off", i: BadgePercent }, { v: "fixed", l: "Fixed amount off", i: Tag }, { v: "bxgy", l: "Buy X Get Y", i: Gift },
  { v: "bundle", l: "Bundle price", i: Layers }, { v: "happy", l: "Happy hour", i: Clock }, { v: "cat", l: "Category-wide", i: Package },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function NewPromo() {
  const [type, setType] = useState("bxgy");
  const [x, setX] = useState(2);
  const [y, setY] = useState(1);
  const [days, setDays] = useState(DAYS);
  const [groups, setGroups] = useState(["Retail", "VIP"]);
  const p = products[1];
  const preview = type === "bxgy" ? `Customer buys ${x} ${p.name.replace(" 490g", "")}s → gets ${y} free` : type === "pct" ? "Customer spends Rs. 2,500 → gets 10% off (Rs. 250.00)" : type === "happy" ? "Between 3–5 pm, Tea & Coffee items are 15% off" : type === "bundle" ? "Anchor 400g + Kist Jam + Bread → Rs. 2,150.00 (save Rs. 290.00)" : type === "cat" ? "All Household items → 8% off" : "Customer spends Rs. 7,500 → Rs. 500.00 off";
  return (
    <>
      <PageHeader title="Create promotion" actions={<><Button>Save as draft</Button><Button variant="primary">Publish promotion</Button></>} />
      <SubNav module="promotions" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Promotion type">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {TYPES.map((t) => (
                <button key={t.v} onClick={() => setType(t.v)} aria-pressed={type === t.v} className={cn("flex h-16 items-center gap-3 rounded-card border px-4 text-left text-sm font-semibold transition", type === t.v ? "border-orange-500 bg-orange-100/60 ring-2 ring-orange-500/20" : "border-line hover:bg-tint")}>
                  <span className={cn("grid h-9 w-9 place-items-center rounded-ctl", type === t.v ? "bg-orange-500 text-navy-900" : "bg-tint")}><t.i size={18} /></span>{t.l}
                </button>
              ))}
            </div>
          </Card>
          <Card title="Rule">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Promotion name" className="md:col-span-2"><Input defaultValue="Munchee 2 + 1" /></Field>
              {type === "bxgy" ? (
                <>
                  <Field label="Customer buys (qty)"><Input inputMode="numeric" value={x} onChange={(e) => setX(+e.target.value || 1)} /></Field>
                  <Field label="Gets free (qty)"><Input inputMode="numeric" value={y} onChange={(e) => setY(+e.target.value || 1)} /></Field>
                  <Field label="Of product" className="md:col-span-2"><div className="flex items-center gap-3 rounded-ctl border border-line p-2"><ProductThumb p={p} className="h-10 w-10" size={18} /><span className="flex-1 font-semibold">{p.name}</span><span className="text-fg2">{rs(p.price)}</span></div></Field>
                </>
              ) : (
                <>
                  <Field label={type === "fixed" ? "Amount off" : type === "bundle" ? "Bundle price" : "Discount"}>{type === "fixed" || type === "bundle" ? <AddonInput prefix="Rs." defaultValue={type === "bundle" ? "2,150.00" : "500.00"} /> : <AddonInput suffix="%" defaultValue={type === "happy" ? "15" : type === "cat" ? "8" : "10"} />}</Field>
                  <Field label="Applies to">{type === "cat" || type === "happy" ? <Select options={["Tea & Coffee", "Household", "Beverages", "Dairy"]} /> : <Select options={["Whole order", "Specific products", "Specific categories"]} />}</Field>
                </>
              )}
            </div>
          </Card>
          <Card title="Conditions">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Minimum spend"><AddonInput prefix="Rs." defaultValue="0.00" /></Field>
              <Field label="Max uses per customer"><Input defaultValue="Unlimited" /></Field>
              <Field label="Customer groups" className="md:col-span-2"><div className="flex flex-wrap gap-4">{["Retail", "Wholesale", "VIP"].map((g) => <Checkbox key={g} checked={groups.includes(g)} onChange={(v) => setGroups(v ? [...groups, g] : groups.filter((z) => z !== g))} label={g} />)}</div></Field>
              <Field label="Branches" className="md:col-span-2"><div className="flex flex-wrap gap-4">{["Colombo 03", "Kandy", "Kurunegala"].map((b, i) => <Checkbox key={b} checked={i < 2} label={b} />)}</div></Field>
            </div>
          </Card>
          <Card title="Schedule">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Start date"><Input type="date" defaultValue="2026-11-15" /></Field>
              <Field label="End date"><Input type="date" defaultValue="2026-12-15" /></Field>
              <Field label="Days of week" className="md:col-span-2"><div className="flex flex-wrap gap-2">{DAYS.map((d) => <button key={d} onClick={() => setDays(days.includes(d) ? days.filter((z) => z !== d) : [...days, d])} aria-pressed={days.includes(d)} className={cn("h-11 w-14 rounded-ctl border text-sm font-semibold", days.includes(d) ? "border-navy-900 bg-navy-900 text-white dark:border-orange-500 dark:bg-orange-500 dark:text-navy-900" : "border-line hover:bg-tint")}>{d}</button>)}</div></Field>
              <Field label="From time"><Input type="time" defaultValue={type === "happy" ? "15:00" : "00:00"} /></Field>
              <Field label="To time"><Input type="time" defaultValue={type === "happy" ? "17:00" : "23:59"} /></Field>
            </div>
          </Card>
        </div>
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card title="Live preview">
            <div className="rounded-card bg-navy-900 p-5 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-1 text-cap font-bold text-navy-900"><Sparkles size={13} />PROMO</span>
              <p className="mt-3 font-heading text-lg font-semibold leading-snug">{preview}</p>
              <p className="mt-2 text-cap text-white/60">{days.length === 7 ? "Every day" : days.join(", ")} · {groups.join(", ")}</p>
            </div>
            <div className="mt-4 rounded-card border border-line p-3">
              <p className="mb-2 text-cap font-semibold uppercase tracking-wide text-fg2">At the POS</p>
              <div className="flex justify-between text-sm"><span>{x} × Munchee Super Cream…</span><span className="tnum">{rs(x * p.price)}</span></div>
              <div className="flex justify-between text-sm"><span>{y} × Munchee Super Cream… <b className="text-success">FREE</b></span><span className="tnum">{rs(0)}</span></div>
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 text-cap font-semibold text-success"><Check size={14} />Customer saves {rs(y * p.price)}</div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { Avatar, Button, Card, Field, PageHeader, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DenominationCounter, DENOMS } from "@/components/pos-kit";
import { cn, rs } from "@/lib/format";

const EXPECTED = 198_400;

export default function CloseShift() {
  const [v, setV] = useState<Record<number, number>>({ 5000: 24, 1000: 55, 500: 30, 100: 60, 50: 20, 20: 15, 10: 5, 5: 4, 2: 5, 1: 3 });
  const counted = DENOMS.reduce((s, d) => s + d * (v[d] || 0), 0);
  const diff = counted - EXPECTED;
  const state = Math.abs(diff) < 1 ? "balanced" : diff < 0 ? "short" : "over";
  const m = { balanced: ["bg-success/10 border-success/30 text-success", "Balanced", CheckCircle2], short: ["bg-danger/10 border-danger/30 text-danger", "Short", AlertTriangle], over: ["bg-warning/15 border-warning/40 text-[#8A6500] dark:text-warning", "Over", AlertTriangle] }[state] as [string, string, typeof CheckCircle2];
  const I = m[2];
  return (
    <>
      <PageHeader title="Close shift" sub="Kasun Jayasuriya · 08:01 – 15:02 · Colombo 03 · T1" />
      <SubNav module="register" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <DenominationCounter value={v} onChange={setV} compact />
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm"><dt className="text-fg2">Expected cash</dt><dd className="font-semibold tnum">{rs(EXPECTED)}</dd></div>
              <div className="flex justify-between text-sm"><dt className="text-fg2">Counted cash</dt><dd className="font-semibold tnum">{rs(counted)}</dd></div>
            </dl>
            <div className={cn("mt-4 rounded-card border p-4", m[0])}>
              <p className="flex items-center gap-2 text-sm font-semibold"><I size={18} />{m[1]}</p>
              <p className="font-heading text-[32px] font-bold tnum">{diff === 0 ? rs(0) : `${diff > 0 ? "+" : "−"} ${rs(Math.abs(diff))}`}</p>
            </div>
            <Field label="Notes" className="mt-4"><Textarea defaultValue={state === "short" ? "Rs. 1,000 note may have been given as change for Rs. 100 at ~13:30." : ""} placeholder="Explain any variance" className="min-h-[72px]" /></Field>
          </Card>
          <Card>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={18} />Manager approval</p>
            <div className="flex items-center gap-3"><Avatar name="Dilani Fernando" color="#1A3170" size={36} /><span className="flex-1 text-sm">Dilani Fernando</span><Button size="s" variant="secondary" className="shrink-0">Enter PIN</Button></div>
          </Card>
          <Link href="/register/z-report" className="btn btn-pos btn-primary w-full"><FileText size={20} />Close shift & generate Z-Report</Link>
        </div>
      </div>
    </>
  );
}

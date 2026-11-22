"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Button, Card, Field, PageHeader, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DenominationCounter, DENOMS } from "@/components/pos-kit";
import { api, errText } from "@/lib/api";
import { cn, hhmm, rs } from "@/lib/format";
import { branchOf, useSession } from "@/lib/session";
import type { ShiftSummary } from "../page";

export default function CloseShift() {
  const router = useRouter();
  const { me } = useSession();
  const [d, setD] = useState<ShiftSummary | null>(null);
  const [v, setV] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<ShiftSummary | null>("/shifts/current").then((s) => { if (!s) router.replace("/register/open"); else setD(s); }).catch((e) => setErr(errText(e)));
  }, [router]);
  if (!d) return err ? <p role="alert" className="py-20 text-center font-semibold text-danger">{err}</p> : <p className="py-20 text-center text-sm text-fg2" role="status">Loading…</p>;
  const counted = DENOMS.reduce((s, x) => s + x * (v[x] || 0), 0);
  const diff = Math.round((counted - d.expectedCash) * 100) / 100;
  const state = diff === 0 ? "balanced" : diff < 0 ? "short" : "over";
  const m = { balanced: ["bg-success/10 border-success/30 text-success", "Balanced", CheckCircle2], short: ["bg-danger/10 border-danger/30 text-danger", "Short", AlertTriangle], over: ["bg-warning/15 border-warning/40 text-[#8A6500] dark:text-warning", "Over", AlertTriangle] }[state] as [string, string, typeof CheckCircle2];
  const I = m[2];
  const close = async () => {
    if (diff !== 0 && !note.trim()) return setErr("Add a note explaining the difference");
    setBusy(true); setErr("");
    const denominations = Object.fromEntries(DENOMS.filter((x) => v[x]).map((x) => [String(x), v[x]]));
    try {
      await api(`/shifts/${d.shift.id}/close`, { body: { denominations, countedCash: counted, note: note.trim() || undefined } });
      router.push(`/register/z-report?id=${d.shift.id}`);
    } catch (e) { setErr(errText(e)); setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Close shift" sub={`${me.name} · from ${hhmm(new Date(d.shift.openedAt))} · ${branchOf(me)?.name}`} />
      <SubNav module="register" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <DenominationCounter value={v} onChange={setV} compact />
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm"><dt className="text-fg2">Expected cash</dt><dd className="font-semibold tnum">{rs(d.expectedCash)}</dd></div>
              <div className="flex justify-between text-sm"><dt className="text-fg2">Counted cash</dt><dd className="font-semibold tnum">{rs(counted)}</dd></div>
            </dl>
            <div className={cn("mt-4 rounded-card border p-4", m[0])}>
              <p className="flex items-center gap-2 text-sm font-semibold"><I size={18} />{m[1]}</p>
              <p className="font-heading text-[32px] font-bold tnum">{diff === 0 ? rs(0) : `${diff > 0 ? "+" : "−"} ${rs(Math.abs(diff))}`}</p>
            </div>
            <Field label="Notes" required={diff !== 0} className="mt-4"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain any variance" className="min-h-[72px]" /></Field>
            {diff !== 0 && <p className="mt-2 text-cap text-fg2">A manager will need to approve this variance.</p>}
          </Card>
          {err && <p role="alert" className="rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
          <Button variant="primary" size="pos" className="w-full" icon={FileText} loading={busy} onClick={() => void close()}>Close shift & generate Z-Report</Button>
        </div>
      </div>
    </>
  );
}

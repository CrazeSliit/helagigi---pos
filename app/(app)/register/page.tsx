"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, Clock, CreditCard, FileText, Gift, LogOut, QrCode, Wallet } from "lucide-react";
import { AddonInput, Avatar, Button, Card, Field, Input, PageHeader, Segmented, Select } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { Modal } from "@/components/overlays";
import { api, errText } from "@/lib/api";
import { cn, hhmm, rs } from "@/lib/format";
import { branchOf, useSession } from "@/lib/session";
import { useApp } from "@/lib/store";

export type ShiftSummary = {
  shift: { id: string; number: string; openedAt: string; closedAt: string | null; status: string; expectedCash: number | null; countedCash: number | null; variance: number | null; branchId: string };
  payments: { method: string; amount: number }[]; salesCount: number; grossSales: number; discounts: number; tax: number; returnsCount: number; returnsTotal: number;
  openingFloat: number; cashSales: number; cashIn: number; cashOut: number; expectedCash: number;
  cashMovements: { id: string; type: "CASH_IN" | "CASH_OUT"; amount: number; reason: string; createdAt: string }[];
};

export default function CurrentShift() {
  const { toast } = useApp();
  const { me } = useSession();
  const router = useRouter();
  const [d, setD] = useState<ShiftSummary | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("Petty cash — supplies");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [mErr, setMErr] = useState("");
  const load = useCallback(async () => {
    try {
      const s = await api<ShiftSummary | null>("/shifts/current");
      if (!s) return router.replace("/register/open");
      setD(s);
    } catch (e) { setErr(errText(e)); } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void load(); }, [load]);
  const record = async () => {
    if (!d) return;
    const value = Math.round(parseFloat(amount) * 100) / 100;
    if (!(value > 0)) return setMErr("Enter an amount");
    setBusy(true); setMErr("");
    try {
      await api(`/shifts/${d.shift.id}/cash`, { body: { type: dir === "in" ? "CASH_IN" : "CASH_OUT", amount: value, reason: note.trim() ? `${reason}: ${note.trim()}` : reason } });
      setOpen(false); setAmount(""); setNote("");
      toast({ tone: "success", title: `Cash ${dir} recorded` });
      await load();
    } catch (e) { setMErr(errText(e)); } finally { setBusy(false); }
  };
  if (loading) return <p className="py-20 text-center text-sm text-fg2" role="status">Loading…</p>;
  if (err || !d) return <p role="alert" className="py-20 text-center font-semibold text-danger">{err}</p>;
  const amt = (m: string) => d.payments.find((p) => p.method === m)?.amount ?? 0;
  const rows = [
    { l: "Opening float", v: d.openingFloat, i: Wallet },
    { l: "Cash sales (net of refunds)", v: d.cashSales, i: Banknote },
    { l: "Cash in", v: d.cashIn, i: ArrowDownLeft },
    { l: "Cash out", v: -d.cashOut, i: ArrowUpRight },
    { l: "Card sales", v: amt("CARD"), i: CreditCard, nc: true },
    { l: "LankaQR sales", v: amt("LANKAQR"), i: QrCode, nc: true },
    { l: "Credit sales", v: amt("CREDIT"), i: Wallet, nc: true },
    { l: "Gift card sales", v: amt("GIFT_CARD"), i: Gift, nc: true },
  ];
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d.shift.openedAt).getTime()) / 60000));
  return (
    <>
      <PageHeader title="Current shift" sub={`${branchOf(me)?.name} · ${d.shift.number}`} actions={<><Link href={`/register/z-report?id=${d.shift.id}`} className="btn btn-m btn-outline"><FileText size={18} />X-Report</Link><Button icon={ArrowDownLeft} onClick={() => { setMErr(""); setOpen(true); }}>Cash in / out</Button><Link href="/register/close" className="btn btn-m btn-primary"><LogOut size={18} />Close shift</Link></>} />
      <SubNav module="register" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card flex flex-wrap items-center gap-6 p-5">
            <span className="flex items-center gap-3"><Avatar name={me.name} color={me.color} size={44} /><span><span className="block font-semibold">{me.name}</span><span className="text-cap text-fg2">{me.role}</span></span></span>
            <span className="flex items-center gap-2 text-sm"><Clock size={16} className="text-fg2" />Started <b>{hhmm(new Date(d.shift.openedAt))}</b> · running <b className="tnum">{Math.floor(mins / 60)}h {String(mins % 60).padStart(2, "0")}m</b> · <b className="tnum">{d.salesCount}</b> sales</span>
            <span className="ml-auto inline-flex h-8 items-center gap-2 rounded-full bg-success/10 px-3 text-cap font-semibold text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />Shift open</span>
          </div>
          <Card title="Live summary" pad={false}>
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.l} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-ctl bg-tint"><r.i size={18} /></span>
                  <span className="flex-1 text-sm">{r.l}{r.nc && <span className="ml-2 text-cap text-fg2">not in drawer</span>}</span>
                  <span className={cn("font-semibold tnum", r.v < 0 && "text-danger", r.nc && "text-fg2")}>{rs(r.v)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-b-card bg-navy-900 px-5 py-4 text-white dark:bg-navy-700"><span className="font-semibold">Expected cash in drawer</span><span className="font-heading text-2xl font-bold tnum">{rs(d.expectedCash)}</span></div>
          </Card>
        </div>
        <Card title="Cash movements">
          {!d.cashMovements.length && <p className="text-sm text-fg2">No cash in or out this shift.</p>}
          <ul className="space-y-3 text-sm">
            {d.cashMovements.map((m) => {
              const isIn = m.type === "CASH_IN";
              return (
                <li key={m.id} className="flex items-start gap-3">
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", isIn ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>{isIn ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span>
                  <span className="flex-1"><span className="block font-medium">{m.reason}</span><span className="text-cap text-fg2">{hhmm(new Date(m.createdAt))}</span></span>
                  <span className={cn("font-semibold tnum", isIn ? "text-success" : "text-danger")}>{isIn ? "+" : "−"}{rs(m.amount)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Cash in / out" size="s" footer={<><Button size="l" onClick={() => setOpen(false)}>Cancel</Button><Button size="l" variant="primary" loading={busy} onClick={() => void record()}>Record</Button></>}>
        <Segmented size="l" value={dir} onChange={(x) => { setDir(x); setReason(x === "out" ? "Petty cash — supplies" : "Change from bank"); }} options={[{ v: "in", label: "Cash in" }, { v: "out", label: "Cash out" }]} />
        {mErr && <p role="alert" className="mt-3 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{mErr}</p>}
        <div className="mt-4 space-y-4">
          <Field label="Amount" required><AddonInput autoFocus prefix="Rs." inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg font-semibold" /></Field>
          <Field label="Reason"><Select options={dir === "out" ? ["Petty cash — supplies", "Staff meals", "Delivery / transport", "Bank deposit", "Other"] : ["Change from bank", "Owner top-up", "Other"]} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
        </div>
      </Modal>
    </>
  );
}

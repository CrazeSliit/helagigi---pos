"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Check, MapPin, Monitor } from "lucide-react";
import { Logo } from "@/components/brand";
import { LangSwitch } from "@/components/shell";
import { Avatar, Button } from "@/components/ui";
import { api, apiAll, ApiFail, errText } from "@/lib/api";
import { homeFor } from "@/lib/features";
import { cn } from "@/lib/format";
import type { Me } from "@/lib/session";

type BranchRow = { id: string; name: string; address: string | null; terminals: { id: string; name: string }[] };

export default function BranchSelect() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [b, setB] = useState("");
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const m = await api<Me>("/auth/me", { noRedirect: true });
        if (m.locked) return window.location.assign("/lock");
        const all = await apiAll<BranchRow>("/branches");
        const mine = all.filter((x) => m.branches.some((y) => y.id === x.id));
        setMe(m); setRows(mine);
        const first = mine.find((x) => x.id === m.branchId) ?? mine[0];
        if (first) { setB(first.id); setT(first.terminals.find((x) => x.id === m.terminalId)?.id ?? first.terminals[0]?.id ?? ""); }
      } catch (e) {
        if (e instanceof ApiFail && e.status === 401) window.location.assign("/login");
        else setErr(errText(e));
      }
    })();
  }, []);
  const current = rows.find((x) => x.id === b);
  const go = async () => {
    if (!me || !b) return;
    setBusy(true); setErr("");
    let remember = false;
    try { remember = sessionStorage.getItem("hd.remember") === "1"; sessionStorage.removeItem("hd.remember"); } catch { /* storage unavailable */ }
    try {
      await api("/auth/branch", { body: { branchId: b, terminalId: t || undefined, remember } });
      window.location.assign(homeFor(me.permissions));
    } catch (e) { setErr(errText(e)); setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between px-6 py-4"><Logo className="w-[130px]" pos /><div className="flex items-center gap-3"><LangSwitch />{me && <Avatar name={me.name} color={me.color} />}</div></header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-heading text-2xl font-semibold">Choose a branch & terminal</h1>
        <p className="mt-1 text-sm text-fg2">{me ? `You have access to ${rows.length} ${rows.length === 1 ? "branch" : "branches"}.` : "Loading…"}</p>
        {err && <p role="alert" className="mt-4 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
        {me && !rows.length && <p className="mt-6 text-sm text-fg2">No branch is assigned to your account. Ask the business owner to add you to one.</p>}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {rows.map((br) => (
            <button key={br.id} onClick={() => { setB(br.id); setT(br.terminals[0]?.id ?? ""); }} aria-pressed={b === br.id}
              className={cn("card relative p-5 text-left transition hover:shadow-lift", b === br.id ? "border-orange-500 ring-4 ring-orange-500/15" : "hover:border-orange-500/40")}>
              {b === br.id && <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-orange-500 text-navy-900"><Check size={16} strokeWidth={3} /></span>}
              <span className="grid h-11 w-11 place-items-center rounded-ctl bg-tint"><Building2 size={22} /></span>
              <h2 className="mt-4 font-heading text-lg font-semibold">{br.name}</h2>
              {br.address && <p className="mt-1 flex items-start gap-1.5 text-sm text-fg2"><MapPin size={15} className="mt-0.5 shrink-0" />{br.address}</p>}
              <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-cap text-fg2"><Monitor size={14} />{br.terminals.length} terminals</p>
            </button>
          ))}
        </div>
        {!!current?.terminals.length && <>
          <h2 className="mt-10 h-section">Terminal</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {current.terminals.map((x) => (
              <button key={x.id} onClick={() => setT(x.id)} aria-pressed={t === x.id}
                className={cn("flex h-14 items-center gap-3 rounded-card border px-5 text-left text-sm font-semibold transition", t === x.id ? "border-navy-900 bg-navy-900 text-white dark:border-orange-500 dark:bg-orange-500 dark:text-navy-900" : "border-line bg-surface hover:bg-tint")}>
                <Monitor size={20} />{x.name}
              </button>
            ))}
          </div>
        </>}
        <div className="mt-10 flex justify-end"><Button variant="primary" size="l" loading={busy} disabled={!b} iconRight={ArrowRight} onClick={() => void go()}>Continue</Button></div>
      </main>
    </div>
  );
}

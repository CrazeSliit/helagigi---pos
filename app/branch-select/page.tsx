"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, Check, MapPin, Monitor, RefreshCw, Wifi } from "lucide-react";
import { Logo } from "@/components/brand";
import { LangSwitch } from "@/components/shell";
import { Avatar } from "@/components/ui";
import { branches } from "@/lib/data";
import { cn, rs } from "@/lib/format";

export default function BranchSelect() {
  const [b, setB] = useState("cmb");
  const [t, setT] = useState("T1");
  const terms = { cmb: ["T1", "T2", "T3", "T4"], kdy: ["T1", "T2", "T3"], kur: ["T1", "T2"] } as Record<string, string[]>;
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between px-6 py-4"><Logo className="w-[130px]" pos /><div className="flex items-center gap-3"><LangSwitch /><Avatar name="Craze Weligepola" color="#FF7A00" /></div></header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-heading text-2xl font-semibold">Choose a branch & terminal</h1>
        <p className="mt-1 text-sm text-fg2">You have access to 3 branches. You can switch any time from the top bar.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {branches.map((br) => (
            <button key={br.id} onClick={() => { setB(br.id); setT("T1"); }} aria-pressed={b === br.id}
              className={cn("card relative p-5 text-left transition hover:shadow-lift", b === br.id ? "border-orange-500 ring-4 ring-orange-500/15" : "hover:border-orange-500/40")}>
              {b === br.id && <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-orange-500 text-navy-900"><Check size={16} strokeWidth={3} /></span>}
              <span className="grid h-11 w-11 place-items-center rounded-ctl bg-tint"><Building2 size={22} /></span>
              <h2 className="mt-4 font-heading text-lg font-semibold">{br.name}</h2>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-fg2"><MapPin size={15} className="mt-0.5 shrink-0" />{br.address}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-cap">
                <span className="flex items-center gap-1.5 text-fg2"><Monitor size={14} />{br.terminals} terminals</span>
                {br.status === "online"
                  ? <span className="inline-flex items-center gap-1 font-semibold text-success"><Wifi size={13} />Online</span>
                  : <span className="inline-flex items-center gap-1 font-semibold text-[#7A5A00] dark:text-warning"><RefreshCw size={13} />Syncing</span>}
              </div>
              <p className="mt-2 text-cap text-fg2">Today: <b className="text-fg tnum">{rs(br.today, { decimals: false })}</b></p>
            </button>
          ))}
        </div>
        <h2 className="mt-10 h-section">Terminal</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {terms[b].map((x, i) => (
            <button key={x} onClick={() => setT(x)} aria-pressed={t === x}
              className={cn("flex h-14 items-center gap-3 rounded-card border px-5 text-left transition", t === x ? "border-navy-900 bg-navy-900 text-white dark:border-orange-500 dark:bg-orange-500 dark:text-navy-900" : "border-line bg-surface hover:bg-tint")}>
              <Monitor size={20} /><span><span className="block text-sm font-semibold">Terminal {i + 1}</span><span className="text-[11px] opacity-70">{i === 0 ? "Main counter" : i === 1 ? "Express lane" : "Counter " + (i + 1)}{i === 2 && b === "cmb" ? " · in use by Sachini" : ""}</span></span>
            </button>
          ))}
        </div>
        <div className="mt-10 flex justify-end"><Link href="/dashboard" className="btn btn-l btn-primary">Continue<ArrowRight size={18} /></Link></div>
      </main>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChefHat, Clock, Flame, Utensils } from "lucide-react";
import { Logo } from "@/components/brand";
import { cn } from "@/lib/format";

type Tk = { id: string; table: string; type: string; mins: number; items: { q: number; n: string; mod?: string }[]; note?: string; col: "New" | "Preparing" | "Ready" };
const seed: Tk[] = [
  { id: "#0421", table: "T2", type: "Dine-in", mins: 2, col: "New", items: [{ q: 2, n: "String Hoppers", mod: "Kiri hodi" }, { q: 1, n: "Fish Curry" }] },
  { id: "#0420", table: "Takeaway", type: "PickMe Food", mins: 4, col: "New", items: [{ q: 3, n: "Chicken Kottu", mod: "Medium spicy" }, { q: 2, n: "Ginger Beer" }], note: "Rider arriving 15:20" },
  { id: "#0418", table: "T5", type: "Dine-in", mins: 9, col: "Preparing", items: [{ q: 2, n: "Chicken Kottu", mod: "Extra spicy · no egg" }, { q: 1, n: "Veg Fried Rice" }, { q: 3, n: "Plain Hoppers" }, { q: 2, n: "Egg Hoppers", mod: "1 runny yolk" }], note: "Birthday — watalappan with candle" },
  { id: "#0416", table: "O1", type: "Dine-in", mins: 14, col: "Preparing", items: [{ q: 4, n: "Lamprais" }, { q: 2, n: "Devilled Chicken", mod: "No onions" }] },
  { id: "#0415", table: "T7", type: "Dine-in", mins: 21, col: "Preparing", items: [{ q: 1, n: "Nasi Goreng" }, { q: 1, n: "Seafood Kottu", mod: "Allergy: no prawns" }] },
  { id: "#0413", table: "T1", type: "Dine-in", mins: 6, col: "Ready", items: [{ q: 2, n: "Faluda" }, { q: 1, n: "Watalappan" }] },
];

export default function KDS() {
  const [tk, setTk] = useState(seed);
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(i); }, []);
  const cols: Tk["col"][] = ["New", "Preparing", "Ready"];
  const next = { New: "Preparing", Preparing: "Ready", Ready: "Ready" } as const;
  return (
    <div className="flex h-screen flex-col bg-[#07142F] text-white">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#1E3466] px-5">
        <Link href="/restaurant" className="grid h-10 w-10 place-items-center rounded-ctl hover:bg-white/10" aria-label="Back"><ArrowLeft size={20} /></Link>
        <span className="rounded-ctl bg-white px-2 py-1"><Logo className="w-[96px]" /></span>
        <span className="flex items-center gap-2 font-heading text-lg font-semibold"><ChefHat size={22} className="text-orange-500" />Kitchen display · Kandy</span>
        <div className="ml-auto flex items-center gap-4 text-sm text-white/70"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />Live</span><span>Avg ticket time <b className="text-white">11m</b></span><span className="font-heading text-xl font-semibold text-white tnum">15:07</span></div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4">
        {cols.map((c) => (
          <section key={c} className="flex min-h-0 flex-col rounded-card bg-[#0F2350]">
            <h2 className="flex items-center justify-between px-4 py-3 font-heading text-base font-semibold text-white"><span className="flex items-center gap-2">{c === "New" ? <Flame size={18} className="text-orange-500" /> : c === "Preparing" ? <Utensils size={18} className="text-amber-400" /> : <Check size={18} className="text-success" />}{c}</span><span className="rounded-full bg-white/10 px-2.5 text-cap tnum">{tk.filter((t) => t.col === c).length}</span></h2>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3">
              {tk.filter((t) => t.col === c).map((t) => {
                const late = t.mins >= 20, warn = t.mins >= 10;
                return (
                  <article key={t.id} className={cn("overflow-hidden rounded-card border-2 bg-[#132B5E]", c === "Ready" ? "border-success" : late ? "border-danger" : warn ? "border-amber-400" : "border-[#1E3466]")}>
                    <header className={cn("flex items-center justify-between px-3 py-2", c === "Ready" ? "bg-success" : late ? "bg-danger" : warn ? "bg-amber-400 text-navy-900" : "bg-[#1E3466]")}>
                      <span className="font-heading text-lg font-bold">{t.table}</span>
                      <span className="text-cap font-semibold opacity-90">{t.id} · {t.type}</span>
                      <span className="inline-flex items-center gap-1 font-heading font-bold tnum"><Clock size={15} />{t.mins}m</span>
                    </header>
                    <ul className="space-y-2 px-3 py-3">
                      {t.items.map((it) => (
                        <li key={it.n}><p className="text-base font-semibold"><span className="mr-2 inline-grid h-7 min-w-7 place-items-center rounded-md bg-white/10 px-1 tnum">{it.q}</span>{it.n}</p>{it.mod && <p className="ml-9 mt-0.5 inline-block rounded bg-orange-500 px-1.5 text-cap font-bold text-navy-900">{it.mod}</p>}</li>
                      ))}
                    </ul>
                    {t.note && <p className="mx-3 mb-3 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 py-1.5 text-cap font-semibold text-amber-400">★ {t.note}</p>}
                    {c !== "Ready" ? (
                      <button onClick={() => setTk(tk.map((x) => (x.id === t.id ? { ...x, col: next[c] } : x)))} className="h-14 w-full border-t border-[#1E3466] text-base font-bold hover:bg-white/5">{c === "New" ? "Start preparing" : "Mark ready"}</button>
                    ) : (
                      <button onClick={() => setTk(tk.filter((x) => x.id !== t.id))} className="h-14 w-full bg-success/20 text-base font-bold text-success hover:bg-success/30">Served ✓</button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

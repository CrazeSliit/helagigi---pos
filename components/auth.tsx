"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/format";
import { Arcs, Logo, RakshaMask } from "./brand";
import { LangSwitch } from "./shell";

/** PIN dots + big keypad. Demo PIN is 1234; anything else shakes. */
export function PinPad({ length = 4, onSuccess, dark, correct = "1234" }: { length?: number; onSuccess: () => void; dark?: boolean; correct?: string }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (pin.length < length) return;
    if (pin === correct) { const t = setTimeout(onSuccess, 180); return () => clearTimeout(t); }
    setErr(true);
    const t = setTimeout(() => { setErr(false); setPin(""); }, 650);
    return () => clearTimeout(t);
  }, [pin, length, correct, onSuccess]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < length ? p + e.key : p));
      if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [length]);
  const key = (k: string) => setPin((p) => (k === "⌫" ? p.slice(0, -1) : p.length < length ? p + k : p));
  return (
    <div className="w-full max-w-[320px]">
      <div className={cn("mb-2 flex justify-center gap-4", err && "animate-shake")} aria-live="polite" aria-label={`${pin.length} of ${length} digits entered`}>
        {Array.from({ length }).map((_, i) => (
          <span key={i} className={cn("h-4 w-4 rounded-full border-2 transition",
            err ? "border-danger bg-danger" : i < pin.length ? "border-orange-500 bg-orange-500 scale-110" : dark ? "border-white/40" : "border-line")} />
        ))}
      </div>
      <p className={cn("mb-6 h-5 text-center text-cap font-medium", err ? "text-danger" : dark ? "text-white/60" : "text-fg2")}>{err ? "Incorrect PIN — try again" : "Demo PIN: 1234"}</p>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => (
          <button key={i} disabled={!k} onClick={() => key(k)} aria-label={k === "⌫" ? "Delete" : k}
            className={cn("grid h-[72px] place-items-center rounded-card font-heading text-2xl font-semibold transition active:scale-95 disabled:invisible",
              dark ? "bg-white/10 text-white hover:bg-white/20" : "border border-line bg-surface text-fg shadow-soft hover:bg-tint")}>
            {k === "⌫" ? <Delete size={26} /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Split auth layout: navy brand panel on the left, form on the right. */
export function AuthSplit({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <Arcs className="bottom-0 left-0 aspect-square w-[62%]" />
        <svg className="absolute -right-24 -top-24 h-[420px] w-[420px]" viewBox="0 0 400 400" aria-hidden>
          <circle cx="200" cy="200" r="190" fill="none" stroke="#B9DDF7" strokeOpacity=".14" strokeWidth="2" />
          <circle cx="200" cy="200" r="140" fill="none" stroke="#FFA940" strokeOpacity=".22" strokeWidth="2" />
        </svg>
        <RakshaMask className="absolute bottom-0 right-0 h-[74%] opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <span className="inline-flex w-fit rounded-ctl bg-white px-3 py-2"><Logo className="w-[150px]" /></span>
          {side ?? (
            <div className="max-w-md pb-8">
              <h1 className="font-heading text-[40px] font-bold leading-[1.15] text-white">Smart selling for Sri Lankan businesses</h1>
              <p className="mt-4 text-base text-white/75">Fast checkout, multi-branch stock and real-time reports — in English, සිංහල and தமிழ்.</p>
              <div className="mt-8 flex gap-6 text-sm text-white/80">
                <span><b className="block font-heading text-2xl text-orange-500">3 taps</b>to complete a sale</span>
                <span><b className="block font-heading text-2xl text-sky-300">Offline</b>sales keep working</span>
              </div>
            </div>
          )}
          <span />
        </div>
      </div>
      <div className="relative flex flex-col bg-surface">
        <div className="flex items-center justify-between p-6"><span className="lg:invisible"><Logo className="w-[120px]" pos /></span><LangSwitch /></div>
        <div className="flex flex-1 items-center justify-center px-6 pb-10">{children}</div>
        <p className="pb-6 text-center text-cap text-fg2">© 2026 HeladiGi · Colombo, Sri Lanka</p>
      </div>
    </div>
  );
}

"use client";
import { useState, type ReactNode } from "react";
import { Delete, Layers, Minus, Plus, Scale, Trash2, Pencil } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn, rs } from "@/lib/format";
import { categories, stockState, type Product } from "@/lib/data";
import { translate, type Lang } from "@/lib/i18n";
import { Icon } from "./brand";

/* ─────────── Numeric keypad ─────────── */
export function Keypad({ onKey, size = "l", extra = "00", className }: { onKey: (k: string) => void; size?: "m" | "l"; extra?: string | null; className?: string }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", extra ?? "", "0", "⌫"];
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {keys.map((k, i) => (
        <button key={i} type="button" disabled={!k} onClick={() => k && onKey(k)} aria-label={k === "⌫" ? "Backspace" : k}
          className={cn("grid place-items-center rounded-card border border-line bg-surface font-heading font-semibold text-fg transition active:scale-95 active:bg-tint hover:bg-tint disabled:invisible",
            size === "l" ? "h-16 text-2xl" : "h-12 text-lg")}>
          {k === "⌫" ? <Delete size={24} /> : k}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Sri Lankan denomination counter ─────────── */
export const DENOMS = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
export function DenominationCounter({ value, onChange, compact }: { value: Record<number, number>; onChange: (v: Record<number, number>) => void; compact?: boolean }) {
  const total = DENOMS.reduce((s, d) => s + d * (value[d] || 0), 0);
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-surface-2 px-4 py-2 text-cap font-semibold uppercase tracking-wide text-fg2">
        <span>Denomination</span><span className="w-[152px] text-center">Count</span><span className="text-right">Subtotal</span>
      </div>
      {DENOMS.map((d) => {
        const n = value[d] || 0;
        return (
          <div key={d} className={cn("grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-line px-4", compact ? "py-1.5" : "py-2")}>
            <span className="flex items-center gap-2.5">
              <span className={cn("grid h-8 place-items-center rounded-md text-[11px] font-bold", d >= 20 ? "w-14" : "w-8 rounded-full", d >= 1000 ? "bg-orange-100 text-navy-900" : d >= 20 ? "bg-sky-300/50 text-navy-900 dark:text-sky-300" : "bg-amber-400/30 text-navy-900 dark:text-amber-400")}>
                {d >= 1000 ? `${d / 1000}K` : d}
              </span>
              <span className="text-sm font-medium">{d >= 20 ? "Note" : "Coin"} · Rs. {d.toLocaleString()}</span>
            </span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label={`Less Rs. ${d}`} onClick={() => onChange({ ...value, [d]: Math.max(0, n - 1) })} className="grid h-12 w-12 place-items-center rounded-ctl border border-line hover:bg-tint"><Minus size={16} /></button>
              <input inputMode="numeric" aria-label={`Count of Rs. ${d}`} value={n} onChange={(e) => onChange({ ...value, [d]: Math.max(0, parseInt(e.target.value || "0") || 0) })}
                className="h-12 w-12 rounded-ctl border border-line bg-surface text-center font-semibold text-fg outline-none focus:border-orange-500" />
              <button type="button" aria-label={`More Rs. ${d}`} onClick={() => onChange({ ...value, [d]: n + 1 })} className="grid h-12 w-12 place-items-center rounded-ctl border border-line hover:bg-tint"><Plus size={16} /></button>
            </div>
            <span className="text-right font-semibold tnum">{rs(d * n)}</span>
          </div>
        );
      })}
      <div className="flex items-center justify-between border-t-2 border-line bg-tint px-4 py-3">
        <span className="font-semibold">Total counted</span>
        <span className="font-heading text-xl font-bold tnum">{rs(total)}</span>
      </div>
    </div>
  );
}

/* ─────────── Product thumbnail (placeholder tile until real images are uploaded) ─────────── */
export function ProductThumb({ p, className, size = 32 }: { p: Product; className?: string; size?: number }) {
  const c = categories.find((x) => x.id === p.cat);
  return (
    <div className={cn("grid place-items-center rounded-ctl text-navy-900", className)} style={{ background: c?.color ?? "#EAF0FB" }}>
      <Icon name={p.icon} size={size} />
    </div>
  );
}

export function StockBadge({ p, lang = "en" }: { p: Product; lang?: Lang }) {
  const s = stockState(p);
  const m = {
    in: ["bg-success/10 text-success", "p.instock"], low: ["bg-warning/20 text-[#7A5A00] dark:text-warning", "p.low"], out: ["bg-danger/10 text-danger", "p.out"],
  }[s];
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold", m[0])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s === "in" ? "bg-success" : s === "low" ? "bg-warning" : "bg-danger")} />
      {translate(lang, m[1])}{s !== "out" && <span className="tnum opacity-80">· {p.stock}{p.unit === "kg" ? "kg" : ""}</span>}
    </span>
  );
}

export function ProductCard({ p, onAdd, lang = "en", view = "grid" }: { p: Product; onAdd?: (p: Product, el: HTMLElement) => void; lang?: Lang; view?: "grid" | "list" }) {
  const out = stockState(p) === "out";
  const [rip, setRip] = useState<{ x: number; y: number; id: number } | null>(null);
  const name = lang === "si" && p.si ? p.si : p.name;
  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (out) return;
    const r = e.currentTarget.getBoundingClientRect();
    setRip({ x: e.clientX - r.left, y: e.clientY - r.top, id: Date.now() });
    onAdd?.(p, e.currentTarget);
  };
  if (view === "list")
    return (
      <button onClick={click} disabled={out} className={cn("relative flex w-full items-center gap-3 overflow-hidden rounded-card border border-line bg-surface p-2.5 text-left transition hover:border-orange-500/60 hover:shadow-soft", out && "opacity-60")}>
        <ProductThumb p={p} className="h-12 w-12 shrink-0" size={22} />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name}</p><div className="mt-1 flex items-center gap-2"><StockBadge p={p} lang={lang} />{p.variants && <VariantTag lang={lang} />}</div></div>
        <span className="font-heading font-semibold tnum">{rs(p.price)}{p.weighed && <span className="text-cap text-fg2">/kg</span>}</span>
      </button>
    );
  return (
    <button onClick={click} disabled={out} aria-label={`Add ${p.name}, ${rs(p.price)}`}
      className={cn("group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface p-2.5 text-left shadow-soft transition active:scale-[.97] hover:border-orange-500/60", out && "cursor-not-allowed")}>
      {rip && <span key={rip.id} className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 animate-ripple" style={{ left: rip.x, top: rip.y }} />}
      <ProductThumb p={p} className="aspect-[4/3] w-full" size={34} />
      {p.variants && <span className="absolute left-4 top-4"><VariantTag lang={lang} /></span>}
      {p.weighed && <span className="absolute right-4 top-4 inline-flex h-6 items-center gap-1 rounded-md bg-white/90 px-1.5 text-[11px] font-semibold text-navy-900"><Scale size={12} />kg</span>}
      <p className={cn("mt-2 line-clamp-2 min-h-[40px] text-[13px] font-semibold leading-5 text-fg", lang !== "en" && "leading-[19px]")}>{name}</p>
      <div className="mt-1.5 flex items-end justify-between gap-1">
        <span className="font-heading text-[15px] font-semibold tnum">{rs(p.price)}{p.weighed && <span className="text-[11px] font-medium text-fg2">/kg</span>}</span>
      </div>
      <div className="mt-1.5"><StockBadge p={p} lang={lang} /></div>
      {out && (
        <span className="absolute inset-0 grid place-items-center bg-surface/70 backdrop-blur-[1px]">
          <span className="rounded-full bg-danger px-3 py-1 text-cap font-bold text-white">{translate(lang, "p.outofstock")}</span>
        </span>
      )}
    </button>
  );
}
function VariantTag({ lang = "en" }: { lang?: Lang }) {
  return <span className="inline-flex h-6 items-center gap-1 rounded-md bg-navy-900 px-1.5 text-[11px] font-semibold text-white"><Layers size={12} />{translate(lang, "p.options")}</span>;
}

/* ─────────── Cart line ─────────── */
export type Line = { key: string; p: Product; qty: number; price: number; disc?: number; note?: string; variant?: string };
export function CartLine({ l, onQty, onRemove, onEdit, state = "default", lang = "en" }: { l: Line; onQty?: (q: number) => void; onRemove?: () => void; onEdit?: () => void; state?: "default" | "editing" | "removing"; lang?: Lang }) {
  const unit = l.price * (1 - (l.disc ?? 0) / 100);
  const total = unit * l.qty;
  const name = lang === "si" && l.p.si ? l.p.si : l.p.name;
  return (
    <div className={cn("group relative flex items-start gap-3 rounded-card px-3 py-3 transition", state === "editing" && "bg-tint ring-2 ring-orange-500/50", state === "removing" && "translate-x-[-24px] bg-danger/5 opacity-60")}>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left" aria-label={`Edit ${l.p.name}`}>
        <p className="line-clamp-2 text-sm font-semibold leading-5">{name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-cap text-fg2 tnum">
          {l.disc ? <><s>{rs(l.price)}</s><span className="font-semibold text-orange-600">{rs(unit)}</span><span className="rounded bg-orange-100 px-1 font-semibold text-navy-900">−{l.disc}%</span></> : <span>{rs(l.price)}{l.p.weighed ? " /kg" : ""}</span>}
          {l.variant && <span>· {l.variant}</span>}
        </p>
        {l.note && <p className="mt-1 text-cap italic text-fg2">“{l.note}”</p>}
      </button>
      <div className="flex flex-col items-end gap-2">
        <span className="font-semibold tnum">{rs(total)}</span>
        <div className="flex items-center gap-1">
          {l.p.weighed ? (
            <span className="inline-flex h-10 items-center gap-1 rounded-ctl border border-line px-3 text-sm font-semibold tnum"><Scale size={14} />{l.qty.toFixed(3)} kg</span>
          ) : (
            <div className="inline-flex items-center rounded-ctl border border-line">
              <button aria-label="Decrease quantity" onClick={() => onQty?.(l.qty - 1)} className="grid h-10 w-10 place-items-center hover:bg-tint"><Minus size={16} /></button>
              <span className="w-7 text-center text-sm font-bold tnum">{l.qty}</span>
              <button aria-label="Increase quantity" onClick={() => onQty?.(l.qty + 1)} className="grid h-10 w-10 place-items-center hover:bg-tint"><Plus size={16} /></button>
            </div>
          )}
          <button aria-label="Remove line" onClick={onRemove} className="grid h-10 w-10 place-items-center rounded-ctl text-fg2 hover:bg-danger/10 hover:text-danger"><Trash2 size={17} /></button>
        </div>
      </div>
      {state === "editing" && <Pencil size={14} className="absolute left-0 top-4 text-orange-500" />}
    </div>
  );
}

/* ─────────── Thermal receipt ─────────── */
export type ReceiptData = {
  invoice: string; date: string; time: string; cashier: string; customer?: string; branch: string;
  lines: { name: string; qty: number; price: number; disc?: number }[];
  discount: number; method: string; tendered: number; points?: number;
};
export function Receipt({ d, width = 80, lang = "en", className }: { d: ReceiptData; width?: 58 | 80; lang?: Lang; className?: string }) {
  const total = d.lines.reduce((s, l) => s + l.qty * l.price * (1 - (l.disc ?? 0) / 100), 0) - d.discount;
  const vat = total - total / 1.18;
  const px = width === 80 ? 302 : 219;
  const Row = ({ a, b, bold }: { a: ReactNode; b: ReactNode; bold?: boolean }) => <div className={cn("flex justify-between gap-2", bold && "font-bold")}><span>{a}</span><span className="tnum">{b}</span></div>;
  const si = lang === "si";
  return (
    <div className={cn("print-area mx-auto bg-white font-mono text-[11px] leading-[15px] text-black shadow-lift", className)} style={{ width: px }}>
      <div className="px-3 pb-4 pt-5" style={{ backgroundImage: "radial-gradient(circle at 6px -2px, transparent 5px, white 5.5px)", backgroundSize: "12px 100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmark.png" alt="HeladiGi" className="mx-auto mb-2 w-[60%]" />
        <p className="text-center font-bold">HeladiGi Mart — {d.branch}</p>
        <p className="text-center">No. 214, Galle Road, Colombo 03</p>
        <p className="text-center">Tel: +94 11 257 4410</p>
        <p className="text-center">VAT Reg: 114567890-7000</p>
        <div className="my-2 border-t border-dashed border-black" />
        <Row a={si ? "ඉන්වොයිසිය" : "Invoice"} b={d.invoice} />
        <Row a={si ? "දිනය" : "Date"} b={`${d.date} ${d.time}`} />
        <Row a={si ? "අයකැමි" : "Cashier"} b={d.cashier} />
        {d.customer && <Row a={si ? "පාරිභෝගික" : "Customer"} b={d.customer} />}
        <div className="my-2 border-t border-dashed border-black" />
        {d.lines.map((l, i) => (
          <div key={i} className="mb-1">
            <p className="font-semibold">{l.name}</p>
            <Row a={`  ${l.qty} x ${rs(l.price, { prefix: false })}${l.disc ? ` (-${l.disc}%)` : ""}`} b={rs(l.qty * l.price * (1 - (l.disc ?? 0) / 100), { prefix: false })} />
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-black" />
        <Row a={si ? "උප එකතුව" : "Subtotal"} b={rs(total + d.discount, { prefix: false })} />
        {d.discount > 0 && <Row a={si ? "වට්ටම" : "Discount"} b={`-${rs(d.discount, { prefix: false })}`} />}
        <Row a={si ? "වැට් 18% (ඇතුළත්)" : "VAT 18% (incl.)"} b={rs(vat, { prefix: false })} />
        <div className="my-1 border-t border-black" />
        <div className="flex justify-between text-[14px] font-bold"><span>{si ? "මුළු මුදල" : "TOTAL"}</span><span className="tnum">{rs(total)}</span></div>
        <div className="my-1 border-t border-black" />
        <Row a={d.method} b={rs(d.tendered, { prefix: false })} />
        <Row a={si ? "ඉතිරි මුදල" : "Change"} b={rs(Math.max(0, d.tendered - total), { prefix: false })} bold />
        {d.points ? <><div className="my-2 border-t border-dashed border-black" /><Row a={si ? "උපයාගත් ලකුණු" : "Points earned"} b={`+${d.points}`} /></> : null}
        <div className="my-2 border-t border-dashed border-black" />
        <p className="text-center font-bold">Thank you, come again!</p>
        <p className="text-center font-bold" style={{ fontFamily: "'Noto Sans Sinhala', sans-serif" }}>ස්තූතියි, නැවත එන්න!</p>
        <div className="mt-3 flex flex-col items-center gap-1">
          <QRCodeSVG value={`https://heladigi.lk/r/${d.invoice}`} size={width === 80 ? 88 : 72} />
          <p>Scan for your e-receipt</p>
        </div>
        <p className="mt-2 text-center text-[10px]">Exchanges within 7 days with receipt · Powered by HeladiGi POS</p>
      </div>
    </div>
  );
}

export const sampleReceipt: ReceiptData = {
  invoice: "INV-C03-018453", date: "21/11/2026", time: "14:56", cashier: "Kasun J.", customer: "Nimal Perera", branch: "Colombo 03",
  lines: [
    { name: "Anchor Milk Powder 400g", qty: 2, price: 1150 },
    { name: "Munchee Super Cream Cracker 490g", qty: 1, price: 560 },
    { name: "Dilmah Tea 100 bags", qty: 1, price: 1450, disc: 10 },
    { name: "Elephant House Cream Soda 1.5L", qty: 2, price: 420 },
    { name: "Samba Rice (loose) 1.250kg", qty: 1, price: 325 },
  ],
  discount: 0, method: "Cash", tendered: 6000, points: 48,
};

"use client";
import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Ban, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDashed,
  Clock, Eye, EyeOff, Info, Loader2, Lock, Minus, Plus, Search, Wifi, WifiOff, XCircle, Undo2, FileText, CreditCard, PackageX,
  PackageCheck, PackageMinus, CircleCheck, CircleSlash, RefreshCw, type LucideIcon,
} from "lucide-react";
import { cn, initials } from "@/lib/format";

/* ─────────── Button ─────────── */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-outline";
  size?: "s" | "m" | "l" | "pos";
  icon?: LucideIcon; iconRight?: LucideIcon; loading?: boolean; kbd?: string; locked?: boolean;
};
export function Button({ variant = "outline", size = "m", icon: I, iconRight: IR, loading, kbd, locked, className, children, disabled, title, onClick, ...rest }: BtnProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-disabled={locked || undefined}
      title={locked ? "Manager approval required" : title}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const id = Date.now();
        setRipples((p) => [...p, { x: e.clientX - r.left, y: e.clientY - r.top, id }]);
        setTimeout(() => setRipples((p) => p.filter((q) => q.id !== id)), 600);
        onClick?.(e);
      }}
      className={cn("btn", `btn-${size}`, `btn-${variant}`, locked && "opacity-60", className)}
    >
      {ripples.map((r) => (
        <span key={r.id} className="pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current animate-ripple" style={{ left: r.x, top: r.y }} />
      ))}
      {loading ? <Loader2 className="animate-spin" size={18} /> : locked ? <Lock size={16} /> : I && <I size={size === "s" ? 14 : 18} strokeWidth={2} />}
      {children}
      {IR && <IR size={16} />}
      {kbd && <span className="kbd ml-1">{kbd}</span>}
    </button>
  );
}

export function IconButton({ icon: I, label, className, badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; badge?: number }) {
  return (
    <button aria-label={label} title={label} {...rest} className={cn("icon-btn relative", className)}>
      <I size={20} strokeWidth={1.75} />
      {!!badge && <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-navy-900 tnum">{badge}</span>}
    </button>
  );
}

/* ─────────── Inputs ─────────── */
export function Field({ label, hint, error, children, className, required }: { label?: string; hint?: string; error?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="label">{label}{required && <span className="text-danger"> *</span>}</span>}
      {children}
      {error ? <span className="mt-1 flex items-center gap-1 text-cap text-danger"><XCircle size={13} />{error}</span> : hint && <span className="hint mt-1 block">{hint}</span>}
    </label>
  );
}
export function Input({ className, invalid, ...p }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...p} className={cn("field", invalid && "field-error", className)} />;
}
export function SearchInput({ className, kbd, ...p }: InputHTMLAttributes<HTMLInputElement> & { kbd?: string }) {
  return (
    <div className={cn("field-wrap", className)}>
      <Search size={18} className="ml-3 text-fg2" />
      <input type="search" {...p} />
      {kbd && <span className="kbd mr-3 text-fg2">{kbd}</span>}
    </div>
  );
}
export function AddonInput({ prefix, suffix, className, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & { prefix?: ReactNode; suffix?: ReactNode }) {
  return (
    <div className={cn("field-wrap overflow-hidden", className)}>
      {prefix && <span className="addon border-r">{prefix}</span>}
      <input {...p} />
      {suffix && <span className="addon border-l">{suffix}</span>}
    </div>
  );
}
export function PasswordInput(p: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="field-wrap">
      <input {...p} type={show ? "text" : "password"} />
      <button type="button" className="mr-1 grid h-9 w-9 place-items-center rounded-lg text-fg2 hover:bg-tint" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
export function Select({ options, className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <div className={cn("relative", className)}>
      <select {...p} className="field appearance-none pr-9">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg2" />
    </div>
  );
}
export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn("field h-auto min-h-[96px] py-2.5", p.className)} />;
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange?: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className={cn("inline-flex items-center gap-3", disabled ? "opacity-50" : "cursor-pointer")}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange?.(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-orange-500" : "bg-line")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
      {label && <span className="text-sm text-fg">{label}</span>}
    </label>
  );
}
export function Checkbox({ checked, onChange, label, indeterminate }: { checked: boolean; onChange?: (v: boolean) => void; label?: ReactNode; indeterminate?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <button type="button" role="checkbox" aria-checked={indeterminate ? "mixed" : checked} onClick={(e) => { e.stopPropagation(); onChange?.(!checked); }}
        className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition", checked || indeterminate ? "border-navy-900 bg-navy-900 text-white dark:border-orange-500 dark:bg-orange-500 dark:text-navy-900" : "border-line bg-surface")}>
        {indeterminate ? <Minus size={12} strokeWidth={3} /> : checked && <Check size={12} strokeWidth={3} />}
      </button>
      {label}
    </label>
  );
}
export function Radio({ checked, onChange, label }: { checked: boolean; onChange?: () => void; label: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <button type="button" role="radio" aria-checked={checked} onClick={onChange} className={cn("grid h-5 w-5 place-items-center rounded-full border-2", checked ? "border-orange-500" : "border-line")}>
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />}
      </button>
      {label}
    </label>
  );
}
export function Segmented<T extends string>({ value, onChange, options, size = "m" }: { value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode }[]; size?: "m" | "l" }) {
  return (
    <div className="inline-flex rounded-ctl bg-surface-2 p-1 border border-line">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} aria-pressed={value === o.v}
          className={cn("whitespace-nowrap rounded-lg px-3 font-semibold transition", size === "l" ? "h-10 text-sm" : "h-8 text-cap",
            value === o.v ? "bg-surface text-fg shadow-soft" : "text-fg2 hover:text-fg")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Status chips (icon + label, never colour alone) ─────────── */
const CHIP: Record<string, { c: string; i: LucideIcon }> = {
  Completed: { c: "bg-success/10 text-success", i: CheckCircle2 },
  Paid: { c: "bg-success/10 text-success", i: CheckCircle2 },
  Received: { c: "bg-success/10 text-success", i: PackageCheck },
  "In Stock": { c: "bg-success/10 text-success", i: CircleCheck },
  Active: { c: "bg-success/10 text-success", i: CircleCheck },
  Online: { c: "bg-success/10 text-success", i: Wifi },
  Balanced: { c: "bg-success/10 text-success", i: CheckCircle2 },
  Available: { c: "bg-success/10 text-success", i: CircleCheck },
  Pending: { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: Clock },
  "Low Stock": { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: PackageMinus },
  "Expiring": { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: AlertTriangle },
  "In Transit": { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: RefreshCw },
  "Partially Received": { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: PackageMinus },
  "Partially Refunded": { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: Undo2 },
  Over: { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: AlertTriangle },
  Scheduled: { c: "bg-info/10 text-info", i: Clock },
  Sent: { c: "bg-info/10 text-info", i: FileText },
  "On Credit": { c: "bg-info/10 text-info", i: CreditCard },
  Syncing: { c: "bg-warning/15 text-[#8A6500] dark:text-warning", i: RefreshCw },
  Refunded: { c: "bg-danger/10 text-danger", i: Undo2 },
  Voided: { c: "bg-danger/10 text-danger", i: Ban },
  "Out of Stock": { c: "bg-danger/10 text-danger", i: PackageX },
  Expired: { c: "bg-danger/10 text-danger", i: XCircle },
  Offline: { c: "bg-danger/10 text-danger", i: WifiOff },
  Short: { c: "bg-danger/10 text-danger", i: AlertTriangle },
  Cancelled: { c: "bg-danger/10 text-danger", i: CircleSlash },
  Draft: { c: "bg-surface-2 text-fg2 border border-line", i: CircleDashed },
  Inactive: { c: "bg-surface-2 text-fg2 border border-line", i: CircleSlash },
  "On hold": { c: "bg-surface-2 text-fg2 border border-line", i: Clock },
};
export function Status({ s, label, className }: { s: string; label?: string; className?: string }) {
  const m = CHIP[s] ?? { c: "bg-tint text-fg", i: Info };
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-cap font-semibold whitespace-nowrap", m.c, className)}>
      <m.i size={13} strokeWidth={2.2} />{label ?? s}
    </span>
  );
}
export function Badge({ children, tone = "navy", className }: { children: ReactNode; tone?: "navy" | "orange" | "amber" | "sky" | "gray"; className?: string }) {
  const t = { navy: "bg-tint text-fg", orange: "bg-orange-100 text-navy-900", amber: "bg-amber-400/25 text-navy-900 dark:text-amber-400", sky: "bg-sky-300/40 text-navy-900 dark:text-sky-300", gray: "bg-surface-2 text-fg2" }[tone];
  return <span className={cn("inline-flex h-6 items-center gap-1 rounded-md px-2 text-cap font-semibold", t, className)}>{children}</span>;
}

/* ─────────── Avatar ─────────── */
export function Avatar({ name, size = 36, color = "#1A3170", className }: { name: string; size?: number; color?: string; className?: string }) {
  return (
    <span className={cn("inline-grid shrink-0 place-items-center rounded-full font-heading font-semibold text-white", className)}
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

/* ─────────── Cards & layout ─────────── */
export function Card({ title, action, children, className, pad = true, sub }: { title?: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div><h3 className="h-section">{title}</h3>{sub && <p className="hint mt-0.5">{sub}</p>}</div>
          {action}
        </header>
      )}
      <div className={cn(pad && (title ? "px-5 pb-5" : "p-5"))}>{children}</div>
    </section>
  );
}
export function PageHeader({ title, sub, actions, crumbs }: { title: string; sub?: string; actions?: ReactNode; crumbs?: string[] }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumbs && <Breadcrumbs items={crumbs} />}
        <h1 className="font-heading text-xl font-semibold sm:text-[24px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-fg2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-cap text-fg2">
      {items.map((c, i) => (
        <span key={c} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} />}
          <span className={i === items.length - 1 ? "font-medium text-fg" : ""}>{c}</span>
        </span>
      ))}
    </nav>
  );
}

/* ─────────── KPI card ─────────── */
export function Sparkline({ data, color = "#FF7A00", className }: { data: number[]; color?: string; className?: string }) {
  const w = 96, h = 32, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 3 - ((d - min) / (max - min || 1)) * (h - 6)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-24", className)} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} fillOpacity=".12" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function StatCard({ label, value, delta, spark, icon: I, invert, foot }: { label: string; value: string; delta: number; spark?: number[]; icon?: LucideIcon; invert?: boolean; foot?: string }) {
  const good = invert ? delta < 0 : delta >= 0;
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg2">{label}</span>
        {I && <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-ctl bg-tint text-fg sm:grid"><I size={18} /></span>}
      </div>
      <div className="mt-2 font-heading text-lg font-semibold tnum text-fg sm:text-[24px]">{value}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 text-cap font-semibold", good ? "text-success" : "text-danger")}>
          {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(delta).toFixed(1)}% <span className="hidden font-normal text-fg2 sm:inline">{foot ?? "vs last Sat"}</span>
        </span>
        {spark && <Sparkline data={spark} color={good ? "#FF7A00" : "#DC2626"} className="hidden sm:block" />}
      </div>
    </div>
  );
}

/* ─────────── Tabs ─────────── */
export function Tabs<T extends string>({ value, onChange, tabs, variant = "underline", className }: { value: T; onChange: (v: T) => void; tabs: { v: T; label: ReactNode; count?: number }[]; variant?: "underline" | "pill"; className?: string }) {
  if (variant === "pill")
    return (
      <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
        {tabs.map((t) => (
          <button key={t.v} role="tab" aria-selected={value === t.v} onClick={() => onChange(t.v)}
            className={cn("h-9 rounded-full px-4 text-sm font-semibold transition", value === t.v ? "bg-navy-900 text-white dark:bg-orange-500 dark:text-navy-900" : "bg-surface border border-line text-fg2 hover:text-fg")}>
            {t.label}{t.count != null && <span className="ml-1.5 opacity-70 tnum">{t.count}</span>}
          </button>
        ))}
      </div>
    );
  return (
    <div className={cn("flex gap-6 overflow-x-auto border-b border-line no-scrollbar", className)} role="tablist">
      {tabs.map((t) => (
        <button key={t.v} role="tab" aria-selected={value === t.v} onClick={() => onChange(t.v)}
          className={cn("relative h-11 whitespace-nowrap text-sm font-semibold transition", value === t.v ? "text-fg" : "text-fg2 hover:text-fg")}>
          {t.label}{t.count != null && <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] tnum">{t.count}</span>}
          {value === t.v && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-t bg-orange-500" />}
        </button>
      ))}
    </div>
  );
}

/* ─────────── Misc ─────────── */
export function Pagination({ page = 1, pages = 12, total = 1248 }: { page?: number; pages?: number; total?: number }) {
  const [p, setP] = useState(page);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-fg2">
      <span className="tnum">Showing {(p - 1) * 10 + 1}–{Math.min(p * 10, total)} of {total.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        <button className="icon-btn h-9 w-9" aria-label="Previous page" onClick={() => setP(Math.max(1, p - 1))}><ChevronLeft size={18} /></button>
        {[1, 2, 3, "…", pages].map((n, i) => (
          <button key={i} disabled={n === "…"} onClick={() => typeof n === "number" && setP(n)}
            className={cn("h-9 min-w-9 rounded-lg px-2 font-semibold tnum", n === p ? "bg-navy-900 text-white dark:bg-orange-500 dark:text-navy-900" : "hover:bg-tint")}>{n}</button>
        ))}
        <button className="icon-btn h-9 w-9" aria-label="Next page" onClick={() => setP(Math.min(pages, p + 1))}><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action, icon: I }: { title: string; body: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="relative mb-4 grid h-28 w-28 place-items-center">
        <span className="absolute inset-0 rounded-full bg-tint" />
        <span className="absolute inset-3 rounded-full border-2 border-dashed border-sky-300" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {I ? <I size={36} className="relative text-fg" strokeWidth={1.5} /> : <img src="/brand/raksha-line-navy.png" alt="" className="relative h-20 opacity-80 dark:invert" />}
        <span className="absolute -right-1 top-3 h-3 w-3 rounded-full bg-orange-500" />
        <span className="absolute bottom-4 -left-1 h-2 w-2 rounded-full bg-amber-400" />
      </div>
      <h3 className="h-section">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-fg2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-lg bg-surface-2", className)} />;
}
export function Progress({ value, tone = "orange" }: { value: number; tone?: "orange" | "navy" | "success" | "danger" }) {
  const c = { orange: "bg-orange-500", navy: "bg-navy-900 dark:bg-sky-300", success: "bg-success", danger: "bg-danger" }[tone];
  return <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2"><div className={cn("h-full rounded-full transition-all", c)} style={{ width: `${value}%` }} /></div>;
}

export function Banner({ tone = "info", title, children, action }: { tone?: "info" | "warning" | "danger" | "success"; title: string; children?: ReactNode; action?: ReactNode }) {
  const m = {
    info: ["bg-info/10 border-info/30 text-info", Info], warning: ["bg-warning/15 border-warning/40 text-[#8A6500] dark:text-warning", AlertTriangle],
    danger: ["bg-danger/10 border-danger/30 text-danger", WifiOff], success: ["bg-success/10 border-success/30 text-success", CheckCircle2],
  }[tone] as [string, LucideIcon];
  const I = m[1];
  return (
    <div className={cn("flex items-start gap-3 rounded-card border px-4 py-3", m[0])} role="status">
      <I size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-sm"><p className="font-semibold">{title}</p>{children && <div className="mt-0.5 text-fg2">{children}</div>}</div>
      {action}
    </div>
  );
}

/* Wizard stepper */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((s, i) => (
        <li key={s} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
          <div className="flex items-center gap-2.5">
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-cap font-bold transition",
              i < current ? "bg-success text-white" : i === current ? "bg-orange-500 text-navy-900 ring-4 ring-orange-500/20" : "bg-surface-2 text-fg2 border border-line")}>
              {i < current ? <Check size={16} strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("hidden whitespace-nowrap text-sm font-semibold md:block", i <= current ? "text-fg" : "text-fg2")}>{s}</span>
          </div>
          {i < steps.length - 1 && <span className={cn("mx-3 h-0.5 flex-1 rounded", i < current ? "bg-success" : "bg-line")} />}
        </li>
      ))}
    </ol>
  );
}

/* Quantity stepper */
export function QtyStepper({ value, onChange, min = 0, size = "m" }: { value: number; onChange: (v: number) => void; min?: number; size?: "m" | "l" }) {
  const s = size === "l" ? "h-12 w-12" : "h-10 w-10";
  return (
    <div className="inline-flex items-center rounded-ctl border border-line bg-surface">
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))} className={cn("grid place-items-center rounded-l-ctl text-fg hover:bg-tint", s)}><Minus size={16} /></button>
      <span className={cn("min-w-[36px] text-center font-semibold tnum", size === "l" && "text-base")}>{value}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(value + 1)} className={cn("grid place-items-center rounded-r-ctl text-fg hover:bg-tint", s)}><Plus size={16} /></button>
    </div>
  );
}

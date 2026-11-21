"use client";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Banknote, Check, CreditCard, Gift, Loader2, Mail, MessageCircle, MessageSquare, Plus, Printer, QrCode, Scale, ShieldCheck,
  Split, Trash2, UserPlus, Wallet, X, Ticket, Search, Lock, Ban, PlayCircle,
} from "lucide-react";
import { cn, rs } from "@/lib/format";
import { customers, staff, type Customer, type Product } from "@/lib/data";
import { useApp } from "@/lib/store";
import { Modal, Drawer } from "./overlays";
import { AddonInput, Avatar, Badge, Button, Field, Input, Segmented, Select, Textarea, Tabs } from "./ui";
import { Keypad, ProductThumb, Receipt, type Line, type ReceiptData } from "./pos-kit";
import { PinPad } from "./auth";

export type PayMethod = "cash" | "card" | "qr" | "credit" | "gift" | "split";

/* ─────────── Payment ─────────── */
export function PaymentModal({ open, onClose, total, customer, onComplete, initial = "cash" }: {
  open: boolean; onClose: () => void; total: number; customer: Customer | null; onComplete: (method: string, tendered: number) => void; initial?: PayMethod;
}) {
  const { t } = useApp();
  const [m, setM] = useState<PayMethod>(initial);
  const [cash, setCash] = useState("");
  const [ref, setRef] = useState("");
  const [cardState, setCardState] = useState<"waiting" | "approved">("waiting");
  const [secs, setSecs] = useState(120);
  const [gift, setGift] = useState("GC-7741-2290");
  const [split, setSplit] = useState([{ m: "Cash", a: 3000 }, { m: "Card", a: 0 }]);
  useEffect(() => { if (open) { setM(initial); setCash(""); setCardState("waiting"); setSecs(120); } }, [open, initial]);
  useEffect(() => {
    if (!open || m !== "qr") return;
    const i = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(i);
  }, [open, m]);
  useEffect(() => {
    if (!open || m !== "card") return;
    const tm = setTimeout(() => setCardState("approved"), 3200);
    return () => clearTimeout(tm);
  }, [open, m]);

  const tendered = parseFloat(cash || "0");
  const change = tendered - total;
  const splitPaid = split.reduce((s, r) => s + (r.a || 0), 0);
  const remaining = Math.max(0, total - splitPaid);
  const ready = m === "cash" ? tendered >= total : m === "card" ? cardState === "approved" || ref.length >= 4 : m === "split" ? remaining === 0 : m === "credit" ? !!customer : true;

  const tabs: { v: PayMethod; label: string; i: typeof Banknote }[] = [
    { v: "cash", label: t("pay.cash"), i: Banknote }, { v: "card", label: t("pay.card"), i: CreditCard }, { v: "qr", label: t("pay.qr"), i: QrCode },
    { v: "credit", label: t("pay.credit"), i: Wallet }, { v: "gift", label: t("pay.gift"), i: Gift }, { v: "split", label: t("pay.split"), i: Split },
  ];
  return (
    <Modal open={open} onClose={onClose} size="xl" hideClose className="sm:rounded-modal">
      <div className="-mx-6 flex items-start justify-between border-b border-line bg-tint px-6 pb-5 pt-6">
        <div>
          <p className="text-sm font-semibold text-fg2">Amount to pay</p>
          <p className="font-heading text-total font-bold tnum text-fg">{rs(total)}</p>
          {customer && <p className="mt-1 text-sm text-fg2">{customer.name} · {customer.points.toLocaleString()} pts</p>}
        </div>
        <button onClick={onClose} className="icon-btn h-12 w-12" aria-label="Close payment"><X size={22} /></button>
      </div>
      <div className="-mx-6 grid gap-0 md:grid-cols-[200px_1fr]">
        <div className="flex gap-2 overflow-x-auto border-b border-line p-3 md:flex-col md:border-b-0 md:border-r no-scrollbar" role="tablist" aria-label="Payment method">
          {tabs.map((x) => (
            <button key={x.v} role="tab" aria-selected={m === x.v} onClick={() => setM(x.v)}
              className={cn("relative flex h-14 shrink-0 items-center gap-3 rounded-ctl px-4 text-left text-sm font-semibold transition",
                m === x.v ? "bg-navy-900 text-white dark:bg-orange-500 dark:text-navy-900" : "text-fg2 hover:bg-tint hover:text-fg")}>
              <x.i size={20} />{x.label}
            </button>
          ))}
        </div>
        <div className="min-h-[420px] p-6">
          {m === "cash" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="label">{t("pay.tendered")}</p>
                <div className="flex h-16 items-center justify-end rounded-card border-2 border-orange-500 bg-surface px-4 font-heading text-[32px] font-semibold tnum">
                  <span className="mr-auto text-base text-fg2">Rs.</span>{tendered ? tendered.toLocaleString("en-LK") : <span className="text-muted">0</span>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[1000, 2000, 5000].map((v) => <Button key={v} size="l" className="h-14" onClick={() => setCash(String(v))}>Rs. {v.toLocaleString()}</Button>)}
                  <Button size="l" variant="secondary" className="h-14" onClick={() => setCash(String(total))}>{t("pay.exact")}</Button>
                </div>
                <div className={cn("mt-5 rounded-card p-4 transition", change >= 0 && tendered ? "bg-success/10" : "bg-surface-2")}>
                  <p className="text-sm font-semibold text-fg2">{t("pay.change")}</p>
                  <p className={cn("font-heading text-[40px] font-bold leading-tight tnum", change >= 0 && tendered ? "text-success" : "text-muted")}>{rs(Math.max(0, change))}</p>
                  {tendered > 0 && change < 0 && <p className="text-sm font-semibold text-danger">Short by {rs(-change)}</p>}
                </div>
              </div>
              <Keypad onKey={(k) => setCash((c) => (k === "⌫" ? c.slice(0, -1) : (c + k).replace(/^0+/, "").slice(0, 9)))} />
            </div>
          )}
          {m === "card" && (
            <div className="flex flex-col items-center py-6 text-center">
              {cardState === "waiting" ? (
                <>
                  <span className="relative grid h-24 w-24 place-items-center"><span className="absolute inset-0 animate-ping rounded-full bg-orange-500/20" /><span className="grid h-20 w-20 place-items-center rounded-full bg-orange-100 text-navy-900"><Loader2 size={36} className="animate-spin" /></span></span>
                  <h3 className="mt-5 font-heading text-lg font-semibold">Waiting for card terminal…</h3>
                  <p className="mt-1 text-sm text-fg2">Ask the customer to tap, insert or swipe — Commercial Bank · Verifone V200c</p>
                </>
              ) : (
                <>
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success animate-pop"><Check size={40} strokeWidth={3} /></span>
                  <h3 className="mt-5 font-heading text-lg font-semibold">Approved · Visa •••• 4417</h3>
                  <p className="mt-1 text-sm text-fg2">Auth code 0A73K9 · {rs(total)}</p>
                </>
              )}
              <div className="mt-8 w-full max-w-sm text-left">
                <Field label="Or enter reference manually" hint="Use if the terminal is offline — 6-digit approval code"><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 0A73K9" className="h-12" /></Field>
              </div>
            </div>
          )}
          {m === "qr" && (
            <div className="flex flex-col items-center gap-6 py-2 md:flex-row md:items-start md:justify-center">
              <div className="rounded-card border border-line bg-white p-5 shadow-soft">
                <p className="mb-2 text-center text-cap font-bold tracking-wider text-navy-900">LANKAQR</p>
                <QRCodeSVG value={`lankaqr://pay?m=HELADIGI-C03&a=${total.toFixed(2)}`} size={220} level="M" />
                <p className="mt-3 text-center font-heading text-xl font-bold text-navy-900 tnum">{rs(total)}</p>
              </div>
              <div className="max-w-xs text-center md:pt-8 md:text-left">
                <h3 className="font-heading text-lg font-semibold">Scan with any banking app</h3>
                <p className="mt-1 text-sm text-fg2">HeladiGi Mart · Colombo 03 · Merchant ID 6200 1145 77</p>
                <div className="mt-5 inline-flex items-center gap-3 rounded-card bg-surface-2 px-4 py-3">
                  <Loader2 size={18} className="animate-spin text-orange-500" />
                  <span className="text-sm">Expires in <b className="tnum">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</b></span>
                </div>
                <p className="mt-3 text-cap text-fg2">Payment is confirmed automatically when received.</p>
              </div>
            </div>
          )}
          {m === "credit" && (
            customer ? (
              <div className="mx-auto max-w-md py-4">
                <div className="flex items-center gap-3"><Avatar name={customer.name} size={48} color="#1A3170" /><div><p className="font-semibold">{customer.name}</p><p className="text-sm text-fg2">{customer.phone}</p></div><Badge tone="amber" className="ml-auto">{customer.tier}</Badge></div>
                <dl className="mt-6 space-y-3 text-sm">
                  {[["Credit limit", rs(customer.limit)], ["Current balance", rs(customer.credit)], ["This sale", rs(total)], ["Balance after sale", rs(customer.credit + total)]].map(([a, b], i) => (
                    <div key={a} className={cn("flex justify-between", i === 3 && "border-t border-line pt-3 font-semibold")}><dt className="text-fg2">{a}</dt><dd className="tnum">{b}</dd></div>
                  ))}
                </dl>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-orange-500" style={{ width: `${Math.min(100, ((customer.credit + total) / customer.limit) * 100)}%` }} /></div>
                <p className="mt-2 text-cap text-fg2 tnum">{rs(customer.limit - customer.credit - total)} available after this sale</p>
              </div>
            ) : (
              <div className="py-16 text-center"><Wallet size={36} className="mx-auto text-fg2" /><p className="mt-3 font-semibold">Select a customer first</p><p className="text-sm text-fg2">Credit sales must be linked to a customer account.</p></div>
            )
          )}
          {m === "gift" && (
            <div className="mx-auto max-w-md py-4">
              <Field label="Gift card number"><AddonInput prefix={<Gift size={16} />} value={gift} onChange={(e) => setGift(e.target.value)} className="h-12" /></Field>
              <div className="mt-4 overflow-hidden rounded-card bg-navy-900 p-5 text-white">
                <div className="flex justify-between"><span className="text-cap font-semibold tracking-widest text-white/60">HELADIGI GIFT CARD</span><Gift size={18} className="text-orange-500" /></div>
                <p className="mt-6 font-mono text-lg tracking-widest">{gift}</p>
                <div className="mt-3 flex justify-between text-sm"><span className="text-white/70">Balance</span><span className="font-heading text-lg font-semibold text-orange-500 tnum">{rs(7500)}</span></div>
              </div>
              <p className="mt-3 text-sm text-fg2">{7500 >= total ? `Rs. ${(7500 - total).toLocaleString("en-LK", { minimumFractionDigits: 2 })} will remain on the card.` : `Card covers Rs. 7,500.00 — collect ${rs(total - 7500)} by another method (use Split).`}</p>
            </div>
          )}
          {m === "split" && (
            <div className="mx-auto max-w-lg">
              <div className="space-y-2">
                {split.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select options={["Cash", "Card", "LankaQR", "Gift Card", "Credit"]} value={r.m} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, m: e.target.value } : x)))} className="w-40" />
                    <AddonInput prefix="Rs." inputMode="decimal" value={r.a || ""} placeholder="0.00" onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, a: parseFloat(e.target.value) || 0 } : x)))} className="flex-1" />
                    <button onClick={() => setSplit(split.map((x, j) => (j === i ? { ...x, a: x.a + remaining } : x)))} className="h-11 rounded-ctl border border-line px-3 text-cap font-semibold hover:bg-tint">Rest</button>
                    <button aria-label="Remove row" onClick={() => setSplit(split.filter((_, j) => j !== i))} className="grid h-11 w-11 place-items-center rounded-ctl text-fg2 hover:bg-danger/10 hover:text-danger"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
              <Button icon={Plus} variant="ghost" className="mt-2" onClick={() => setSplit([...split, { m: "LankaQR", a: 0 }])}>Add payment</Button>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-card bg-surface-2 p-4"><p className="text-cap font-semibold text-fg2">Paid</p><p className="font-heading text-xl font-semibold tnum">{rs(splitPaid)}</p></div>
                <div className={cn("rounded-card p-4", remaining ? "bg-orange-100 text-navy-900" : "bg-success/10")}><p className="text-cap font-semibold opacity-80">Remaining</p><p className={cn("font-heading text-xl font-semibold tnum", !remaining && "text-success")}>{rs(remaining)}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="-mx-6 -mb-5 border-t border-line p-4">
        <Button variant="primary" size="pos" className="w-full" disabled={!ready} kbd="Enter"
          onClick={() => onComplete(tabs.find((x) => x.v === m)!.label, m === "cash" ? tendered : total)}>
          {t("pay.complete")} · {rs(total)}
        </Button>
      </div>
    </Modal>
  );
}

/* ─────────── Sale complete ─────────── */
export function SaleComplete({ open, change, total, method, points, onNew, onReceipt }: { open: boolean; change: number; total: number; method: string; points: number; onNew: () => void; onReceipt: () => void }) {
  const { t, toast } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  if (!open) return null;
  const opts = [{ k: "Print", i: Printer }, { k: "SMS", i: MessageSquare }, { k: "Email", i: Mail }, { k: "WhatsApp", i: MessageCircle }, { k: "No receipt", i: Ban }];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("done.title")}>
      <div className="w-full max-w-lg rounded-modal bg-surface p-8 text-center shadow-lift animate-rise">
        <svg viewBox="0 0 80 80" className="mx-auto h-24 w-24 animate-pop" aria-hidden>
          <circle cx="40" cy="40" r="38" fill="#16A34A" fillOpacity=".12" />
          <circle cx="40" cy="40" r="28" fill="#16A34A" />
          <path d="M28 41 l8 8 l16 -17" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="48" strokeDashoffset="48" className="animate-draw" />
        </svg>
        <h2 className="mt-4 font-heading text-xl font-semibold">{t("done.title")}</h2>
        <p className="text-sm text-fg2">{rs(total)} · {method}{points ? ` · +${points} loyalty points` : ""}</p>
        {change > 0 && (
          <div className="mt-5 rounded-card bg-success/10 py-4">
            <p className="text-sm font-semibold text-fg2">{t("pay.change")}</p>
            <p className="font-heading text-[48px] font-bold leading-none text-success tnum">{rs(change)}</p>
          </div>
        )}
        <p className="mt-6 text-sm font-semibold">{t("done.receipt")}</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {opts.map((o) => (
            <button key={o.k} onClick={() => { setSel(o.k); if (o.k !== "No receipt") toast({ tone: "success", title: o.k === "Print" ? "Printing receipt…" : `Receipt sent via ${o.k}`, body: o.k === "Print" ? "Epson TM-T82 · Counter 1" : "+94 77 214 5566" }); }}
              className={cn("flex h-20 flex-col items-center justify-center gap-1.5 rounded-card border text-cap font-semibold transition", sel === o.k ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}>
              <o.i size={22} />{o.k}
            </button>
          ))}
        </div>
        <button onClick={onReceipt} className="mt-3 text-sm font-semibold text-fg2 underline-offset-4 hover:text-fg hover:underline">Preview receipt</button>
        <Button variant="primary" size="pos" className="mt-5 w-full" onClick={onNew} kbd="Enter">{t("done.new")}</Button>
      </div>
    </div>
  );
}

export function ReceiptModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReceiptData }) {
  const [w, setW] = useState<"80" | "58">("80");
  const [l, setL] = useState<"en" | "si">("en");
  return (
    <Modal open={open} onClose={onClose} title="Receipt preview" size="m" footer={<><Button icon={MessageCircle}>WhatsApp</Button><Button icon={Mail}>Email</Button><Button icon={Printer} variant="secondary" onClick={() => window.print()}>Print</Button></>}>
      <div className="mb-4 flex flex-wrap gap-2"><Segmented value={w} onChange={setW} options={[{ v: "80", label: "80 mm" }, { v: "58", label: "58 mm" }]} /><Segmented value={l} onChange={setL} options={[{ v: "en", label: "English" }, { v: "si", label: "සිංහල" }]} /></div>
      <div className="rounded-card bg-surface-2 py-6"><Receipt d={data} width={w === "80" ? 80 : 58} lang={l} /></div>
    </Modal>
  );
}

/* ─────────── Held orders ─────────── */
export type Held = { id: string; customer: string; items: number; total: number; time: string; note?: string };
export function HeldDrawer({ open, onClose, held, onResume, onDelete }: { open: boolean; onClose: () => void; held: Held[]; onResume: (h: Held) => void; onDelete: (h: Held) => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Held orders" sub={`${held.length} parked sales on this terminal`} width="max-w-md">
      <ul className="space-y-3">
        {held.map((h) => (
          <li key={h.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">{h.customer}</p><p className="text-cap text-fg2">{h.id} · held at {h.time} · {h.items} items</p>{h.note && <p className="mt-1 text-cap italic text-fg2">“{h.note}”</p>}</div>
              <p className="font-heading font-semibold tnum">{rs(h.total)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" icon={PlayCircle} className="h-12 flex-1" onClick={() => onResume(h)}>Resume</Button>
              <Button variant="danger-outline" icon={Trash2} className="h-12" onClick={() => onDelete(h)} aria-label="Delete held order">Delete</Button>
            </div>
          </li>
        ))}
        {!held.length && <p className="py-12 text-center text-sm text-fg2">No held orders.</p>}
      </ul>
    </Drawer>
  );
}

/* ─────────── Discount ─────────── */
export function DiscountModal({ open, onClose, subtotal, onApply, onNeedApproval }: { open: boolean; onClose: () => void; subtotal: number; onApply: (type: "%" | "Rs", v: number, reason: string) => void; onNeedApproval: (after: () => void) => void }) {
  const [type, setType] = useState<"%" | "Rs">("%");
  const [v, setV] = useState("5");
  const [reason, setReason] = useState("Loyal customer");
  const val = parseFloat(v || "0");
  const pct = type === "%" ? val : (val / subtotal) * 100;
  const over = pct > 10;
  const amount = type === "%" ? (subtotal * val) / 100 : val;
  const apply = () => onApply(type, val, reason);
  return (
    <Modal open={open} onClose={onClose} title="Cart discount" sub={`Subtotal ${rs(subtotal)}`} size="m"
      footer={<><Button size="l" onClick={onClose}>Cancel</Button><Button size="l" variant="primary" icon={over ? Lock : undefined} onClick={() => (over ? onNeedApproval(apply) : apply())}>{over ? "Request approval" : "Apply discount"}</Button></>}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Segmented size="l" value={type} onChange={(x) => { setType(x); setV(""); }} options={[{ v: "%", label: "Percentage %" }, { v: "Rs", label: "Fixed Rs." }]} />
          <div className="mt-4 flex h-16 items-center justify-end rounded-card border-2 border-orange-500 px-4 font-heading text-[32px] font-semibold tnum">
            {type === "Rs" && <span className="mr-auto text-base text-fg2">Rs.</span>}{v || <span className="text-muted">0</span>}{type === "%" && <span className="ml-1 text-fg2">%</span>}
          </div>
          <p className="mt-2 text-sm text-fg2">Customer saves <b className="text-fg tnum">{rs(Math.min(amount, subtotal))}</b></p>
          <Field label="Reason" className="mt-4"><Select options={["Loyal customer", "Damaged packaging", "Price match", "Staff purchase", "Bulk purchase", "Other"]} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          {over && <div className="mt-4 flex items-start gap-2 rounded-card bg-warning/15 p-3 text-sm text-[#7A5A00] dark:text-warning"><Lock size={16} className="mt-0.5 shrink-0" /><span><b>Manager approval required</b> — cashiers can give up to 10% without a PIN.</span></div>}
        </div>
        <Keypad size="m" extra="." onKey={(k) => setV((c) => (k === "⌫" ? c.slice(0, -1) : (c + k).slice(0, 7)))} />
      </div>
    </Modal>
  );
}

/* ─────────── Manager override ─────────── */
export function OverrideModal({ open, onClose, onApproved, action = "Discount above 10%" }: { open: boolean; onClose: () => void; onApproved: () => void; action?: string }) {
  const mgr = staff[1];
  return (
    <Modal open={open} onClose={onClose} size="s" hideClose>
      <div className="flex flex-col items-center pt-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-navy-900"><ShieldCheck size={28} /></span>
        <h2 className="mt-3 font-heading text-lg font-semibold">Manager approval</h2>
        <p className="text-sm text-fg2">{action}</p>
        <div className="my-5 flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3"><Avatar name={mgr.name} size={32} color={mgr.color} /><span className="text-sm font-semibold">{mgr.name}</span><span className="text-cap text-fg2">· Manager</span></div>
        <PinPad onSuccess={onApproved} />
        <button onClick={onClose} className="mt-4 h-11 text-sm font-semibold text-fg2 hover:text-fg">Cancel</button>
      </div>
    </Modal>
  );
}

/* ─────────── Coupon / gift card ─────────── */
export function CouponModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (code: string) => void }) {
  const [code, setCode] = useState("AVURUDU10");
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  return (
    <Modal open={open} onClose={onClose} title="Apply coupon or gift card" size="s"
      footer={<><Button size="l" onClick={onClose}>Cancel</Button><Button size="l" variant="primary" disabled={state !== "ok"} onClick={() => onApply(code)}>Apply to sale</Button></>}>
      <Field label="Code" error={state === "bad" ? "This code has expired (ended 30/04/2026)" : undefined}>
        <div className="flex gap-2"><AddonInput prefix={<Ticket size={16} />} value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setState("idle"); }} className="h-12 flex-1 font-mono" /><Button size="l" variant="secondary" onClick={() => setState(code === "AVURUDU10" || code.startsWith("GC-") ? "ok" : "bad")}>Check</Button></div>
      </Field>
      {state === "ok" && (
        <div className="mt-4 flex items-start gap-3 rounded-card border border-success/30 bg-success/10 p-4">
          <Check className="mt-0.5 text-success" size={20} />
          <div className="text-sm"><p className="font-semibold">{code.startsWith("GC-") ? "Gift card · Balance Rs. 7,500.00" : "Avurudu Special — 10% off"}</p><p className="text-fg2">{code.startsWith("GC-") ? "Use it as a payment method at checkout." : "Min. spend Rs. 2,500 · 1 use per customer · expires 30/11/2026"}</p></div>
        </div>
      )}
      <p className="mt-4 text-cap text-fg2">Try <button className="font-mono font-semibold text-fg" onClick={() => setCode("AVURUDU10")}>AVURUDU10</button> or <button className="font-mono font-semibold text-fg" onClick={() => setCode("NEWYEAR25")}>NEWYEAR25</button></p>
    </Modal>
  );
}

/* ─────────── Customer search / quick create ─────────── */
export function CustomerModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: Customer | null) => void }) {
  const [tab, setTab] = useState<"find" | "new">("find");
  const [q, setQ] = useState("");
  const list = useMemo(() => customers.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <Modal open={open} onClose={onClose} title="Customer" size="m"
      footer={tab === "new" ? <><Button size="l" onClick={() => setTab("find")}>Back</Button><Button size="l" variant="primary" onClick={() => onPick({ ...customers[2], id: "new", name: "Tharindu Abeywardena", phone: "+94 77 908 1123", points: 0, credit: 0, tier: "Silver" })}>Save & add to sale</Button></> : undefined}>
      <Tabs value={tab} onChange={setTab} tabs={[{ v: "find", label: "Search" }, { v: "new", label: "Quick create" }]} className="mb-4" />
      {tab === "find" ? (
        <>
          <div className="field-wrap h-12"><Search size={18} className="ml-3 text-fg2" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or phone (e.g. 077…)" /></div>
          <ul className="mt-3 max-h-[360px] divide-y divide-line overflow-y-auto">
            <li><button onClick={() => onPick(null)} className="flex h-14 w-full items-center gap-3 rounded-ctl px-2 text-left hover:bg-tint"><span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2"><UserPlus size={18} /></span><span className="font-semibold">Walk-in Customer</span></button></li>
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => onPick(c)} className="flex min-h-14 w-full items-center gap-3 rounded-ctl px-2 py-2 text-left hover:bg-tint">
                  <Avatar name={c.name} size={40} color="#1A3170" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.name}</span><span className="text-cap text-fg2">{c.phone}</span></span>
                  <span className="text-right text-cap"><Badge tone={c.tier === "Platinum" ? "navy" : c.tier === "Gold" ? "amber" : "gray"}>{c.tier}</Badge><span className="mt-1 block text-fg2 tnum">{c.points.toLocaleString()} pts</span></span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" icon={UserPlus} className="mt-2" onClick={() => setTab("new")}>New customer “{q || "…"}”</Button>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required className="sm:col-span-2"><Input defaultValue="Tharindu Abeywardena" className="h-12" /></Field>
          <Field label="Mobile" required><AddonInput prefix="+94" defaultValue="77 908 1123" inputMode="tel" className="h-12" /></Field>
          <Field label="Email"><Input type="email" placeholder="name@example.com" className="h-12" /></Field>
          <Field label="NIC (optional)" hint="Old (9 digits + V) or new 12-digit format" className="sm:col-span-2"><Input placeholder="e.g. 199512345678" className="h-12" /></Field>
        </div>
      )}
    </Modal>
  );
}

/* ─────────── Variant picker ─────────── */
export function VariantModal({ p, onClose, onAdd }: { p: Product | null; onClose: () => void; onAdd: (p: Product, v: string, price: number) => void }) {
  const [sel, setSel] = useState<Record<string, string>>({});
  useEffect(() => { if (p?.variants) setSel(Object.fromEntries(p.variants.map((g) => [g.group, g.options[0]]))); }, [p]);
  if (!p?.variants) return null;
  const price = p.price + (sel.Size === "2L" ? 950 : sel.Size === "160g" ? 90 : sel.Size === "70g" ? -110 : 0);
  return (
    <Modal open={!!p} onClose={onClose} size="s" title={p.name} sub={p.brand}
      footer={<Button size="pos" variant="primary" className="w-full" onClick={() => onAdd(p, Object.values(sel).join(" · "), price)}>Add · {rs(price)}</Button>}>
      <div className="flex items-center gap-3"><ProductThumb p={p} className="h-16 w-16" /><div className="text-sm text-fg2">Stock across variants: <b className="text-fg">{p.stock}</b></div></div>
      {p.variants.map((g) => (
        <fieldset key={g.group} className="mt-5">
          <legend className="label">{g.group}</legend>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o, i) => {
              const out = g.group === "Flavour" && i === 3;
              return (
                <button key={o} disabled={out} onClick={() => setSel({ ...sel, [g.group]: o })} aria-pressed={sel[g.group] === o}
                  className={cn("h-12 rounded-ctl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-50",
                    sel[g.group] === o ? "border-orange-500 bg-orange-100 text-navy-900 ring-2 ring-orange-500/30" : "border-line hover:bg-tint")}>
                  {o}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </Modal>
  );
}

/* ─────────── Weight entry ─────────── */
export function WeightModal({ p, onClose, onAdd }: { p: Product | null; onClose: () => void; onAdd: (p: Product, kg: number) => void }) {
  const [mode, setMode] = useState<"scale" | "manual">("scale");
  const [reading, setReading] = useState(1.25);
  const [stable, setStable] = useState(false);
  const [manual, setManual] = useState("");
  useEffect(() => {
    if (!p) return;
    setStable(false); setMode("scale"); setManual("");
    let n = 0;
    const i = setInterval(() => { n++; setReading(1.25 + (n < 6 ? (Math.random() - 0.5) * 0.04 : 0)); if (n >= 6) { setStable(true); clearInterval(i); } }, 220);
    return () => clearInterval(i);
  }, [p]);
  if (!p) return null;
  const kg = mode === "scale" ? reading : parseFloat(manual || "0");
  return (
    <Modal open={!!p} onClose={onClose} size="m" title={p.name} sub={`${rs(p.price)} per kg`}
      footer={<Button size="pos" variant="primary" className="w-full" disabled={!kg || (mode === "scale" && !stable)} onClick={() => onAdd(p, Number(kg.toFixed(3)))}>Add {kg.toFixed(3)} kg · {rs(kg * p.price)}</Button>}>
      <Segmented size="l" value={mode} onChange={setMode} options={[{ v: "scale", label: "Scale" }, { v: "manual", label: "Enter manually" }]} />
      {mode === "scale" ? (
        <div className="mt-5 rounded-card bg-navy-900 p-6 text-center text-white">
          <p className="flex items-center justify-center gap-2 text-cap font-semibold tracking-wider text-white/60"><Scale size={14} />CAS PD-II · CONNECTED</p>
          <p className="mt-2 font-mono text-[56px] font-bold leading-none tnum">{reading.toFixed(3)}<span className="ml-2 text-2xl text-white/60">kg</span></p>
          <p className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-cap font-semibold", stable ? "bg-success text-white" : "bg-amber-400 text-navy-900")}>{stable ? <><Check size={14} />Stable</> : <><Loader2 size={14} className="animate-spin" />Settling…</>}</p>
          <p className="mt-4 text-sm text-white/70">Tare 0.000 kg · Price {rs(kg * p.price)}</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><div className="flex h-16 items-center justify-end rounded-card border-2 border-orange-500 px-4 font-heading text-[32px] font-semibold tnum">{manual || <span className="text-muted">0.000</span>}<span className="ml-2 text-base text-fg2">kg</span></div>
            <div className="mt-3 grid grid-cols-3 gap-2">{["0.250", "0.500", "1.000"].map((v) => <Button key={v} onClick={() => setManual(v)}>{v} kg</Button>)}</div></div>
          <Keypad size="m" extra="." onKey={(k) => setManual((c) => (k === "⌫" ? c.slice(0, -1) : (c + k).slice(0, 6)))} />
        </div>
      )}
    </Modal>
  );
}

/* ─────────── Line edit ─────────── */
export function LineEditModal({ line, onClose, onSave, onLocked }: { line: Line | null; onClose: () => void; onSave: (l: Line) => void; onLocked: () => void }) {
  const [d, setD] = useState<Line | null>(line);
  useEffect(() => setD(line), [line]);
  if (!line || !d) return null;
  return (
    <Modal open={!!line} onClose={onClose} title="Edit line" sub={line.p.name} size="s"
      footer={<><Button size="l" onClick={onClose}>Cancel</Button><Button size="l" variant="primary" onClick={() => onSave(d)}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Unit price" hint="Price overrides need manager approval">
          <div className="flex gap-2"><AddonInput prefix="Rs." value={d.price.toFixed(2)} readOnly className="h-12 flex-1" /><Button size="l" locked onClick={onLocked}>Override</Button></div>
        </Field>
        <Field label="Line discount (%)">
          <div className="flex flex-wrap gap-2">{[0, 5, 10, 15].map((v) => <button key={v} onClick={() => setD({ ...d, disc: v })} className={cn("h-12 min-w-[64px] rounded-ctl border px-3 font-semibold", (d.disc ?? 0) === v ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}>{v}%</button>)}</div>
        </Field>
        <Field label="Note"><Textarea value={d.note ?? ""} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder="e.g. Gift wrap, no plastic bag" className="min-h-[72px]" /></Field>
      </div>
    </Modal>
  );
}

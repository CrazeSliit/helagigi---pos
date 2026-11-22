"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Banknote, Check, CreditCard, Gift, Plus, Printer, QrCode, ShieldCheck, Split, Trash2, UserPlus, Wallet, X, Ticket, Search, PlayCircle,
} from "lucide-react";
import { cn, rs } from "@/lib/format";
import type { Customer, Product } from "@/lib/data";
import { api, apiPage, errText, toCustomer, type ApiCustomer } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Modal, Drawer } from "./overlays";
import { AddonInput, Avatar, Badge, Button, Field, Input, Segmented, Select, Tabs } from "./ui";
import { Keypad, ProductThumb, Receipt, type Line, type ReceiptData } from "./pos-kit";
import { PinPad } from "./auth";

export type PayMethod = "cash" | "card" | "qr" | "credit" | "gift" | "split";
export type PayLine = { method: "CASH" | "CARD" | "LANKAQR" | "CREDIT" | "GIFT_CARD"; amount: number; reference?: string; giftCardCode?: string };
const SPLIT: Record<string, PayLine["method"]> = { Cash: "CASH", Card: "CARD", LankaQR: "LANKAQR", "Gift Card": "GIFT_CARD", Credit: "CREDIT" };
const cents = (n: number) => Math.round(n * 100) / 100;

/* ─────────── Payment ─────────── */
export function PaymentModal({ open, onClose, total, customer, onComplete, initial = "cash", busy, error }: {
  open: boolean; onClose: () => void; total: number; customer: Customer | null; onComplete: (lines: PayLine[], label: string) => void; initial?: PayMethod; busy?: boolean; error?: string;
}) {
  const { t } = useApp();
  const [m, setM] = useState<PayMethod>(initial);
  const [cash, setCash] = useState("");
  const [ref, setRef] = useState("");
  const [gift, setGift] = useState("");
  const [card, setCard] = useState<{ code: string; balance: number } | null>(null);
  const [giftErr, setGiftErr] = useState("");
  const [split, setSplit] = useState<{ m: string; a: number; ref: string }[]>([{ m: "Cash", a: 0, ref: "" }, { m: "Card", a: 0, ref: "" }]);
  useEffect(() => { if (open) { setM(initial); setCash(""); setRef(""); setGift(""); setCard(null); setGiftErr(""); setSplit([{ m: "Cash", a: 0, ref: "" }, { m: "Card", a: 0, ref: "" }]); } }, [open, initial]);
  const checkGift = async () => {
    setGiftErr(""); setCard(null);
    try {
      const g = await api<{ code: string; balance: number; active: boolean; expiresAt: string | null }>(`/gift-cards/lookup/${encodeURIComponent(gift.trim())}`);
      if (!g.active || (g.expiresAt && new Date(g.expiresAt) < new Date())) setGiftErr("This gift card is inactive or expired");
      else setCard({ code: g.code, balance: g.balance });
    } catch (e) { setGiftErr(errText(e)); }
  };

  const tendered = parseFloat(cash || "0");
  const change = tendered - total;
  const splitPaid = cents(split.reduce((acc, r) => acc + (r.a || 0), 0));
  const remaining = cents(Math.max(0, total - splitPaid));
  const splitOk = splitPaid === total && split.some((r) => r.a > 0) && split.every((r) => !r.a || r.m === "Cash" || r.m === "Credit" ? (r.m !== "Credit" || !!customer) : r.ref.trim().length >= 4);
  const ready = !busy && (m === "cash" ? tendered >= total : m === "card" || m === "qr" ? ref.trim().length >= 4 : m === "split" ? splitOk : m === "credit" ? !!customer && customer.credit + total <= customer.limit : !!card && card.balance >= total);

  const tabs: { v: PayMethod; label: string; i: typeof Banknote }[] = [
    { v: "cash", label: t("pay.cash"), i: Banknote }, { v: "card", label: t("pay.card"), i: CreditCard }, { v: "qr", label: t("pay.qr"), i: QrCode },
    { v: "credit", label: t("pay.credit"), i: Wallet }, { v: "gift", label: t("pay.gift"), i: Gift }, { v: "split", label: t("pay.split"), i: Split },
  ];
  const complete = () => {
    const label = tabs.find((x) => x.v === m)!.label;
    if (m === "cash") return onComplete([{ method: "CASH", amount: cents(tendered) }], label);
    if (m === "card") return onComplete([{ method: "CARD", amount: total, reference: ref.trim() }], label);
    if (m === "qr") return onComplete([{ method: "LANKAQR", amount: total, reference: ref.trim() }], label);
    if (m === "credit") return onComplete([{ method: "CREDIT", amount: total }], label);
    if (m === "gift") return onComplete([{ method: "GIFT_CARD", amount: total, giftCardCode: card!.code }], label);
    onComplete(split.filter((r) => r.a > 0).map((r) => {
      const method = SPLIT[r.m];
      return { method, amount: cents(r.a), ...(method === "GIFT_CARD" ? { giftCardCode: r.ref.trim() } : method === "CARD" || method === "LANKAQR" ? { reference: r.ref.trim() } : {}) };
    }), label);
  };
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
            <button key={x.v} role="tab" aria-selected={m === x.v} onClick={() => { setM(x.v); setRef(""); }}
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
          {(m === "card" || m === "qr") && (
            <div className="mx-auto flex max-w-sm flex-col items-center py-8 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-orange-100 text-navy-900">{m === "card" ? <CreditCard size={36} /> : <QrCode size={36} />}</span>
              <h3 className="mt-5 font-heading text-lg font-semibold">{m === "card" ? "Take the card payment on your terminal" : "Take the LankaQR payment"}</h3>
              <p className="mt-1 text-sm text-fg2">Charge <b className="text-fg tnum">{rs(total)}</b>, then enter the approval or transaction code.</p>
              <div className="mt-6 w-full text-left"><Field label={m === "card" ? "Approval code" : "Transaction reference"} required hint="At least 4 characters"><Input autoFocus value={ref} onChange={(e) => setRef(e.target.value)} className="h-12" /></Field></div>
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
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-orange-500" style={{ width: `${customer.limit ? Math.min(100, ((customer.credit + total) / customer.limit) * 100) : 100}%` }} /></div>
                {customer.credit + total > customer.limit ? <p className="mt-2 text-sm font-semibold text-danger">This sale is over the customer's credit limit.</p> : <p className="mt-2 text-cap text-fg2 tnum">{rs(customer.limit - customer.credit - total)} available after this sale</p>}
              </div>
            ) : (
              <div className="py-16 text-center"><Wallet size={36} className="mx-auto text-fg2" /><p className="mt-3 font-semibold">Select a customer first</p><p className="text-sm text-fg2">Credit sales must be linked to a customer account.</p></div>
            )
          )}
          {m === "gift" && (
            <div className="mx-auto max-w-md py-4">
              <Field label="Gift card number" error={giftErr || undefined}>
                <div className="flex gap-2"><AddonInput prefix={<Gift size={16} />} value={gift} onChange={(e) => { setGift(e.target.value.toUpperCase()); setCard(null); }} className="h-12 flex-1" /><Button size="l" variant="secondary" disabled={!gift.trim()} onClick={() => void checkGift()}>Check</Button></div>
              </Field>
              {card && (
                <div className="mt-4 rounded-card bg-navy-900 p-5 text-white">
                  <p className="font-mono text-lg tracking-widest">{card.code}</p>
                  <div className="mt-3 flex justify-between text-sm"><span className="text-white/70">Balance</span><span className="font-heading text-lg font-semibold text-orange-500 tnum">{rs(card.balance)}</span></div>
                </div>
              )}
              {card && <p className="mt-3 text-sm text-fg2">{card.balance >= total ? `${rs(card.balance - total)} will remain on the card.` : `Card covers ${rs(card.balance)}. Use Split to collect the rest.`}</p>}
            </div>
          )}
          {m === "split" && (
            <div className="mx-auto max-w-lg">
              <div className="space-y-2">
                {split.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Select options={Object.keys(SPLIT)} value={r.m} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, m: e.target.value, ref: "" } : x)))} className="w-36" />
                    <AddonInput prefix="Rs." inputMode="decimal" value={r.a || ""} placeholder="0.00" aria-label="Amount" onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, a: parseFloat(e.target.value) || 0 } : x)))} className="min-w-[120px] flex-1" />
                    <button onClick={() => setSplit(split.map((x, j) => (j === i ? { ...x, a: cents(x.a + remaining) } : x)))} className="h-11 rounded-ctl border border-line px-3 text-cap font-semibold hover:bg-tint">Rest</button>
                    <button aria-label="Remove row" disabled={split.length < 2} onClick={() => setSplit(split.filter((_, j) => j !== i))} className="grid h-11 w-11 place-items-center rounded-ctl text-fg2 hover:bg-danger/10 hover:text-danger disabled:opacity-40"><Trash2 size={18} /></button>
                    {r.m !== "Cash" && r.m !== "Credit" && <Input aria-label={r.m === "Gift Card" ? "Gift card number" : "Reference"} placeholder={r.m === "Gift Card" ? "Gift card number" : "Approval / reference code"} value={r.ref} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, ref: r.m === "Gift Card" ? e.target.value.toUpperCase() : e.target.value } : x)))} className="w-full" />}
                  </div>
                ))}
              </div>
              <Button icon={Plus} variant="ghost" className="mt-2" onClick={() => setSplit([...split, { m: "LankaQR", a: 0, ref: "" }])}>Add payment</Button>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-card bg-surface-2 p-4"><p className="text-cap font-semibold text-fg2">Paid</p><p className="font-heading text-xl font-semibold tnum">{rs(splitPaid)}</p></div>
                <div className={cn("rounded-card p-4", remaining ? "bg-orange-100 text-navy-900" : "bg-success/10")}><p className="text-cap font-semibold opacity-80">Remaining</p><p className={cn("font-heading text-xl font-semibold tnum", !remaining && "text-success")}>{rs(remaining)}</p></div>
              </div>
              {splitPaid > total && <p className="mt-2 text-sm font-semibold text-danger">Split payments must add up exactly to the total.</p>}
            </div>
          )}
        </div>
      </div>
      <div className="-mx-6 -mb-5 border-t border-line p-4">
        {error && <p role="alert" className="mb-3 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{error}</p>}
        <Button variant="primary" size="pos" className="w-full" disabled={!ready} loading={busy} onClick={complete}>
          {t("pay.complete")} · {rs(total)}
        </Button>
      </div>
    </Modal>
  );
}

/* ─────────── Sale complete ─────────── */
export function SaleComplete({ open, change, total, method, points, invoice, onNew, onReceipt }: { open: boolean; change: number; total: number; method: string; points: number; invoice?: string; onNew: () => void; onReceipt: () => void }) {
  const { t } = useApp();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t("done.title")}>
      <div className="w-full max-w-lg rounded-modal bg-surface p-8 text-center shadow-lift animate-rise">
        <svg viewBox="0 0 80 80" className="mx-auto h-24 w-24 animate-pop" aria-hidden>
          <circle cx="40" cy="40" r="38" fill="#16A34A" fillOpacity=".12" />
          <circle cx="40" cy="40" r="28" fill="#16A34A" />
          <path d="M28 41 l8 8 l16 -17" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="48" strokeDashoffset="48" className="animate-draw" />
        </svg>
        <h2 className="mt-4 font-heading text-xl font-semibold">{t("done.title")}</h2>
        {invoice && <p className="font-mono text-cap text-fg2">{invoice}</p>}
        <p className="text-sm text-fg2">{rs(total)} · {method}{points ? ` · +${points} loyalty points` : ""}</p>
        {change > 0 && (
          <div className="mt-5 rounded-card bg-success/10 py-4">
            <p className="text-sm font-semibold text-fg2">{t("pay.change")}</p>
            <p className="font-heading text-[48px] font-bold leading-none text-success tnum">{rs(change)}</p>
          </div>
        )}
        <Button icon={Printer} size="l" className="mt-6 w-full" onClick={onReceipt}>View / print receipt</Button>
        <Button variant="primary" size="pos" className="mt-3 w-full" onClick={onNew}>{t("done.new")}</Button>
      </div>
    </div>
  );
}

export function ReceiptModal({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReceiptData | null }) {
  const [w, setW] = useState<"80" | "58">("80");
  const [l, setL] = useState<"en" | "si">("en");
  if (!data) return null;
  return (
    <Modal open={open} onClose={onClose} title="Receipt" size="m" footer={<Button icon={Printer} variant="secondary" onClick={() => window.print()}>Print</Button>}>
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
export function DiscountModal({ open, onClose, subtotal, onApply }: { open: boolean; onClose: () => void; subtotal: number; onApply: (type: "%" | "Rs", v: number) => void }) {
  const [type, setType] = useState<"%" | "Rs">("%");
  const [v, setV] = useState("");
  const val = parseFloat(v || "0");
  const pct = type === "%" ? val : subtotal ? (val / subtotal) * 100 : 0;
  const over = pct > 10;
  const amount = type === "%" ? (subtotal * val) / 100 : val;
  return (
    <Modal open={open} onClose={onClose} title="Cart discount" sub={`Subtotal ${rs(subtotal)}`} size="m"
      footer={<><Button size="l" onClick={onClose}>Cancel</Button><Button size="l" variant="primary" disabled={!val || (type === "%" && val > 100)} onClick={() => onApply(type, val)}>Apply discount</Button></>}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Segmented size="l" value={type} onChange={(x) => { setType(x); setV(""); }} options={[{ v: "%", label: "Percentage %" }, { v: "Rs", label: "Fixed Rs." }]} />
          <div className="mt-4 flex h-16 items-center justify-end rounded-card border-2 border-orange-500 px-4 font-heading text-[32px] font-semibold tnum">
            {type === "Rs" && <span className="mr-auto text-base text-fg2">Rs.</span>}{v || <span className="text-muted">0</span>}{type === "%" && <span className="ml-1 text-fg2">%</span>}
          </div>
          <p className="mt-2 text-sm text-fg2">Customer saves <b className="text-fg tnum">{rs(Math.min(amount, subtotal))}</b></p>
          {over && <div className="mt-4 flex items-start gap-2 rounded-card bg-warning/15 p-3 text-sm text-[#7A5A00] dark:text-warning"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><span><b>May need manager approval</b> at payment. Cashiers can give up to 10%.</span></div>}
        </div>
        <Keypad size="m" extra="." onKey={(k) => setV((c) => (k === "⌫" ? c.slice(0, -1) : (c + k).slice(0, 7)))} />
      </div>
    </Modal>
  );
}

/* ─────────── Manager override ─────────── */
type Approver = { id: string; name: string; color: string; role: string };
export function OverrideModal({ open, onClose, onSubmit, action = "Discount above 10%", perm = "sales.discount_any" }: { open: boolean; onClose: () => void; onSubmit: (approval: { userId: string; pin: string }) => Promise<boolean>; action?: string; perm?: string }) {
  const [list, setList] = useState<Approver[] | null>(null);
  const [who, setWho] = useState<Approver | null>(null);
  useEffect(() => {
    if (!open) return;
    setWho(null); setList(null);
    api<Approver[]>(`/auth/approvers?perm=${perm}`).then((r) => { setList(r); if (r.length === 1) setWho(r[0]); }).catch(() => setList([]));
  }, [open, perm]);
  const submit = useCallback((pin: string) => (who ? onSubmit({ userId: who.id, pin }) : Promise.resolve(false)), [who, onSubmit]);
  return (
    <Modal open={open} onClose={onClose} size="s" hideClose>
      <div className="flex flex-col items-center pt-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-navy-900"><ShieldCheck size={28} /></span>
        <h2 className="mt-3 font-heading text-lg font-semibold">Manager approval</h2>
        <p className="text-sm text-fg2">{action}</p>
        {who ? (
          <>
            <button onClick={() => setWho(null)} className="my-5 flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3"><Avatar name={who.name} size={32} color={who.color} /><span className="text-sm font-semibold">{who.name}</span><span className="text-cap text-fg2">· {who.role}</span></button>
            <PinPad onSubmit={submit} />
          </>
        ) : (
          <div className="my-5 w-full space-y-2">
            {!list && <p className="text-sm text-fg2">Loading…</p>}
            {list && !list.length && <p className="text-sm text-fg2">No manager with a PIN is available at this branch.</p>}
            {list?.map((a) => <button key={a.id} onClick={() => setWho(a)} className="flex h-14 w-full items-center gap-3 rounded-ctl border border-line px-3 text-left hover:bg-tint"><Avatar name={a.name} size={36} color={a.color} /><span className="font-semibold">{a.name}</span><span className="ml-auto text-cap text-fg2">{a.role}</span></button>)}
          </div>
        )}
        <button onClick={onClose} className="mt-4 h-11 text-sm font-semibold text-fg2 hover:text-fg">Cancel</button>
      </div>
    </Modal>
  );
}

/* ─────────── Coupon ─────────── */
export function CouponModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (code: string) => Promise<string | null> }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setCode(""); setErr(""); } }, [open]);
  const apply = async () => { setBusy(true); setErr((await onApply(code.trim())) ?? ""); setBusy(false); };
  return (
    <Modal open={open} onClose={onClose} title="Apply coupon" size="s"
      footer={<><Button size="l" onClick={onClose}>Cancel</Button><Button size="l" variant="primary" disabled={!code.trim()} loading={busy} onClick={() => void apply()}>Apply to sale</Button></>}>
      <Field label="Coupon code" error={err || undefined}><AddonInput autoFocus prefix={<Ticket size={16} />} value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }} className="h-12 font-mono" /></Field>
    </Modal>
  );
}

/* ─────────── Customer search / quick create ─────────── */
export function CustomerModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: Customer | null) => void }) {
  const [tab, setTab] = useState<"find" | "new">("find");
  const [q, setQ] = useState("");
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", nic: "" });
  useEffect(() => { if (open) { setTab("find"); setQ(""); setErr(""); setForm({ name: "", phone: "", email: "", nic: "" }); } }, [open]);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    const h = setTimeout(() => {
      apiPage<ApiCustomer>(`/customers?limit=30&q=${encodeURIComponent(q.trim())}`).then(({ rows }) => { if (live) setList(rows.map(toCustomer)); }).catch((e) => { if (live) setErr(errText(e)); }).finally(() => { if (live) setLoading(false); });
    }, 200);
    return () => { live = false; clearTimeout(h); };
  }, [open, q]);
  const create = async () => {
    const digits = form.phone.replace(/\D/g, "").replace(/^0/, "");
    if (!form.name.trim()) return setErr("Enter the customer's name");
    if (digits.length !== 9) return setErr("Enter a valid 9-digit mobile number");
    setBusy(true); setErr("");
    try {
      const c = await api<ApiCustomer>("/customers", { body: { name: form.name.trim(), phone: `+94 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`, email: form.email.trim() || undefined, nic: form.nic.trim() || undefined } });
      onPick(toCustomer(c));
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Customer" size="m"
      footer={tab === "new" ? <><Button size="l" onClick={() => setTab("find")}>Back</Button><Button size="l" variant="primary" loading={busy} onClick={() => void create()}>Save & add to sale</Button></> : undefined}>
      <Tabs value={tab} onChange={setTab} tabs={[{ v: "find", label: "Search" }, { v: "new", label: "Quick create" }]} className="mb-4" />
      {err && <p role="alert" className="mb-3 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
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
            {loading && <li className="py-4 text-center text-sm text-fg2">Searching…</li>}
          </ul>
          <Button variant="ghost" icon={UserPlus} className="mt-2" onClick={() => { setForm((x) => ({ ...x, name: /\d/.test(q) ? "" : q, phone: /\d/.test(q) ? q : "" })); setTab("new"); }}>New customer</Button>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12" /></Field>
          <Field label="Mobile" required><AddonInput prefix="+94" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" placeholder="77 123 4567" className="h-12" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" className="h-12" /></Field>
          <Field label="NIC (optional)" hint="Old (9 digits + V) or new 12-digit format" className="sm:col-span-2"><Input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} className="h-12" /></Field>
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
  return (
    <Modal open={!!p} onClose={onClose} size="s" title={p.name} sub={p.brand}
      footer={<Button size="pos" variant="primary" className="w-full" onClick={() => onAdd(p, Object.values(sel).join(" · "), p.price)}>Add · {rs(p.price)}</Button>}>
      <div className="flex items-center gap-3"><ProductThumb p={p} className="h-16 w-16" /><div className="text-sm text-fg2">In stock: <b className="text-fg">{p.stock}</b></div></div>
      {p.variants.map((g) => (
        <fieldset key={g.group} className="mt-5">
          <legend className="label">{g.group}</legend>
          <div className="flex flex-wrap gap-2">
            {g.options.map((o) => (
              <button key={o} onClick={() => setSel({ ...sel, [g.group]: o })} aria-pressed={sel[g.group] === o}
                className={cn("h-12 rounded-ctl border px-4 text-sm font-semibold transition", sel[g.group] === o ? "border-orange-500 bg-orange-100 text-navy-900 ring-2 ring-orange-500/30" : "border-line hover:bg-tint")}>
                {o}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </Modal>
  );
}

/* ─────────── Weight entry ─────────── */
export function WeightModal({ p, onClose, onAdd }: { p: Product | null; onClose: () => void; onAdd: (p: Product, kg: number) => void }) {
  const [manual, setManual] = useState("");
  useEffect(() => { if (p) setManual(""); }, [p]);
  if (!p) return null;
  const kg = parseFloat(manual || "0");
  return (
    <Modal open={!!p} onClose={onClose} size="m" title={p.name} sub={`${rs(p.price)} per ${p.unit}`}
      footer={<Button size="pos" variant="primary" className="w-full" disabled={!(kg > 0)} onClick={() => onAdd(p, Number(kg.toFixed(3)))}>Add {kg.toFixed(3)} {p.unit} · {rs(kg * p.price)}</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><div className="flex h-16 items-center justify-end rounded-card border-2 border-orange-500 px-4 font-heading text-[32px] font-semibold tnum">{manual || <span className="text-muted">0.000</span>}<span className="ml-2 text-base text-fg2">{p.unit}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">{["0.250", "0.500", "1.000"].map((v) => <Button key={v} onClick={() => setManual(v)}>{v}</Button>)}</div></div>
        <Keypad size="m" extra="." onKey={(k) => setManual((c) => (k === "⌫" ? c.slice(0, -1) : k === "." && c.includes(".") ? c : (c + k).slice(0, 7)))} />
      </div>
    </Modal>
  );
}

/* ─────────── Line edit ─────────── */
export function LineEditModal({ line, onClose, onSave }: { line: Line | null; onClose: () => void; onSave: (l: Line) => void }) {
  const [d, setD] = useState<Line | null>(line);
  useEffect(() => setD(line), [line]);
  if (!line || !d) return null;
  return (
    <Modal open={!!line} onClose={onClose} title="Edit line" sub={line.p.name} size="s"
      footer={<><Button size="l" onClick={onClose}>Cancel</Button><Button size="l" variant="primary" onClick={() => onSave(d)}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Unit price"><AddonInput prefix="Rs." value={d.price.toFixed(2)} readOnly className="h-12" /></Field>
        <Field label="Line discount (%)" hint="Above 10% may need manager approval at payment">
          <div className="flex flex-wrap gap-2">{[0, 5, 10, 15].map((v) => <button key={v} onClick={() => setD({ ...d, disc: v })} className={cn("h-12 min-w-[64px] rounded-ctl border px-3 font-semibold", (d.disc ?? 0) === v ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}>{v}%</button>)}</div>
        </Field>
      </div>
    </Modal>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent, ChevronRight, Clock, Grid3x3, LayoutDashboard, List, Lock, LogOut, Menu, PauseCircle, ScanBarcode, StickyNote,
  Ticket, Trash2, User, UserPlus, Wallet, Star, Undo2, ArrowDownUp, Inbox, X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { LangSwitch, SyncPill, ThemeToggle } from "@/components/shell";
import { Avatar, Badge, Button } from "@/components/ui";
import { Confirm, Dropdown, MenuItem, Modal, Toaster } from "@/components/overlays";
import { CartLine, ProductCard, sampleReceipt, type Line, type ReceiptData } from "@/components/pos-kit";
import {
  CouponModal, CustomerModal, DiscountModal, HeldDrawer, LineEditModal, OverrideModal, PaymentModal, ReceiptModal, SaleComplete,
  VariantModal, WeightModal, type Held, type PayMethod,
} from "@/components/pos-modals";
import { categories, customers, products, type Customer, type Product } from "@/lib/data";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";

const seed = (): Line[] => [
  { key: "a", p: products[0], qty: 2, price: 1150 },
  { key: "b", p: products[1], qty: 1, price: 560 },
  { key: "c", p: products[3], qty: 1, price: 1450, disc: 10 },
  { key: "d", p: products[2], qty: 2, price: 420 },
];

type ModalKey = null | "pay" | "done" | "receipt" | "held" | "discount" | "coupon" | "customer" | "override" | "note" | "clear";

export default function POS() {
  const { t, lang, toast, setSync } = useApp();
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cartDisc, setCartDisc] = useState<{ type: "%" | "Rs"; v: number } | null>(null);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [cat, setCat] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<ModalKey>(null);
  const [payInit, setPayInit] = useState<PayMethod>("cash");
  const [variantP, setVariantP] = useState<Product | null>(null);
  const [weightP, setWeightP] = useState<Product | null>(null);
  const [editLine, setEditLine] = useState<Line | null>(null);
  const [lastSale, setLastSale] = useState({ change: 0, total: 0, method: "Cash", points: 0 });
  const [note, setNote] = useState("");
  const [flies, setFlies] = useState<{ id: number; x: number; y: number; fx: number; fy: number }[]>([]);
  const [bump, setBump] = useState(0);
  const [pendingApproval, setPendingApproval] = useState<(() => void) | null>(null);
  const [held, setHeld] = useState<Held[]>([
    { id: "H-0412", customer: "Fathima Rizwan", items: 6, total: 4_280, time: "14:31", note: "Gone to ATM" },
    { id: "H-0411", customer: "Walk-in Customer", items: 2, total: 980, time: "14:05" },
  ]);
  const [shiftStart] = useState(() => Date.now() - (6 * 3600 + 42 * 60) * 1000);
  const [now, setNow] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // Demo states via ?state=… so every modal can be reviewed directly
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("state");
    if (!s) return;
    if (s !== "empty") { setLines(seed()); setCustomer(customers[0]); }
    const map: Record<string, () => void> = {
      "pay-cash": () => { setPayInit("cash"); setModal("pay"); }, "pay-card": () => { setPayInit("card"); setModal("pay"); },
      "pay-qr": () => { setPayInit("qr"); setModal("pay"); }, "pay-split": () => { setPayInit("split"); setModal("pay"); },
      "pay-credit": () => { setPayInit("credit"); setModal("pay"); }, "pay-gift": () => { setPayInit("gift"); setModal("pay"); },
      done: () => { setLastSale({ change: 1_120, total: 4_880, method: "Cash", points: 48 }); setModal("done"); },
      receipt: () => setModal("receipt"), held: () => setModal("held"), discount: () => setModal("discount"), coupon: () => setModal("coupon"),
      customer: () => setModal("customer"), override: () => setModal("override"), variant: () => setVariantP(products[7]), weight: () => setWeightP(products[13]),
      edit: () => setEditLine(seed()[2]), clear: () => setModal("clear"), offline: () => setSync("offline"),
    };
    map[s]?.();
  }, [setSync]);

  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  useEffect(() => { search.current?.focus(); }, []);

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price * (1 - (l.disc ?? 0) / 100), 0);
  const lineSavings = lines.reduce((s, l) => s + l.qty * l.price * ((l.disc ?? 0) / 100), 0);
  const cartOff = cartDisc ? (cartDisc.type === "%" ? (subtotal * cartDisc.v) / 100 : cartDisc.v) : 0;
  const couponOff = coupon ? subtotal * 0.1 : 0;
  const discount = Math.min(subtotal, cartOff + couponOff);
  const total = Math.round((subtotal - discount) * 100) / 100;
  const vat = total - total / 1.18;
  const itemCount = lines.reduce((s, l) => s + (l.p.weighed ? 1 : l.qty), 0);

  const filtered = useMemo(() => {
    const list = cat === "fav" ? products.filter((p) => p.fav) : cat === "all" ? products : products.filter((p) => p.cat === cat);
    const s = q.trim().toLowerCase();
    return s ? list.filter((p) => p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.sku.toLowerCase().includes(s) || (p.si ?? "").includes(s)) : list;
  }, [cat, q]);

  const fly = (el: HTMLElement) => {
    const a = el.getBoundingClientRect(); const b = cartRef.current?.getBoundingClientRect();
    if (!b) return;
    const id = Date.now();
    const x = a.left + a.width / 2, y = a.top + a.height / 3;
    setFlies((f) => [...f, { id, x, y, fx: b.left + 60 - x, fy: b.top + 120 - y }]);
    setTimeout(() => setFlies((f) => f.filter((z) => z.id !== id)), 650);
  };

  const addLine = useCallback((p: Product, opts: { qty?: number; variant?: string; price?: number } = {}) => {
    setLines((ls) => {
      const key = p.id + (opts.variant ?? "");
      const ex = ls.find((l) => l.key === key && !p.weighed);
      if (ex) return ls.map((l) => (l.key === key ? { ...l, qty: l.qty + (opts.qty ?? 1) } : l));
      return [...ls, { key: p.weighed ? key + Date.now() : key, p, qty: opts.qty ?? 1, price: opts.price ?? p.price, variant: opts.variant }];
    });
    setBump((b) => b + 1);
  }, []);

  const onProduct = (p: Product, el?: HTMLElement) => {
    if (p.variants) return setVariantP(p);
    if (p.weighed) return setWeightP(p);
    if (el) fly(el);
    addLine(p);
  };

  const openPay = useCallback(() => { if (lines.length) { setPayInit("cash"); setModal("pay"); } }, [lines.length]);
  const hold = useCallback(() => {
    if (!lines.length) return;
    setHeld((h) => [{ id: `H-0${413 + h.length}`, customer: customer?.name ?? "Walk-in Customer", items: itemCount, total, time: new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" }), note }, ...h]);
    setLines([]); setCustomer(null); setCartDisc(null); setCoupon(null); setNote("");
    toast({ tone: "info", title: "Sale held", body: "Resume it any time from Held orders" });
  }, [lines.length, customer, itemCount, total, note, toast]);

  // Keyboard shortcuts: F1 search, F2 customer, F4 hold, F8 discount, F12 pay, Esc cancel
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "F1") { e.preventDefault(); search.current?.focus(); }
      else if (k === "F2") { e.preventDefault(); setModal("customer"); }
      else if (k === "F4") { e.preventDefault(); hold(); }
      else if (k === "F8") { e.preventDefault(); if (lines.length) setModal("discount"); }
      else if (k === "F12") { e.preventDefault(); openPay(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [hold, openPay, lines.length]);

  const newSale = () => { setLines([]); setCustomer(null); setCartDisc(null); setCoupon(null); setNote(""); setModal(null); search.current?.focus(); };
  const receiptData: ReceiptData = lines.length
    ? { ...sampleReceipt, customer: customer?.name, lines: lines.map((l) => ({ name: l.p.name + (l.variant ? ` (${l.variant})` : "") + (l.p.weighed ? ` ${l.qty.toFixed(3)}kg` : ""), qty: l.p.weighed ? 1 : l.qty, price: l.p.weighed ? l.qty * l.price : l.price, disc: l.disc })), discount, method: lastSale.method, tendered: lastSale.total ? lastSale.total + lastSale.change : Math.ceil(total / 1000) * 1000, points: lastSale.points || (customer ? Math.floor(total / 100) : 0) }
    : sampleReceipt;
  const elapsed = now ? Math.floor((now - shiftStart) / 60000) : 402;
  const si = lang !== "en";

  return (
    <div className={cn("flex h-screen flex-col overflow-hidden bg-bg", si && "pos-local")}>
      {/* ── Minimal top strip ── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <Link href="/dashboard" aria-label="Back to dashboard"><Logo className="w-[104px]" /></Link>
        <span className="hidden h-6 w-px bg-line md:block" />
        <span className="hidden text-cap text-fg2 md:block">Colombo 03 · T1</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 sm:flex">
            <Avatar name="Kasun Jayasuriya" size={28} color="#FF7A00" />
            <span className="text-cap"><span className="font-semibold text-fg">Kasun J.</span> <span className="text-fg2">· {t("p.cashier")}</span></span>
          </div>
          <span className="hidden items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-cap font-semibold tnum text-fg lg:inline-flex" title="Shift timer"><Clock size={14} className="text-fg2" />{t("p.shift")} {Math.floor(elapsed / 60)}h {String(elapsed % 60).padStart(2, "0")}m</span>
          <SyncPill compact />
          <button onClick={() => setModal("held")} className="relative inline-flex h-10 items-center gap-1.5 rounded-ctl px-3 text-sm font-semibold text-fg hover:bg-tint" aria-label={`Held orders (${held.length})`}>
            <Inbox size={18} /><span className="hidden lg:inline">{t("p.held")}</span>
            {held.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-navy-900">{held.length}</span>}
          </button>
          <span className="hidden xl:block"><LangSwitch /></span>
          <ThemeToggle />
          <Dropdown align="right" width="w-64" trigger={() => <button className="icon-btn h-10 w-10 border border-line" aria-label="Menu"><Menu size={20} /></button>}>
            {(close) => (
              <>
                <div className="p-2 xl:hidden"><LangSwitch /></div>
                <MenuItem icon={LayoutDashboard} onClick={() => router.push("/dashboard")}>Back office</MenuItem>
                <MenuItem icon={Undo2} onClick={() => router.push("/returns/new")}>Process a return</MenuItem>
                <MenuItem icon={ArrowDownUp} onClick={() => { close(); toast({ tone: "info", title: "Cash in / out", body: "Opens from Cash Register" }); router.push("/register"); }}>Cash in / out</MenuItem>
                <MenuItem icon={Wallet} onClick={() => { close(); toast({ tone: "success", title: "Cash drawer opened" }); }}>Open cash drawer</MenuItem>
                <MenuItem icon={Lock} onClick={() => router.push("/lock")}>Lock terminal</MenuItem>
                <MenuItem icon={LogOut} danger onClick={() => router.push("/register/close")}>Close shift</MenuItem>
              </>
            )}
          </Dropdown>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── Product selection (≈62%) ── */}
        <section className="flex min-w-0 flex-[62] flex-col">
          <div className="flex items-center gap-2 px-4 pt-4">
            <div className="field-wrap h-14 flex-1 rounded-card bg-surface shadow-soft">
              <ScanBarcode size={22} className="ml-4 text-orange-500" />
              <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("p.search")} aria-label={t("p.search")} className="text-base"
                onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) { onProduct(filtered[0]); setQ(""); } }} />
              {q && <button onClick={() => setQ("")} className="mr-2 grid h-10 w-10 place-items-center rounded-lg text-fg2 hover:bg-tint" aria-label="Clear search"><X size={18} /></button>}
              <span className="kbd mr-4 hidden text-fg2 md:inline-flex">F1</span>
            </div>
            <div className="flex rounded-card border border-line bg-surface p-1" role="group" aria-label="View">
              <button onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={cn("grid h-12 w-12 place-items-center rounded-ctl", view === "grid" ? "bg-navy-900 text-white dark:bg-orange-500 dark:text-navy-900" : "text-fg2 hover:bg-tint")}><Grid3x3 size={20} /></button>
              <button onClick={() => setView("list")} aria-pressed={view === "list"} aria-label="List view" className={cn("grid h-12 w-12 place-items-center rounded-ctl", view === "list" ? "bg-navy-900 text-white dark:bg-orange-500 dark:text-navy-900" : "text-fg2 hover:bg-tint")}><List size={20} /></button>
            </div>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3" role="tablist" aria-label="Categories">
            {[{ id: "fav", label: t("p.fav"), icon: true }, { id: "all", label: t("p.all") }, ...categories.map((c) => ({ id: c.id, label: c.name[lang === "si" ? 1 : lang === "ta" ? 2 : 0] }))].map((c) => (
              <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
                className={cn("inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border px-5 text-sm font-semibold transition",
                  cat === c.id ? "border-orange-500 bg-orange-500 text-navy-900" : "border-line bg-surface text-fg hover:border-orange-500/50")}>
                {"icon" in c && <Star size={15} className={cat === c.id ? "fill-navy-900" : "fill-amber-400 text-amber-400"} />}{c.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {filtered.length ? (
              <div className={cn(view === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3" : "grid gap-2 xl:grid-cols-2")}>
                {filtered.map((p) => <ProductCard key={p.id} p={p} lang={lang} view={view} onAdd={(pp, el) => onProduct(pp, el)} />)}
              </div>
            ) : (
              <div className="py-20 text-center text-fg2"><ScanBarcode size={40} className="mx-auto mb-3" /><p className="font-semibold text-fg">No product matches “{q}”</p><p className="text-sm">Check the barcode or try another name.</p></div>
            )}
          </div>
        </section>

        {/* ── Cart panel (≈38%) ── */}
        <aside ref={cartRef} className="flex min-w-[340px] flex-[38] flex-col border-l border-line bg-surface">
          <button onClick={() => setModal("customer")} className="m-3 mb-0 flex min-h-[60px] shrink-0 items-center gap-3 rounded-card border border-line px-3 py-2 text-left transition hover:border-orange-500/50 hover:bg-tint/40">
            {customer ? (
              <>
                <Avatar name={customer.name} size={40} color="#1A3170" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="truncate font-semibold">{customer.name}</span><Badge tone="amber" className="h-5 text-[11px]">{customer.tier}</Badge></span>
                  <span className="block text-cap text-fg2 tnum">{customer.phone} · <b className="text-fg">{customer.points.toLocaleString()} {t("p.points")}</b>{customer.credit > 0 && <> · {t("p.credit")} {rs(customer.credit, { decimals: false })}</>}</span>
                </span>
                <span role="button" tabIndex={0} aria-label="Remove customer" onClick={(e) => { e.stopPropagation(); setCustomer(null); }} className="grid h-10 w-10 place-items-center rounded-lg text-fg2 hover:bg-surface-2"><X size={18} /></span>
              </>
            ) : (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-fg2"><User size={20} /></span>
                <span className="flex-1"><span className="block font-semibold">{t("p.walkin")}</span><span className="text-cap text-fg2">Tap to search or add a customer</span></span>
                <span className="kbd text-fg2">F2</span><UserPlus size={20} className="text-fg2" />
              </>
            )}
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
            {lines.length ? (
              <div className="divide-y divide-line">
                {lines.map((l) => (
                  <CartLine key={l.key} l={l} lang={lang} state={editLine?.key === l.key ? "editing" : "default"}
                    onQty={(q2) => setLines((ls) => (q2 <= 0 ? ls.filter((x) => x.key !== l.key) : ls.map((x) => (x.key === l.key ? { ...x, qty: q2 } : x))))}
                    onRemove={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                    onEdit={() => setEditLine(l)} />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="relative mb-5 grid h-32 w-32 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-tint" />
                  <span className="absolute inset-4 rounded-full border-2 border-dashed border-sky-300" />
                  <ScanBarcode size={44} className="relative text-fg" strokeWidth={1.5} />
                  <span className="absolute right-2 top-4 h-3 w-3 rounded-full bg-orange-500" />
                  <span className="absolute bottom-5 left-1 h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <p className={cn("max-w-[260px] font-heading text-base font-semibold", si && "leading-7")}>{t("p.empty")}</p>
                <p className="mt-1 text-cap text-fg2">Barcode scanner ready · or press F1 to search</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="shrink-0 border-t border-line px-4 pt-3">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-fg2">{t("p.subtotal")}</dt><dd className="font-semibold tnum">{rs(subtotal + lineSavings)}</dd></div>
              {(discount > 0 || lineSavings > 0) && (
                <div className="flex justify-between"><dt className="flex items-center gap-1.5 text-fg2">{t("p.discount")}{coupon && <Badge tone="orange" className="h-5 text-[11px]">{coupon}</Badge>}{cartDisc && <Badge tone="orange" className="h-5 text-[11px]">{cartDisc.type === "%" ? `${cartDisc.v}%` : "Fixed"}</Badge>}</dt><dd className="font-semibold text-orange-600 tnum dark:text-orange-500">− {rs(discount + lineSavings)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-fg2">{t("p.tax")}</dt><dd className="tnum text-fg2">{rs(vat)}</dd></div>
              <div className="flex justify-between"><dt className="text-fg2">{t("p.items")}</dt><dd className="tnum text-fg2">{itemCount}</dd></div>
            </dl>
            <div className="mt-2 flex items-end justify-between border-t border-dashed border-line pt-2">
              <span className="pb-1.5 text-sm font-semibold text-fg2">{t("p.total")}</span>
              <span key={bump} className="font-heading text-total font-bold tnum text-fg">{rs(total)}</span>
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-5 gap-2 px-4 py-3">
            {[
              { l: t("p.hold"), i: PauseCircle, k: "F4", on: hold },
              { l: t("p.discount"), i: BadgePercent, k: "F8", on: () => setModal("discount"), dot: !!cartDisc },
              { l: t("p.coupon"), i: Ticket, k: "", on: () => setModal("coupon"), dot: !!coupon },
              { l: t("p.note"), i: StickyNote, k: "", on: () => setModal("note"), dot: !!note },
              { l: t("p.clear"), i: Trash2, k: "", on: () => setModal("clear"), danger: true },
            ].map((a) => (
              <button key={a.l} onClick={a.on} disabled={!lines.length} title={a.k ? `${a.l} (${a.k})` : a.l}
                className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-ctl border text-[12px] font-semibold transition disabled:opacity-40",
                  a.danger ? "border-danger/30 text-danger hover:bg-danger/10 dark:border-red-400/40" : "border-line text-fg hover:bg-tint")}>
                <a.i size={19} /><span className="max-w-full truncate px-1">{a.l}</span>
                {a.k && <span className="absolute right-1 top-0.5 text-[10px] font-bold text-fg2/70">{a.k}</span>}
                {a.dot && <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />}
              </button>
            ))}
          </div>
          <div className="shrink-0 px-4 pb-4 safe-area">
            <Button variant="primary" size="pos" className="w-full text-[20px]" disabled={!lines.length} onClick={openPay} kbd="F12">
              {t("p.charge")} {rs(total)}
            </Button>
          </div>
        </aside>
      </div>

      {/* fly-to-cart */}
      {flies.map((f) => (
        <span key={f.id} className="pointer-events-none fixed z-[80] grid h-9 min-w-9 place-items-center rounded-full bg-orange-500 px-2 font-heading text-sm font-bold text-navy-900 shadow-lift animate-fly"
          style={{ left: f.x, top: f.y, ["--fx" as string]: `${f.fx}px`, ["--fy" as string]: `${f.fy}px` }}>+1</span>
      ))}

      <PaymentModal open={modal === "pay"} onClose={() => setModal(null)} total={total} customer={customer} initial={payInit}
        onComplete={(m, tendered) => { setLastSale({ change: Math.max(0, tendered - total), total, method: m, points: customer ? Math.floor(total / 100) : 0 }); setModal("done"); }} />
      <SaleComplete open={modal === "done"} {...lastSale} onNew={newSale} onReceipt={() => setModal("receipt")} />
      <ReceiptModal open={modal === "receipt"} onClose={() => setModal(lastSale.total ? "done" : null)} data={receiptData} />
      <HeldDrawer open={modal === "held"} onClose={() => setModal(null)} held={held}
        onResume={(h) => { setHeld((x) => x.filter((y) => y.id !== h.id)); setLines(seed().slice(0, 2)); setCustomer(customers.find((c) => c.name === h.customer) ?? null); setModal(null); toast({ tone: "success", title: `Resumed ${h.id}` }); }}
        onDelete={(h) => setHeld((x) => x.filter((y) => y.id !== h.id))} />
      <DiscountModal open={modal === "discount"} onClose={() => setModal(null)} subtotal={subtotal || 4880}
        onApply={(type, v) => { setCartDisc({ type, v }); setModal(null); toast({ tone: "success", title: "Discount applied" }); }}
        onNeedApproval={(after) => { setPendingApproval(() => after); setModal("override"); }} />
      <OverrideModal open={modal === "override"} onClose={() => setModal(pendingApproval ? "discount" : null)}
        onApproved={() => { const f = pendingApproval; setPendingApproval(null); setModal(null); if (f) f(); else toast({ tone: "success", title: "Approved by Dilani F." }); }} />
      <CouponModal open={modal === "coupon"} onClose={() => setModal(null)} onApply={(c) => { setCoupon(c); setModal(null); toast({ tone: "success", title: `${c} applied`, body: "10% off this sale" }); }} />
      <CustomerModal open={modal === "customer"} onClose={() => setModal(null)} onPick={(c) => { setCustomer(c); setModal(null); }} />
      <VariantModal p={variantP} onClose={() => setVariantP(null)} onAdd={(p, v, price) => { addLine(p, { variant: v, price }); setVariantP(null); }} />
      <WeightModal p={weightP} onClose={() => setWeightP(null)} onAdd={(p, kg) => { addLine(p, { qty: kg }); setWeightP(null); }} />
      <LineEditModal line={editLine} onClose={() => setEditLine(null)} onLocked={() => setModal("override")}
        onSave={(l) => { setLines((ls) => ls.map((x) => (x.key === l.key ? l : x))); setEditLine(null); }} />
      <Modal open={modal === "note"} onClose={() => setModal(null)} title="Order note" size="s"
        footer={<><Button size="l" onClick={() => setModal(null)}>Cancel</Button><Button size="l" variant="primary" onClick={() => setModal(null)}>Save note</Button></>}>
        <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} className="field min-h-[120px] py-3" placeholder="e.g. Deliver to No. 45, Flower Road after 6 pm" />
      </Modal>
      <Confirm open={modal === "clear"} onClose={() => setModal(null)} onConfirm={newSale} title="Clear this sale?" body={`All ${lines.length} lines (${rs(total)}) will be removed. This can't be undone.`} confirmLabel="Clear sale" />
      <Toaster position="bottom" />
    </div>
  );
}

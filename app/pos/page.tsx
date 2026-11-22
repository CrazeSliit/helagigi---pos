"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent, Clock, Grid3x3, LayoutDashboard, List, Lock, LogOut, Menu, PauseCircle, ScanBarcode, StickyNote,
  Ticket, Trash2, User, UserPlus, Star, ArrowDownUp, Inbox, X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { LangSwitch, SyncPill, ThemeToggle } from "@/components/shell";
import { Avatar, Badge, Button } from "@/components/ui";
import { Confirm, Dropdown, MenuItem, Modal, Toaster } from "@/components/overlays";
import { CartLine, ProductCard, type Line, type ReceiptData } from "@/components/pos-kit";
import {
  CouponModal, CustomerModal, DiscountModal, HeldDrawer, LineEditModal, OverrideModal, PaymentModal, ReceiptModal, SaleComplete,
  VariantModal, WeightModal, type Held, type PayLine, type PayMethod,
} from "@/components/pos-modals";
import type { Customer, Product } from "@/lib/data";
import { api, apiAll, ApiFail, errText, METHOD, newKey, toCustomer, toProduct, type ApiCustomer, type ApiProduct } from "@/lib/api";
import { cn, ddmmyyyy, hhmm, rs } from "@/lib/format";
import { branchOf, useSession } from "@/lib/session";
import { useApp } from "@/lib/store";

type ModalKey = null | "pay" | "done" | "receipt" | "held" | "discount" | "coupon" | "customer" | "override" | "note" | "clear";
type Quote = { list: number; discount: number; tax: number; total: number };
type ApiSale = {
  id: string; number: string; total: number; change: number; paid: number; subtotal: number; discount: number; tax: number; pointsEarned: number; soldAt: string;
  cashier: { name: string }; customer: { name: string } | null; branch: { name: string };
  items: { name: string; variantLabel: string | null; quantity: number; unitPrice: number }[]; payments: { method: string; amount: number }[];
};
type HeldLine = { productId: string; qty: number; disc?: number; variant?: string };
type ApiHeld = { id: string; number: string; total: number; note: string | null; createdAt: string; customerId: string | null; customer: { id: string; name: string } | null; cart: HeldLine[] };
type Cat = { id: string; code: string; name: string; nameSi: string | null; nameTa: string | null };
const timeOf = (iso: string) => hhmm(new Date(iso));

export default function POS() {
  const { t, lang, toast } = useApp();
  const { me } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [shiftOpenedAt, setShiftOpenedAt] = useState<number | null>(null);
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
  const [lastSale, setLastSale] = useState({ change: 0, total: 0, method: "Cash", points: 0, invoice: "" });
  const [doc, setDoc] = useState<ApiSale | null>(null);
  const [note, setNote] = useState("");
  const [flies, setFlies] = useState<{ id: number; x: number; y: number; fx: number; fy: number }[]>([]);
  const [bump, setBump] = useState(0);
  const [held, setHeld] = useState<(Held & { raw: ApiHeld })[]>([]);
  const [quote, setQuote] = useState<{ key: string; q: Quote } | null>(null);
  const [quoteErr, setQuoteErr] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [pendingPay, setPendingPay] = useState<{ lines: PayLine[]; label: string } | null>(null);
  const [now, setNow] = useState(0);
  const saleKey = useRef(newKey());
  const search = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async () => { setProducts((await apiAll<ApiProduct>("/products")).map(toProduct)); }, []);
  const loadHeld = useCallback(async () => {
    const rows = await api<ApiHeld[]>("/sales/held");
    setHeld(rows.map((h) => ({ id: h.number, customer: h.customer?.name ?? "Walk-in Customer", items: h.cart.length, total: h.total, time: timeOf(h.createdAt), note: h.note ?? undefined, raw: h })));
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const shift = await api<{ shift: { openedAt: string } } | null>("/shifts/current");
        if (!shift) return router.replace("/register/open");
        setShiftOpenedAt(new Date(shift.shift.openedAt).getTime());
        const [, cats] = await Promise.all([loadProducts(), apiAll<Cat>("/categories"), loadHeld()]);
        setCategories(cats);
      } catch (e) { setLoadErr(errText(e)); } finally { setLoading(false); }
    })();
  }, [loadProducts, loadHeld, router]);

  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  useEffect(() => { search.current?.focus(); }, []);

  const items = useMemo(() => lines.map((l) => ({ productId: l.p.id, quantity: l.qty, ...(l.variant ? { variantLabel: l.variant } : {}), ...(l.disc ? { discountPct: l.disc } : {}) })), [lines]);
  const cartDiscount = cartDisc ? { type: cartDisc.type === "%" ? "PERCENT" : "FIXED", value: cartDisc.v } : undefined;
  const cartKey = JSON.stringify({ items, cartDiscount, coupon });
  const quoteFresh = quote?.key === cartKey;

  // The server prices every cart, so what the cashier sees is what will be charged.
  useEffect(() => {
    saleKey.current = newKey();
    setQuoteErr("");
    if (!items.length) { setQuote(null); return; }
    let live = true;
    const h = setTimeout(() => {
      api<Quote>("/sales/quote", { body: { items, couponCode: coupon ?? undefined, cartDiscount } })
        .then((r) => { if (live) setQuote({ key: cartKey, q: r }); })
        .catch((e) => {
          if (!live) return;
          if (coupon && e instanceof ApiFail && e.status === 409) { setCoupon(null); toast({ tone: "warning", title: "Coupon removed", body: e.message }); }
          else setQuoteErr(errText(e));
        });
    }, 180);
    return () => { live = false; clearTimeout(h); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  const localList = lines.reduce((acc, l) => acc + l.qty * l.price, 0);
  const shown = quote?.q;
  const subtotal = shown?.list ?? localList;
  const discountTotal = shown?.discount ?? 0;
  const total = shown?.total ?? localList;
  const vat = shown?.tax ?? 0;
  const itemCount = lines.reduce((acc, l) => acc + (l.p.weighed ? 1 : l.qty), 0);

  const filtered = useMemo(() => {
    const list = cat === "fav" ? products.filter((p) => p.fav) : cat === "all" ? products : products.filter((p) => p.cat === cat);
    const s = q.trim().toLowerCase();
    return s ? list.filter((p) => p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.sku.toLowerCase().includes(s) || (p.si ?? "").includes(s)) : list;
  }, [cat, q, products]);

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

  const clearCart = useCallback(() => { setLines([]); setCustomer(null); setCartDisc(null); setCoupon(null); setNote(""); }, []);
  const openPay = useCallback(() => { if (lines.length && quoteFresh) { setPayErr(""); setPayInit("cash"); setModal("pay"); } }, [lines.length, quoteFresh]);
  const hold = useCallback(async () => {
    if (!lines.length) return;
    try {
      await api("/sales/held", { body: { customerId: customer?.id, note: note || undefined, total, cart: lines.map((l) => ({ productId: l.p.id, qty: l.qty, disc: l.disc, variant: l.variant })) } });
      clearCart(); await loadHeld();
      toast({ tone: "info", title: "Sale held", body: "Resume it any time from Held orders" });
    } catch (e) { toast({ tone: "error", title: "Couldn't hold this sale", body: errText(e) }); }
  }, [lines, customer, total, note, toast, clearCart, loadHeld]);

  // Keyboard shortcuts: F1 search, F2 customer, F4 hold, F8 discount, F12 pay
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "F1") { e.preventDefault(); search.current?.focus(); }
      else if (k === "F2") { e.preventDefault(); setModal("customer"); }
      else if (k === "F4") { e.preventDefault(); void hold(); }
      else if (k === "F8") { e.preventDefault(); if (lines.length) setModal("discount"); }
      else if (k === "F12") { e.preventDefault(); openPay(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [hold, openPay, lines.length]);

  const newSale = () => { clearCart(); setDoc(null); setLastSale({ change: 0, total: 0, method: "Cash", points: 0, invoice: "" }); setModal(null); search.current?.focus(); };

  const submitSale = useCallback(async (pay: { lines: PayLine[]; label: string }, approval?: { userId: string; pin: string }) => {
    setPayBusy(true); setPayErr("");
    try {
      const sale = await api<ApiSale>("/sales", { body: { clientId: saleKey.current, customerId: customer?.id, couponCode: coupon ?? undefined, note: note || undefined, cartDiscount, items, payments: pay.lines, approval } });
      setDoc(sale); setPendingPay(null);
      setLastSale({ change: sale.change, total: sale.total, method: pay.label, points: sale.pointsEarned, invoice: sale.number });
      setModal("done");
      void loadProducts().catch(() => undefined);
      return true;
    } catch (e) {
      if (e instanceof ApiFail && e.status === 403 && /approval/i.test(e.message)) {
        if (approval) return false;
        setPendingPay(pay); setModal("override");
        return false;
      }
      setPendingPay(null); setPayErr(errText(e)); setModal("pay");
      return false;
    } finally { setPayBusy(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, coupon, note, cartKey, loadProducts]);
  const approve = useCallback((approval: { userId: string; pin: string }) => (pendingPay ? submitSale(pendingPay, approval) : Promise.resolve(false)), [pendingPay, submitSale]);

  const resumeHeld = async (h: Held & { raw: ApiHeld }) => {
    if (lines.length) return toast({ tone: "warning", title: "Finish or clear the current sale first" });
    const restored: Line[] = [];
    for (const c of h.raw.cart) {
      const p = products.find((x) => x.id === c.productId);
      if (p) restored.push({ key: p.weighed ? p.id + newKey() : p.id + (c.variant ?? ""), p, qty: c.qty, price: p.price, disc: c.disc, variant: c.variant });
    }
    try {
      const cust = h.raw.customerId ? toCustomer(await api<ApiCustomer>(`/customers/${h.raw.customerId}`)) : null;
      await api(`/sales/held/${h.raw.id}`, { method: "DELETE" });
      setLines(restored); setCustomer(cust); setNote(h.raw.note ?? ""); setModal(null); await loadHeld();
      toast(restored.length === h.raw.cart.length ? { tone: "success", title: `Resumed ${h.id}` } : { tone: "warning", title: `Resumed ${h.id}`, body: "Some products are no longer available" });
    } catch (e) { toast({ tone: "error", title: "Couldn't resume", body: errText(e) }); }
  };
  const deleteHeld = async (h: Held & { raw: ApiHeld }) => {
    try { await api(`/sales/held/${h.raw.id}`, { method: "DELETE" }); await loadHeld(); }
    catch (e) { toast({ tone: "error", title: "Couldn't delete", body: errText(e) }); }
  };
  const applyCoupon = async (code: string) => {
    try {
      await api("/sales/quote", { body: { items, couponCode: code, cartDiscount } });
      setCoupon(code); setModal(null); toast({ tone: "success", title: `${code} applied` });
      return null;
    } catch (e) { return errText(e); }
  };
  const lockTerminal = async () => {
    try { await api("/auth/lock", { body: {} }); window.location.assign("/lock"); }
    catch (e) { toast({ tone: "error", title: "Couldn't lock", body: errText(e) }); }
  };

  const branch = branchOf(me);
  const receiptData: ReceiptData | null = doc ? {
    invoice: doc.number, date: ddmmyyyy(new Date(doc.soldAt)), time: hhmm(new Date(doc.soldAt)), cashier: doc.cashier.name, customer: doc.customer?.name, branch: doc.branch.name, address: branch?.address, phone: branch?.phone,
    lines: doc.items.map((i) => ({ name: i.name + (i.variantLabel ? ` (${i.variantLabel})` : ""), qty: i.quantity, price: i.unitPrice })),
    discount: doc.discount, subtotal: doc.subtotal, total: doc.total, tax: doc.tax, change: doc.change, method: doc.payments.map((p) => METHOD[p.method] ?? p.method).join(" + "), tendered: doc.paid, points: doc.pointsEarned,
  } : null;
  const elapsed = now && shiftOpenedAt ? Math.max(0, Math.floor((now - shiftOpenedAt) / 60000)) : 0;
  const si = lang !== "en";

  return (
    <div className={cn("flex h-screen flex-col overflow-hidden bg-bg", si && "pos-local")}>
      {/* ── Minimal top strip ── */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <Link href="/orders" aria-label="Back office"><Logo className="w-[104px]" /></Link>
        <span className="hidden h-6 w-px bg-line md:block" />
        <span className="hidden text-cap text-fg2 md:block">{branch?.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 sm:flex">
            <Avatar name={me.name} size={28} color={me.color} />
            <span className="text-cap"><span className="font-semibold text-fg">{me.name}</span> <span className="text-fg2">· {me.role}</span></span>
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
                <MenuItem icon={LayoutDashboard} onClick={() => router.push("/orders")}>Back office</MenuItem>
                <MenuItem icon={ArrowDownUp} onClick={() => { close(); router.push("/register"); }}>Cash in / out</MenuItem>
                <MenuItem icon={Lock} onClick={() => { close(); void lockTerminal(); }}>Lock terminal</MenuItem>
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
            {[{ id: "fav", label: t("p.fav"), icon: true }, { id: "all", label: t("p.all") }, ...categories.map((c) => ({ id: c.code, label: (lang === "si" ? c.nameSi : lang === "ta" ? c.nameTa : c.name) ?? c.name }))].map((c) => (
              <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
                className={cn("inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border px-5 text-sm font-semibold transition",
                  cat === c.id ? "border-orange-500 bg-orange-500 text-navy-900" : "border-line bg-surface text-fg hover:border-orange-500/50")}>
                {"icon" in c && <Star size={15} className={cat === c.id ? "fill-navy-900" : "fill-amber-400 text-amber-400"} />}{c.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {loadErr ? <p role="alert" className="py-20 text-center font-semibold text-danger">{loadErr}</p> : loading ? <p className="py-20 text-center text-sm text-fg2" role="status">Loading products…</p> : filtered.length ? (
              <div className={cn(view === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3" : "grid gap-2 xl:grid-cols-2")}>
                {filtered.map((p) => <ProductCard key={p.id} p={p} lang={lang} view={view} onAdd={(pp, el) => onProduct(pp, el)} />)}
              </div>
            ) : (
              <div className="py-20 text-center text-fg2"><ScanBarcode size={40} className="mx-auto mb-3" /><p className="font-semibold text-fg">{q ? `No product matches “${q}”` : "No products here"}</p><p className="text-sm">Check the barcode or try another name.</p></div>
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
              <div className="flex justify-between"><dt className="text-fg2">{t("p.subtotal")}</dt><dd className="font-semibold tnum">{rs(subtotal)}</dd></div>
              {discountTotal > 0 && (
                <div className="flex justify-between"><dt className="flex items-center gap-1.5 text-fg2">{t("p.discount")}{coupon && <Badge tone="orange" className="h-5 text-[11px]">{coupon}</Badge>}{cartDisc && <Badge tone="orange" className="h-5 text-[11px]">{cartDisc.type === "%" ? `${cartDisc.v}%` : "Fixed"}</Badge>}</dt><dd className="font-semibold text-orange-600 tnum dark:text-orange-500">− {rs(discountTotal)}</dd></div>
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
              { l: t("p.hold"), i: PauseCircle, k: "F4", on: () => void hold() },
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
            {quoteErr && <p role="alert" className="mb-2 text-sm font-medium text-danger">{quoteErr}</p>}
            <Button variant="primary" size="pos" className="w-full text-[20px]" disabled={!lines.length || !quoteFresh} onClick={openPay} kbd="F12">
              {lines.length && !quoteFresh ? "Calculating…" : `${t("p.charge")} ${rs(total)}`}
            </Button>
          </div>
        </aside>
      </div>

      {/* fly-to-cart */}
      {flies.map((f) => (
        <span key={f.id} className="pointer-events-none fixed z-[80] grid h-9 min-w-9 place-items-center rounded-full bg-orange-500 px-2 font-heading text-sm font-bold text-navy-900 shadow-lift animate-fly"
          style={{ left: f.x, top: f.y, ["--fx" as string]: `${f.fx}px`, ["--fy" as string]: `${f.fy}px` }}>+1</span>
      ))}

      <PaymentModal open={modal === "pay"} onClose={() => setModal(null)} total={total} customer={customer} initial={payInit} busy={payBusy} error={payErr} onComplete={(l, label) => void submitSale({ lines: l, label })} />
      <SaleComplete open={modal === "done"} {...lastSale} onNew={newSale} onReceipt={() => setModal("receipt")} />
      <ReceiptModal open={modal === "receipt"} onClose={() => setModal("done")} data={receiptData} />
      <HeldDrawer open={modal === "held"} onClose={() => setModal(null)} held={held}
        onResume={(h) => void resumeHeld(h as Held & { raw: ApiHeld })} onDelete={(h) => void deleteHeld(h as Held & { raw: ApiHeld })} />
      <DiscountModal open={modal === "discount"} onClose={() => setModal(null)} subtotal={subtotal}
        onApply={(type, v) => { setCartDisc({ type, v }); setModal(null); toast({ tone: "success", title: "Discount applied" }); }} />
      <OverrideModal open={modal === "override"} onClose={() => { setPendingPay(null); setModal("pay"); }} onSubmit={approve} />
      <CouponModal open={modal === "coupon"} onClose={() => setModal(null)} onApply={applyCoupon} />
      <CustomerModal open={modal === "customer"} onClose={() => setModal(null)} onPick={(c) => { setCustomer(c); setModal(null); }} />
      <VariantModal p={variantP} onClose={() => setVariantP(null)} onAdd={(p, v, price) => { addLine(p, { variant: v, price }); setVariantP(null); }} />
      <WeightModal p={weightP} onClose={() => setWeightP(null)} onAdd={(p, kg) => { addLine(p, { qty: kg }); setWeightP(null); }} />
      <LineEditModal line={editLine} onClose={() => setEditLine(null)}
        onSave={(l) => { setLines((ls) => ls.map((x) => (x.key === l.key ? l : x))); setEditLine(null); }} />
      <Modal open={modal === "note"} onClose={() => setModal(null)} title="Order note" size="s"
        footer={<><Button size="l" onClick={() => setModal(null)}>Cancel</Button><Button size="l" variant="primary" onClick={() => setModal(null)}>Save note</Button></>}>
        <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} className="field min-h-[120px] py-3" placeholder="e.g. Deliver to No. 45, Flower Road after 6 pm" />
      </Modal>
      <Confirm open={modal === "clear"} onClose={() => setModal(null)} onConfirm={() => { clearCart(); setModal(null); search.current?.focus(); }} title="Clear this sale?" body={`All ${lines.length} lines (${rs(total)}) will be removed. This can't be undone.`} confirmLabel="Clear sale" />
      <Toaster position="bottom" />
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight, Bell, Calendar, Check, ChevronDown, Download, Inbox, LayoutDashboard, Loader2, MoreHorizontal, Package, Plus, Printer, Search, Trash2,
  Upload, ScanBarcode, Settings, User, Clock, Pencil, Copy, Command, X,
} from "lucide-react";
import {
  AddonInput, Avatar, Badge, Banner, Breadcrumbs, Button, Card, Checkbox, EmptyState, Field, IconButton, Input, Pagination, PasswordInput, Progress, QtyStepper,
  Radio, SearchInput, Segmented, Select, Skeleton, Sparkline, StatCard, Status, Steps, Tabs, Textarea, Toggle,
} from "@/components/ui";
import { Confirm, Drawer, Dropdown, MenuItem, Modal, Tooltip } from "@/components/overlays";
import { CartLine, DenominationCounter, Keypad, ProductCard, Receipt, sampleReceipt } from "@/components/pos-kit";
import { Donut, HBars, Heatmap, TrendChart, VBars } from "@/components/charts";
import { DataTable } from "@/components/table";
import { Logo, RakshaMask } from "@/components/brand";
import { daily, orders, paymentMix, products, catSales } from "@/lib/data";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";

const SECTIONS = ["Brand", "Colour", "Typography", "Layout", "Buttons", "Inputs", "Selection", "POS controls", "Product & cart", "Data display", "Charts", "Tables", "Feedback", "Overlays", "Navigation", "Receipts", "POS states"];

function Sec({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 border-b border-line pb-3"><h2 className="font-heading text-xl font-semibold">{title}</h2>{sub && <p className="mt-0.5 text-sm text-fg2">{sub}</p>}</div>
      {children}
    </section>
  );
}
function Spec({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-2", className)}><span className="text-[11px] font-semibold uppercase tracking-wide text-fg2">{label}</span><div className="flex flex-wrap items-center gap-3">{children}</div></div>;
}

const COLORS: [string, string, string, string][] = [
  ["navy-900", "#0B1E4F", "Primary · sidebar, headings, primary text", "#fff"], ["navy-700", "#1A3170", "Hover, active nav", "#fff"], ["navy-50", "#EAF0FB", "Selected rows, highlights", "#0B1E4F"],
  ["orange-500", "#FF7A00", "Accent · main CTA, active indicator", "#0B1E4F"], ["orange-600", "#E56A00", "Orange hover / pressed", "#0B1E4F"], ["orange-100", "#FFF0E0", "Orange tint, promo badges", "#0B1E4F"],
  ["amber-400", "#FFA940", "Loyalty, secondary highlight", "#0B1E4F"], ["sky-300", "#B9DDF7", "Info chips, chart secondary", "#0B1E4F"], ["bg", "#F6F8FB", "App background", "#0B1E4F"],
  ["surface", "#FFFFFF", "Cards, panels, modals", "#0B1E4F"], ["border", "#E3E8F0", "Dividers, input borders", "#0B1E4F"], ["text-secondary", "#4A5875", "Body & secondary text", "#fff"],
  ["text-muted", "#8A96AD", "Placeholders only (3.0:1)", "#0B1E4F"], ["success", "#16A34A", "Paid, in stock", "#fff"], ["warning", "#F2B705", "Low stock, pending", "#0B1E4F"],
  ["danger", "#DC2626", "Void, refund, delete", "#fff"], ["info", "#2563EB", "Informational", "#fff"],
];

export default function DesignSystem() {
  const { toast, setPaletteOpen, theme } = useApp();
  const [modal, setModal] = useState<null | "s" | "m" | "l">(null);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tg, setTg] = useState(true);
  const [ck, setCk] = useState(true);
  const [rd, setRd] = useState("a");
  const [seg, setSeg] = useState<"d" | "w" | "m">("w");
  const [tab, setTab] = useState("a");
  const [q, setQ] = useState(2);
  const [den, setDen] = useState<Record<number, number>>({ 5000: 2, 1000: 5, 100: 12 });
  const [kp, setKp] = useState("2500");
  const [chips, setChips] = useState(["Dairy", "Snacks", "Beverages"]);
  return (
    <div className="grid gap-8 xl:grid-cols-[200px_1fr]">
      <nav className="sticky top-24 hidden h-fit xl:block" aria-label="Sections">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-fg2">Design system</p>
        {SECTIONS.map((s) => <a key={s} href={`#${s.replace(/\W+/g, "-").toLowerCase()}`} className="flex h-9 items-center rounded-ctl px-3 text-sm text-fg2 hover:bg-tint hover:text-fg">{s}</a>)}
      </nav>
      <div className="min-w-0 space-y-14 pb-20">
        <div>
          <Badge tone="orange">v1.0 · {theme === "dark" ? "Dark" : "Light"} theme</Badge>
          <h1 className="mt-3 font-heading text-[32px] font-bold">HeladiGi POS Design System</h1>
          <p className="mt-1 max-w-2xl text-fg2">Tokens, components and states shared by every screen. Toggle dark mode or the language switcher in the top bar to see each component adapt.</p>
        </div>

        <Sec id="brand" title="Brand" sub="Logo used exactly as supplied — never redrawn or recoloured. Cultural motifs only on login, onboarding and empty states.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid h-40 place-items-center rounded-card border border-line bg-white"><Logo className="w-56" /></div>
            <div className="grid h-40 place-items-center rounded-card bg-navy-900"><Logo tile className="w-44" /></div>
            <div className="relative grid h-40 place-items-center overflow-hidden rounded-card bg-navy-900"><RakshaMask className="h-36 opacity-70" /><span className="absolute bottom-2 left-3 text-[11px] text-white/60">Raksha line motif</span></div>
          </div>
          <p className="mt-3 text-sm text-fg2">On navy, the logo always sits on a white rounded tile. Minimum width 96 px; clear space = height of the “D”.</p>
        </Sec>

        <Sec id="colour" title="Colour" sub="Taken from the logo. Orange marks the single most important action per screen; navy is the structure.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {COLORS.map(([n, h, u, t]) => (
              <div key={n} className="overflow-hidden rounded-card border border-line bg-surface">
                <div className="flex h-20 items-end p-3 text-cap font-semibold" style={{ background: h, color: t }}>Aa</div>
                <div className="p-3"><p className="font-mono text-cap font-semibold">{n}</p><p className="font-mono text-[11px] text-fg2">{h}</p><p className="mt-1 text-[11px] leading-4 text-fg2">{u}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card title="Dark mode tokens"><div className="flex gap-3">{[["bg", "#07142F"], ["surface", "#0F2350"], ["border", "#1E3466"], ["accent", "#FF7A00"]].map(([n, h]) => <div key={n} className="flex-1"><div className="h-14 rounded-ctl border border-white/10" style={{ background: h }} /><p className="mt-1 font-mono text-[11px]">{n} {h}</p></div>)}</div></Card>
            <Card title="Contrast (WCAG AA)">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span className="grid h-8 w-24 place-items-center rounded-lg bg-orange-500 font-semibold text-navy-900">Pay</span>Navy on orange · <b>6.2:1</b> <Check size={16} className="text-success" /></li>
                <li className="flex items-center gap-2"><span className="grid h-8 w-24 place-items-center rounded-lg bg-orange-500 font-semibold text-white">Pay</span>White on orange · <b>2.6:1</b> <X size={16} className="text-danger" /> <span className="text-fg2">fails AA even at 16 px bold, so CTAs use navy text</span></li>
                <li className="flex items-center gap-2"><span className="grid h-8 w-24 place-items-center rounded-lg bg-navy-900 font-semibold text-white">Save</span>White on navy · <b>16.1:1</b> <Check size={16} className="text-success" /></li>
              </ul>
            </Card>
          </div>
        </Sec>

        <Sec id="typography" title="Typography" sub="Poppins for headings, Inter for UI, Noto Sans Sinhala / Tamil for local scripts. Tabular numerals on every number.">
          <Card>
            <div className="space-y-4">
              {[["40 · Grand total", "font-heading text-total font-bold", "Rs. 4,850.00"], ["32 · Page hero", "font-heading text-2xl font-bold", "Good morning, Craze"], ["24 · Page title", "font-heading text-xl font-semibold", "Purchase orders"], ["20 · Section", "font-heading text-lg font-semibold", "Low stock alerts"], ["16 · Body large", "text-base", "Scan or tap a product to start a sale"], ["14 · Body / UI", "text-sm", "Anchor Milk Powder 400g · 84 in stock"], ["12 · Caption", "text-cap text-fg2", "Last synced 14:58 · Asia/Colombo"]].map(([l, c, s]) => (
                <div key={l} className="grid items-baseline gap-2 border-b border-line pb-3 last:border-0 sm:grid-cols-[180px_1fr]"><span className="font-mono text-cap text-fg2">{l}</span><span className={cn(c, "tnum")}>{s}</span></div>
              ))}
              <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><span className="font-mono text-cap text-fg2">Sinhala · Tamil</span><span className="text-base">විකිණීම සම්පූර්ණ කරන්න · விற்பனையை முடி</span></div>
              <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><span className="font-mono text-cap text-fg2">Tabular numerals</span><span className="font-semibold tnum">Rs. 1,111.11<br />Rs. 8,888.88</span></div>
            </div>
          </Card>
        </Sec>

        <Sec id="layout" title="Layout" sub="8 px grid · radius 12 cards / 10 controls / 20 modals · soft shadows · 48 px minimum touch target on POS screens.">
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Spacing"><div className="flex items-end gap-2">{[4, 8, 12, 16, 24, 32, 48].map((s) => <div key={s} className="text-center"><div className="bg-orange-500" style={{ width: s, height: s }} /><span className="text-[10px] text-fg2">{s}</span></div>)}</div></Card>
            <Card title="Radius"><div className="flex gap-3">{[["10", "rounded-ctl"], ["12", "rounded-card"], ["20", "rounded-modal"]].map(([n, c]) => <div key={n} className="text-center"><div className={cn("h-14 w-14 border-2 border-navy-900 bg-tint dark:border-sky-300", c)} /><span className="text-[11px] text-fg2">{n} px</span></div>)}</div></Card>
            <Card title="Elevation"><div className="flex gap-4"><div className="h-14 w-20 rounded-card bg-surface shadow-soft" /><div className="h-14 w-20 rounded-card bg-surface shadow-lift" /></div><p className="mt-2 text-[11px] text-fg2">soft 0 4 16 / 6% · lift 0 12 32 / 12%</p></Card>
          </div>
        </Sec>

        <Sec id="buttons" title="Buttons" sub="Primary (orange) for the one key action · Secondary (navy) · Outline · Ghost · Danger · Icon · Large POS 64 px.">
          <Card>
            <div className="space-y-6">
              <Spec label="Variants"><Button variant="primary">Save product</Button><Button variant="secondary">Receive stock</Button><Button>Outline</Button><Button variant="ghost">Ghost</Button><Button variant="danger" icon={Trash2}>Delete</Button><Button variant="danger-outline">Void</Button><IconButton icon={Settings} label="Settings" /><IconButton icon={Bell} label="Notifications" badge={3} /></Spec>
              <Spec label="Sizes S / M / L"><Button size="s" variant="primary">Small</Button><Button size="m" variant="primary">Medium</Button><Button size="l" variant="primary">Large</Button></Spec>
              <Spec label="States"><Button variant="primary">Default</Button><Button variant="primary" className="!bg-orange-600">Hover</Button><Button variant="primary" className="scale-[.98] !bg-orange-600">Pressed</Button><Button variant="primary" className="outline outline-2 outline-offset-2 outline-orange-500">Focused</Button><Button variant="primary" disabled>Disabled</Button><Button variant="primary" loading>Loading</Button><Tooltip label="Manager approval required"><Button locked>Locked</Button></Tooltip></Spec>
              <Spec label="With icons & shortcut hints"><Button icon={Plus} variant="secondary">Add product</Button><Button iconRight={ArrowRight}>Continue</Button><Button icon={Download}>Export</Button><Button kbd="F4">Hold</Button></Spec>
              <Spec label="Large POS button · 64 px"><Button variant="primary" size="pos" className="w-full max-w-md text-[20px]" kbd="F12">Charge Rs. 4,850.00</Button></Spec>
            </div>
          </Card>
        </Sec>

        <Sec id="inputs" title="Inputs" sub="44 px default height (48 px on POS). Orange focus ring. Errors always carry an icon and message.">
          <Card>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Text"><Input placeholder="Product name" /></Field>
              <Field label="Search with icon"><SearchInput placeholder="Search…" kbd="Ctrl K" /></Field>
              <Field label="Number"><Input inputMode="numeric" defaultValue="24" /></Field>
              <Field label="Phone"><AddonInput prefix="+94" defaultValue="77 123 4567" /></Field>
              <Field label="Currency"><AddonInput prefix="Rs." defaultValue="12,450.00" /></Field>
              <Field label="Password"><PasswordInput defaultValue="heladigi2026" /></Field>
              <Field label="Select / dropdown"><Select options={["Colombo 03", "Kandy", "Kurunegala"]} /></Field>
              <Field label="Multi-select with chips">
                <div className="field-wrap h-auto min-h-11 flex-wrap gap-1.5 p-1.5">{chips.map((c) => <span key={c} className="inline-flex h-8 items-center gap-1 rounded-lg bg-tint pl-2.5 pr-1 text-sm font-medium">{c}<button aria-label={`Remove ${c}`} onClick={() => setChips(chips.filter((x) => x !== c))} className="grid h-6 w-6 place-items-center rounded hover:bg-surface"><X size={12} /></button></span>)}<input placeholder="Add…" className="!h-8 !px-1.5" /></div>
              </Field>
              <Field label="Date picker"><Input type="date" defaultValue="2026-11-21" /></Field>
              <Field label="Date range"><button className="field flex items-center gap-2 text-left"><Calendar size={16} className="text-fg2" />01/11/2026 – 21/11/2026<ChevronDown size={16} className="ml-auto text-fg2" /></button></Field>
              <Field label="Time picker"><Input type="time" defaultValue="15:00" /></Field>
              <Field label="Error state" error="Barcode must be 13 digits"><Input invalid defaultValue="479103" /></Field>
              <Field label="Disabled"><Input disabled defaultValue="HD-DAI-1049" /></Field>
              <Field label="Textarea" className="md:col-span-2 xl:col-span-1"><Textarea placeholder="Notes" /></Field>
              <Field label="File / image uploader" className="md:col-span-2 xl:col-span-1"><label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-line text-sm text-fg2 hover:border-orange-500"><Upload size={20} />Drop file or <u>browse</u><input type="file" className="sr-only" /></label></Field>
            </div>
          </Card>
        </Sec>

        <Sec id="selection" title="Selection controls">
          <Card>
            <div className="flex flex-wrap gap-8">
              <Spec label="Toggle"><Toggle checked={tg} onChange={setTg} label="Track stock" /><Toggle checked={false} label="Off" /><Toggle checked disabled label="Disabled" /></Spec>
              <Spec label="Checkbox"><Checkbox checked={ck} onChange={setCk} label="Remember" /><Checkbox checked={false} label="Unchecked" /><Checkbox checked={false} indeterminate label="Mixed" /></Spec>
              <Spec label="Radio"><Radio checked={rd === "a"} onChange={() => setRd("a")} label="Cash" /><Radio checked={rd === "b"} onChange={() => setRd("b")} label="Card" /></Spec>
              <Spec label="Segmented control"><Segmented value={seg} onChange={setSeg} options={[{ v: "d", label: "Day" }, { v: "w", label: "Week" }, { v: "m", label: "Month" }]} /></Spec>
            </div>
          </Card>
        </Sec>

        <Sec id="pos-controls" title="POS controls" sub="Numeric keypad · quantity stepper · Sri Lankan denomination counter">
          <div className="grid gap-6 xl:grid-cols-[320px_200px_1fr]">
            <Card title="Numeric keypad"><div className="mb-3 flex h-14 items-center justify-end rounded-card border-2 border-orange-500 px-4 font-heading text-2xl font-semibold tnum">Rs. {(+kp || 0).toLocaleString()}</div><Keypad onKey={(k) => setKp((v) => (k === "⌫" ? v.slice(0, -1) : (v + k).slice(0, 8)))} /></Card>
            <Card title="Qty stepper"><div className="space-y-4"><QtyStepper value={q} onChange={setQ} /><QtyStepper value={q} onChange={setQ} size="l" /></div></Card>
            <Card title="Denomination counter"><DenominationCounter value={den} onChange={setDen} compact /></Card>
          </div>
        </Sec>

        <Sec id="product-cart" title="Product card & cart line">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Product card — grid">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[products[0], products[2], products[7], products[8]].map((p) => <ProductCard key={p.id} p={p} />)}</div>
              <p className="mt-2 text-[11px] text-fg2">In stock · Low · With variants · Out of stock overlay</p>
            </Card>
            <Card title="Product card — list"><div className="space-y-2">{[products[13], products[5], products[20]].map((p) => <ProductCard key={p.id} p={p} view="list" />)}</div></Card>
            <Card title="Cart line — states" className="xl:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                {[["Default", { key: "1", p: products[0], qty: 2, price: 1150 }, "default"], ["Discounted", { key: "2", p: products[3], qty: 1, price: 1450, disc: 10 }, "default"], ["Editing", { key: "3", p: products[1], qty: 1, price: 560, note: "No plastic bag" }, "editing"], ["Removing", { key: "4", p: products[2], qty: 2, price: 420 }, "removing"]].map(([l, line, st]) => (
                  <div key={l as string}><p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-fg2">{l as string}</p><div className="overflow-hidden rounded-card border border-line"><CartLine l={line as never} state={st as never} /></div></div>
                ))}
              </div>
            </Card>
          </div>
        </Sec>

        <Sec id="data-display" title="Data display">
          <div className="grid gap-6 xl:grid-cols-3">
            <StatCard label="Today's Sales" value={rs(486_250)} delta={12.4} icon={LayoutDashboard} spark={[22, 31, 28, 40, 38, 52, 49, 61]} />
            <StatCard label="Returns" value={rs(6_840)} delta={-18.2} invert icon={Package} spark={[12, 10, 11, 9, 8, 9, 7, 6]} />
            <Card title="Avatar & user chip"><div className="flex flex-wrap items-center gap-3"><Avatar name="Nimal Perera" size={28} /><Avatar name="Fathima Rizwan" size={40} color="#FF7A00" /><Avatar name="Kavindu Silva" size={56} color="#2563EB" /><span className="inline-flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3"><Avatar name="Kasun Jayasuriya" size={28} color="#FF7A00" /><span className="text-sm font-semibold">Kasun J.</span><span className="text-cap text-fg2">Cashier</span></span></div></Card>
          </div>
          <Card title="Status chips — icon + label, never colour alone" className="mt-6">
            <div className="flex flex-wrap gap-2">{["Completed", "Pending", "Refunded", "Partially Refunded", "Voided", "On Credit", "Draft", "In Stock", "Low Stock", "Out of Stock", "Active", "Inactive", "Online", "Offline", "Syncing", "Expired"].map((s) => <Status key={s} s={s} />)}</div>
            <div className="mt-4 flex flex-wrap gap-2"><Badge tone="navy">Navy</Badge><Badge tone="orange">Promo</Badge><Badge tone="amber">Gold</Badge><Badge tone="sky">Info</Badge><Badge tone="gray">Neutral</Badge></div>
          </Card>
          <Card title="Tabs" className="mt-6"><Tabs value={tab} onChange={setTab} tabs={[{ v: "a", label: "Purchase history", count: 62 }, { v: "b", label: "Loyalty" }, { v: "c", label: "Credit account" }]} /><div className="mt-4"><Tabs variant="pill" value={tab} onChange={setTab} tabs={[{ v: "a", label: "Active", count: 4 }, { v: "b", label: "Scheduled", count: 2 }, { v: "c", label: "Expired" }]} /></div></Card>
        </Sec>

        <Sec id="charts" title="Charts" sub="Brand palette: navy · orange · amber · sky. Dark mode swaps navy for sky so series stay visible.">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Line / area"><TrendChart data={daily} height={220} /></Card>
            <Card title="Bar — vertical"><VBars data={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x, i) => ({ x, a: [62, 71, 58, 66, 84, 97][i] * 10000, b: [55, 64, 60, 61, 78, 90][i] * 10000 }))} keys={[{ k: "a", label: "This week" }, { k: "b", label: "Last week", color: "#FF7A00" }]} height={220} /></Card>
            <Card title="Bar — horizontal"><HBars data={catSales.slice(0, 5)} height={200} /></Card>
            <Card title="Donut"><Donut data={paymentMix} height={200} center={{ label: "Total", value: "Rs. 997K" }} /></Card>
            <Card title="Heatmap" className="xl:col-span-2"><Heatmap rows={["Mon", "Tue", "Sat"]} cols={["09", "10", "11", "12", "13", "17", "18", "19"]} values={[[18, 22, 26, 38, 34, 42, 52, 46], [17, 21, 25, 36, 33, 40, 49, 44], [24, 30, 35, 51, 46, 57, 70, 62]]} /></Card>
            <Card title="Sparkline"><div className="flex gap-6"><Sparkline data={[3, 5, 4, 7, 6, 9, 8, 11]} /><Sparkline data={[9, 8, 8, 6, 7, 5, 4, 3]} color="#DC2626" /><Sparkline data={[4, 4, 5, 5, 6, 6, 7, 7]} color="#1A3170" /></div></Card>
          </div>
        </Sec>

        <Sec id="tables" title="Data table" sub="Sortable headers · row selection & bulk bar · inline chips · row actions · pagination · empty · loading skeleton">
          <DataTable rows={orders.slice(0, 5)} selectable bulk={[{ label: "Print", icon: Printer }, { label: "Delete", icon: Trash2, danger: true }]} rowActions={[{ label: "Edit", icon: Pencil }, { label: "Duplicate", icon: Copy }, { label: "Delete", icon: Trash2, danger: true }]}
            cols={[{ key: "id", label: "Invoice", render: (o) => <span className="font-semibold">{o.id}</span>, sort: (o) => o.id }, { key: "customer", label: "Customer" }, { key: "total", label: "Total", align: "right", render: (o) => rs(o.total), sort: (o) => o.total }, { key: "status", label: "Status", render: (o) => <Status s={o.status} /> }]} />
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <DataTable rows={[] as typeof orders} cols={[{ key: "id", label: "Invoice" }, { key: "total", label: "Total" }]} empty={<EmptyState title="No orders today" body="Sales will appear here as soon as the first one is rung up." action={<Link href="/pos" className="btn btn-m btn-primary">Open POS</Link>} />} />
            <DataTable rows={orders.slice(0, 3)} loading cols={[{ key: "id", label: "Invoice" }, { key: "customer", label: "Customer" }, { key: "total", label: "Total" }]} />
          </div>
        </Sec>

        <Sec id="feedback" title="Feedback" sub="Toasts top-right in back office, bottom on the POS · banners · empty states · loading">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Toasts"><div className="flex flex-wrap gap-2">{(["success", "error", "warning", "info"] as const).map((t) => <Button key={t} onClick={() => toast({ tone: t, title: { success: "Product saved", error: "Printer not found", warning: "Kotmale Fresh Milk is low", info: "12 offline sales synced" }[t], body: "Just now" })}>{t[0].toUpperCase() + t.slice(1)}</Button>)}</div></Card>
            <Card title="Loading"><div className="space-y-4"><div className="flex items-center gap-4"><Loader2 className="animate-spin text-orange-500" size={28} /><Loader2 className="animate-spin text-fg" size={20} /><Progress value={64} /></div><div className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /></div></div></Card>
            <div className="space-y-3 xl:col-span-2">
              <Banner tone="danger" title="You are offline. Sales will sync when connection returns.">23 sales saved on this terminal.</Banner>
              <Banner tone="warning" title="3 discrepancies on GRN-C03-00312" action={<Button size="s">Review</Button>} />
              <Banner tone="info" title="VAT return for November is due 20/12/2026" />
              <Banner tone="success" title="Backup completed · 412 MB" />
            </div>
            <Card pad={false}><EmptyState title="No products yet" body="Add your first product or import your supplier's price list." action={<Button variant="primary" icon={Plus}>Add product</Button>} /></Card>
            <Card pad={false}><EmptyState icon={Inbox} title="No held orders" body="Parked sales from this terminal show up here." /></Card>
          </div>
        </Sec>

        <Sec id="overlays" title="Overlays" sub="Small confirm · medium form · large payment · side drawer · tooltip · dropdown · command palette">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger-outline" onClick={() => setConfirm(true)}>Small confirm (danger)</Button>
              <Button onClick={() => setModal("m")}>Medium form modal</Button>
              <Link href="/pos?state=pay-cash" className="btn btn-m btn-outline">Large payment modal</Link>
              <Button onClick={() => setDrawer(true)}>Side drawer</Button>
              <Tooltip label="Manager approval required"><Button>Hover for tooltip</Button></Tooltip>
              <Dropdown trigger={(o) => <Button iconRight={ChevronDown} className={cn(o && "bg-tint")}>Dropdown menu</Button>}><MenuItem icon={Pencil}>Edit</MenuItem><MenuItem icon={Copy}>Duplicate</MenuItem><MenuItem icon={Printer} kbd="Ctrl P">Print</MenuItem><MenuItem icon={Trash2} danger>Delete</MenuItem></Dropdown>
              <Dropdown width="w-72" trigger={() => <Button icon={User}>Popover</Button>}><div className="p-3"><div className="flex items-center gap-3"><Avatar name="Nimal Perera" size={40} /><div><p className="font-semibold">Nimal Perera</p><p className="text-cap text-fg2">Gold · 2,846 pts</p></div></div><p className="mt-3 text-sm text-fg2">Credit balance <b className="text-fg">Rs. 4,500.00</b> of Rs. 25,000.00</p></div></Dropdown>
              <Button icon={Command} onClick={() => setPaletteOpen(true)} kbd="Ctrl K">Command palette</Button>
            </div>
          </Card>
        </Sec>

        <Sec id="navigation" title="Navigation" sub="Sidebar items · breadcrumbs · pagination · stepper">
          <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
            <div className="rounded-card bg-navy-900 p-3">
              {[["Default", "text-white/75"], ["Hover", "bg-white/[.07] text-white"], ["Active", "bg-navy-700 text-white"]].map(([l, c], i) => (
                <div key={l} className={cn("relative mb-1 flex h-11 items-center gap-3 rounded-ctl px-3 text-sm font-medium", c)}>{i === 2 && <span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r bg-orange-500" />}<Package size={20} className={i === 2 ? "text-orange-500" : ""} />Products<span className="ml-auto text-[10px] uppercase opacity-60">{l}</span></div>
              ))}
              <div className="mt-2 flex gap-2"><span className="relative grid h-11 w-12 place-items-center rounded-ctl bg-navy-700 text-orange-500"><span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r bg-orange-500" /><Package size={20} /></span><span className="grid h-11 w-12 place-items-center rounded-ctl text-white/75"><Clock size={20} /></span><span className="self-center text-[10px] uppercase text-white/60">Collapsed (72 px)</span></div>
            </div>
            <Card>
              <div className="space-y-6"><Breadcrumbs items={["Products", "Dairy", "Anchor Milk Powder 400g"]} /><div className="-mx-4 rounded-card border border-line"><Pagination /></div><Steps steps={["Find invoice", "Select items", "Refund method", "Confirm"]} current={1} /></div>
            </Card>
          </div>
        </Sec>

        <Sec id="receipts" title="Receipts" sub="58 mm and 80 mm thermal styles">
          <div className="flex flex-wrap items-start justify-center gap-8 rounded-card bg-surface-2 p-8"><Receipt d={sampleReceipt} width={58} /><Receipt d={sampleReceipt} width={80} /><Receipt d={sampleReceipt} width={80} lang="si" /></div>
        </Sec>

        <Sec id="pos-states" title="POS terminal states" sub="Open any state directly — designed at 1024 px tablet landscape and 1440 px desktop.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["empty", "Empty cart"], ["cart", "Items in cart"], ["pay-cash", "Payment · Cash"], ["pay-card", "Payment · Card"], ["pay-qr", "Payment · LankaQR"], ["pay-credit", "Payment · Credit"], ["pay-gift", "Payment · Gift card"], ["pay-split", "Payment · Split"], ["done", "Sale complete"], ["receipt", "Receipt preview"], ["held", "Held orders"], ["discount", "Discount"], ["coupon", "Coupon / gift card"], ["customer", "Customer search / create"], ["variant", "Variant picker"], ["weight", "Weight entry"], ["override", "Manager override PIN"], ["edit", "Edit line"], ["clear", "Clear cart confirm"], ["offline", "Offline mode"], ["cart&lang=si", "Sinhala (සිංහල)"], ["cart&lang=ta", "Tamil (தமிழ்)"], ["cart&theme=dark", "Dark mode"]].map(([s, l]) => (
              <Link key={s} href={`/pos?state=${s}`} className="card flex h-14 items-center gap-3 px-4 text-sm font-semibold transition hover:border-orange-500/60"><ScanBarcode size={18} className="text-orange-500" />{l}<ArrowRight size={16} className="ml-auto text-fg2" /></Link>
            ))}
          </div>
        </Sec>
      </div>

      <Modal open={modal === "m"} onClose={() => setModal(null)} title="Add expense" sub="Medium form modal" footer={<><Button size="l" onClick={() => setModal(null)}>Cancel</Button><Button size="l" variant="primary">Save</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Amount"><AddonInput prefix="Rs." defaultValue="2,350.00" /></Field><Field label="Category"><Select options={["Other", "Transport"]} /></Field><Field label="Note" className="sm:col-span-2"><Textarea defaultValue="Tea, sugar & staff refreshments" /></Field></div>
      </Modal>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={() => toast({ tone: "success", title: "Deleted" })} title="Delete 3 products?" body="They'll be removed from all branches. Sales history is kept." />
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="INV-C03-018453" sub="Side drawer / slide-over" footer={<><Button icon={Printer}>Reprint</Button><Button variant="secondary" className="ml-auto">Refund</Button></>}>
        <p className="text-sm text-fg2">Drawers hold details without leaving the list — order details, notifications, held sales.</p>
        <div className="mt-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      </Drawer>
    </div>
  );
}

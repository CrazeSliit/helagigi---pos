"use client";
import { useEffect, useState } from "react";
import {
  Bell, Building, CreditCard, Database, FileText, Globe, Plug, Printer, Receipt, Percent, Gem, Upload, Check, Banknote, QrCode, Wallet, Gift,
  Landmark, ScanBarcode, Monitor, MessageSquare, MessageCircle, Mail, BookOpen, ShoppingBag, Download, CloudUpload, type LucideIcon,
} from "lucide-react";
import { AddonInput, Badge, Button, Card, Field, Input, PageHeader, Progress, Segmented, Select, Status, Textarea, Toggle } from "@/components/ui";
import { Receipt as ReceiptView, sampleReceipt } from "@/components/pos-kit";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";

const TABS: { v: string; l: string; i: LucideIcon }[] = [
  { v: "business", l: "Business profile", i: Building }, { v: "tax", l: "Tax", i: Percent }, { v: "receipt", l: "Receipt designer", i: Receipt },
  { v: "invoice", l: "Invoice template", i: FileText }, { v: "payments", l: "Payment methods", i: CreditCard }, { v: "hardware", l: "Hardware & printers", i: Printer },
  { v: "localization", l: "Localization", i: Globe }, { v: "notifications", l: "Notifications", i: Bell }, { v: "integrations", l: "Integrations", i: Plug },
  { v: "data", l: "Data & backup", i: Database }, { v: "billing", l: "Subscription & billing", i: Gem },
];

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4 last:border-0"><div className="max-w-md"><p className="font-semibold">{title}</p>{desc && <p className="text-sm text-fg2">{desc}</p>}</div>{children}</div>;
}

export default function SettingsPage() {
  const { toast } = useApp();
  const [tab, setTab] = useState("receipt");
  useEffect(() => { const t = new URLSearchParams(window.location.search).get("tab"); if (t) setTab(t); }, []);
  const [rcpt, setRcpt] = useState({ logo: true, qr: true, points: true, size: "80" as "58" | "80" | "A4", lang: "en" as "en" | "si" });
  const [pm, setPm] = useState({ Cash: true, Card: true, LankaQR: true, "Bank Transfer": false, Credit: true, "Gift Card": true });
  const cur = TABS.find((t) => t.v === tab)!;
  return (
    <>
      <PageHeader title="Settings" sub="HeladiGi Mart (Pvt) Ltd" actions={<Button variant="primary" onClick={() => toast({ tone: "success", title: "Settings saved" })}>Save changes</Button>} />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="card h-fit p-2 lg:sticky lg:top-24" aria-label="Settings">
          <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-0.5 no-scrollbar">
            {TABS.map((t) => (
              <li key={t.v}><button onClick={() => setTab(t.v)} aria-current={tab === t.v ? "page" : undefined}
                className={cn("relative flex h-11 w-full items-center gap-3 whitespace-nowrap rounded-ctl px-3 text-left text-sm font-medium transition", tab === t.v ? "bg-tint text-fg" : "text-fg2 hover:bg-tint/60 hover:text-fg")}>
                {tab === t.v && <span className="absolute left-0 top-2 bottom-2 hidden w-1 rounded-r bg-orange-500 lg:block" />}<t.i size={18} />{t.l}
              </button></li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold">{cur.l}</h2>
          {tab === "business" && (
            <Card>
              <div className="mb-6 flex items-center gap-4"><span className="grid h-20 w-40 place-items-center rounded-card border border-line bg-white p-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/wordmark.png" alt="Business logo" className="w-full" /></span><Button icon={Upload}>Replace logo</Button></div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business name"><Input defaultValue="HeladiGi Mart (Pvt) Ltd" /></Field>
                <Field label="Trading name"><Input defaultValue="HeladiGi Mart" /></Field>
                <Field label="Registered address" className="md:col-span-2"><Textarea defaultValue="No. 214, Galle Road, Colombo 03, Sri Lanka" className="min-h-[72px]" /></Field>
                <Field label="Phone"><AddonInput prefix="+94" defaultValue="11 257 4410" /></Field>
                <Field label="Email"><Input defaultValue="hello@heladigimart.lk" /></Field>
                <Field label="BR number"><Input defaultValue="PV 00245781" /></Field>
                <Field label="VAT registration number"><Input defaultValue="114567890-7000" /></Field>
              </div>
            </Card>
          )}
          {tab === "tax" && (
            <Card>
              <Row title="Prices include tax" desc="Shelf prices already include VAT — tax is calculated backwards on receipts"><Segmented value="incl" onChange={() => {}} options={[{ v: "incl", label: "Tax inclusive" }, { v: "excl", label: "Tax exclusive" }]} /></Row>
              <div className="mt-2 overflow-hidden rounded-card border border-line">
                <table className="tbl"><thead><tr><th>Tax</th><th>Rate</th><th>Applies to</th><th>Status</th></tr></thead>
                  <tbody>{[["VAT", "18%", "Most goods", "Active"], ["SSCL", "2.5%", "Turnover (reported, not on receipt)", "Active"], ["VAT Exempt", "0%", "Rice, fresh vegetables, medicines", "Active"]].map((r) => <tr key={r[0]}><td className="font-semibold">{r[0]}</td><td>{r[1]}</td><td className="text-fg2">{r[2]}</td><td><Status s={r[3]} /></td></tr>)}</tbody>
                </table>
              </div>
            </Card>
          )}
          {tab === "receipt" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
              <Card>
                <Row title="Paper size"><Segmented value={rcpt.size} onChange={(v) => setRcpt({ ...rcpt, size: v })} options={[{ v: "58", label: "58 mm" }, { v: "80", label: "80 mm" }, { v: "A4", label: "A4" }]} /></Row>
                <Row title="Show logo"><Toggle checked={rcpt.logo} onChange={(v) => setRcpt({ ...rcpt, logo: v })} /></Row>
                <Row title="Show e-receipt QR code" desc="Customers scan to save a digital copy"><Toggle checked={rcpt.qr} onChange={(v) => setRcpt({ ...rcpt, qr: v })} /></Row>
                <Row title="Show loyalty points earned"><Toggle checked={rcpt.points} onChange={(v) => setRcpt({ ...rcpt, points: v })} /></Row>
                <Row title="Receipt language"><Segmented value={rcpt.lang} onChange={(v) => setRcpt({ ...rcpt, lang: v })} options={[{ v: "en", label: "English" }, { v: "si", label: "සිංහල" }]} /></Row>
                <div className="grid gap-4 pt-4 md:grid-cols-2">
                  <Field label="Header text"><Textarea defaultValue="HeladiGi Mart — Colombo 03" className="min-h-[72px]" /></Field>
                  <Field label="Footer (English)"><Textarea defaultValue="Thank you, come again!" className="min-h-[72px]" /></Field>
                  <Field label="Footer (සිංහල)"><Textarea defaultValue="ස්තූතියි, නැවත එන්න!" className="min-h-[72px]" /></Field>
                  <Field label="Return policy line"><Textarea defaultValue="Exchanges within 7 days with receipt" className="min-h-[72px]" /></Field>
                </div>
              </Card>
              <div className="rounded-card bg-surface-2 p-6 xl:sticky xl:top-24 xl:h-fit">
                <p className="mb-3 text-center text-cap font-semibold uppercase tracking-wide text-fg2">Live preview</p>
                <div className={cn(!rcpt.logo && "[&_img:first-child]:hidden", !rcpt.qr && "[&_svg]:hidden")}>
                  <ReceiptView d={{ ...sampleReceipt, points: rcpt.points ? 48 : 0 }} width={rcpt.size === "58" ? 58 : 80} lang={rcpt.lang} />
                </div>
              </div>
            </div>
          )}
          {tab === "invoice" && (
            <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
              <Card><div className="space-y-4"><Field label="Accent colour"><div className="flex gap-2">{["#0B1E4F", "#FF7A00", "#1A3170"].map((c, i) => <button key={c} aria-label={c} className={cn("h-10 w-10 rounded-ctl border-2", i === 0 ? "border-orange-500" : "border-line")} style={{ background: c }} />)}</div></Field><Field label="Payment terms"><Select options={["Due on receipt", "Net 7", "Net 30"]} /></Field><Field label="Bank details"><Textarea defaultValue={"Commercial Bank — Kollupitiya\nA/C 1000 2345 67\nHeladiGi Mart (Pvt) Ltd"} /></Field><Toggle checked label="Show signature line" /></div></Card>
              <div className="rounded-card bg-surface-2 p-6">
                <div className="mx-auto aspect-[1/1.414] max-w-[560px] bg-white p-10 text-[11px] text-black shadow-lift">
                  <div className="flex items-start justify-between">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/wordmark.png" alt="" className="w-36" /><div className="text-right"><p className="font-heading text-2xl font-bold text-navy-900">TAX INVOICE</p><p>INV-W-000812</p><p>21/11/2026</p></div></div>
                  <div className="mt-8 grid grid-cols-2 gap-6"><div><p className="font-bold text-navy-900">From</p><p>HeladiGi Mart (Pvt) Ltd</p><p>No. 214, Galle Road, Colombo 03</p><p>VAT 114567890-7000</p></div><div><p className="font-bold text-navy-900">Bill to</p><p>Hotel Mahaweli Kitchen</p><p>No. 35, Peradeniya Road, Kandy</p><p>VAT 103344556-7000</p></div></div>
                  <table className="mt-8 w-full"><thead><tr className="bg-navy-900 text-left text-white"><th className="p-2">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th></tr></thead>
                    <tbody>{[["Anchor Milk Powder 400g", 24, 1040], ["Dilmah Tea 100 bags", 12, 1310], ["Samba Rice (kg)", 50, 238], ["Elephant House Cream Soda 1.5L", 36, 380]].map((r) => <tr key={r[0] as string} className="border-b border-gray-200"><td className="p-2">{r[0]}</td><td className="p-2 text-right">{r[1]}</td><td className="p-2 text-right">{rs(r[2] as number, { prefix: false })}</td><td className="p-2 text-right">{rs((r[1] as number) * (r[2] as number), { prefix: false })}</td></tr>)}</tbody></table>
                  <div className="ml-auto mt-4 w-56 space-y-1"><div className="flex justify-between"><span>Subtotal</span><span>{rs(66_140, { prefix: false })}</span></div><div className="flex justify-between"><span>VAT 18%</span><span>{rs(11_905.2, { prefix: false })}</span></div><div className="flex justify-between border-t-2 border-navy-900 pt-1 text-[13px] font-bold"><span>Total</span><span>{rs(78_045.2)}</span></div></div>
                  <p className="mt-10 text-gray-600">Payment terms: Net 30 · Commercial Bank A/C 1000 2345 67</p>
                </div>
              </div>
            </div>
          )}
          {tab === "payments" && (
            <div className="grid gap-4 md:grid-cols-2">
              {([["Cash", Banknote, "Change, quick cash buttons, drawer kick"], ["Card", CreditCard, "Commercial Bank · Verifone V200c"], ["LankaQR", QrCode, "Merchant ID 6200 1145 77"], ["Bank Transfer", Landmark, "Show account details at checkout"], ["Credit", Wallet, "Customer accounts with credit limits"], ["Gift Card", Gift, "HeladiGi gift cards"]] as [keyof typeof pm, LucideIcon, string][]).map(([n, I, d]) => (
                <Card key={n}><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-ctl bg-tint"><I size={20} /></span><div className="flex-1"><p className="font-semibold">{n}</p><p className="text-sm text-fg2">{d}</p></div><Toggle checked={pm[n]} onChange={(v) => setPm({ ...pm, [n]: v })} /></div>{pm[n] && <Button size="s" className="mt-3">Configure</Button>}</Card>
              ))}
            </div>
          )}
          {tab === "hardware" && (
            <div className="grid gap-4 md:grid-cols-2">
              {([["Receipt printer", Printer, "Epson TM-T82 · USB", "Online"], ["Label printer", Printer, "Zebra ZD220 · USB", "Online"], ["Barcode scanner", ScanBarcode, "Honeywell Voyager 1250g", "Online"], ["Cash drawer", Wallet, "CD-410 via printer RJ11", "Online"], ["Customer display", Monitor, "Not connected", "Offline"], ["Weighing scale", Database, "CAS PD-II · COM3", "Online"]] as [string, LucideIcon, string, string][]).map(([n, I, d, s]) => (
                <Card key={n}><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-ctl bg-tint"><I size={20} /></span><div className="flex-1"><p className="font-semibold">{n}</p><p className="text-sm text-fg2">{d}</p></div><Status s={s} /></div><div className="mt-3 flex gap-2"><Button size="s" onClick={() => toast({ tone: s === "Online" ? "success" : "error", title: s === "Online" ? `${n} test OK` : `${n} not found` })}>Test</Button><Button size="s" variant="ghost">Change</Button></div></Card>
              ))}
            </div>
          )}
          {tab === "localization" && (
            <Card><div className="grid gap-4 md:grid-cols-2"><Field label="Default language"><Select options={["English", "සිංහල", "தமிழ்"]} /></Field><Field label="Currency"><Select options={["Sri Lankan Rupee (Rs.)"]} /></Field><Field label="Date format"><Select options={["DD/MM/YYYY (21/11/2026)", "YYYY-MM-DD"]} /></Field><Field label="Time zone"><Select options={["Asia/Colombo (UTC+05:30)"]} /></Field><Field label="Number format"><Select options={["1,234,567.00", "12,34,567.00"]} /></Field><Field label="Round cash totals"><Select options={["No rounding", "Nearest Rs. 1", "Nearest Rs. 5"]} /></Field></div></Card>
          )}
          {tab === "notifications" && (
            <Card>
              <Row title="Low stock threshold" desc="Alert when stock falls below the reorder level or this %"><AddonInput suffix="% of reorder" defaultValue="100" className="w-48" /></Row>
              {["Daily sales summary", "Low stock alerts", "Large discount / void alerts", "Shift variance over Rs. 1,000"].map((n, i) => (
                <Row key={n} title={n}><div className="flex flex-wrap gap-4"><Toggle checked={i !== 3} label="Email" /><Toggle checked={i < 2} label="SMS" /><Toggle checked label="WhatsApp" /></div></Row>
              ))}
            </Card>
          )}
          {tab === "integrations" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {([["SMS gateway", MessageSquare, "Dialog eSMS / Mobitel", true], ["WhatsApp Business", MessageCircle, "Receipts & reminders", true], ["Email", Mail, "SMTP or Google Workspace", false], ["Accounting", BookOpen, "QuickBooks · Xero", false], ["E-commerce store", ShoppingBag, "Sync stock with your online shop", false]] as [string, LucideIcon, string, boolean][]).map(([n, I, d, on]) => (
                <Card key={n}><span className="grid h-12 w-12 place-items-center rounded-card bg-tint"><I size={22} /></span><p className="mt-3 font-semibold">{n}</p><p className="text-sm text-fg2">{d}</p>{on ? <div className="mt-4 flex items-center justify-between"><Badge tone="sky"><Check size={13} />Connected</Badge><Button size="s" variant="ghost">Manage</Button></div> : <Button size="s" variant="secondary" className="mt-4">Connect</Button>}</Card>
              ))}
            </div>
          )}
          {tab === "data" && (
            <Card>
              <Row title="Backup now" desc="Last backup 21/11/2026 03:00 · 412 MB"><Button icon={CloudUpload}>Back up now</Button></Row>
              <Row title="Automatic backup"><Select options={["Daily at 03:00", "Every 6 hours", "Weekly"]} className="w-48" /></Row>
              <Row title="Export all data" desc="Products, customers, sales and stock as CSV files in a ZIP"><Button icon={Download}>Export</Button></Row>
              <Row title="Offline mode" desc="Keep selling when the internet drops; sync when back online"><Toggle checked /></Row>
              <Row title="Offline sales limit" desc="Lock the terminal after this many unsynced sales"><Input defaultValue="500" className="w-28" /></Row>
            </Card>
          )}
          {tab === "billing" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-card bg-navy-900 p-6 text-white shadow-soft"><Badge tone="orange">CURRENT PLAN</Badge><p className="mt-4 font-heading text-2xl font-bold">Business</p><p className="text-white/70">Rs. 14,900 / month · renews 01/12/2026</p>
                <div className="mt-6 space-y-4">{[["Branches", 3, 5], ["Terminals", 9, 15], ["Users", 10, 25]].map(([l, a, b]) => <div key={l as string}><div className="mb-1 flex justify-between text-sm"><span>{l}</span><span className="tnum">{a} / {b}</span></div><div className="h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-orange-500" style={{ width: `${((a as number) / (b as number)) * 100}%` }} /></div></div>)}</div></div>
              <Card title="Upgrade"><div className="space-y-3">{[["Starter", "Rs. 4,900", "1 branch · 2 terminals"], ["Business", "Rs. 14,900", "5 branches · 15 terminals"], ["Enterprise", "Custom", "Unlimited · dedicated support"]].map(([n, p, d], i) => <div key={n} className={cn("flex items-center justify-between rounded-card border p-4", i === 1 ? "border-orange-500 bg-orange-100/40" : "border-line")}><div><p className="font-semibold">{n}</p><p className="text-sm text-fg2">{d}</p></div><div className="text-right"><p className="font-heading font-semibold">{p}</p>{i === 1 ? <span className="text-cap text-fg2">Current</span> : <Button size="s" className="mt-1">{i === 2 ? "Contact sales" : "Switch"}</Button>}</div></div>)}</div></Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

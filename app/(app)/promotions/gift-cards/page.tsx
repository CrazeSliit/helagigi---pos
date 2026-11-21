"use client";
import { useState } from "react";
import { Gift, Printer, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Status, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";
import { rs } from "@/lib/format";

const cards = [
  { id: "GC-7741-2290", to: "Sanduni Rathnayake", issued: 10_000, bal: 7_500, date: "02/11/2026", exp: "02/11/2027", s: "Active" },
  { id: "GC-7741-2288", to: "Corporate — Dialog Axiata", issued: 5_000, bal: 5_000, date: "28/10/2026", exp: "28/10/2027", s: "Active" },
  { id: "GC-7741-2271", to: "Malsha Gunawardena", issued: 2_500, bal: 0, date: "11/09/2026", exp: "11/09/2027", s: "Completed" },
  { id: "GC-7741-2265", to: "Walk-in", issued: 3_000, bal: 1_240, date: "30/08/2026", exp: "30/08/2027", s: "Active" },
];

function GiftCardArt({ amount = 10000, code = "GC-7741-2291", to = "Kavindu Silva" }) {
  return (
    <div className="relative aspect-[1.586] w-full max-w-[400px] overflow-hidden rounded-[16px] bg-navy-900 p-6 text-white shadow-lift">
      <svg className="absolute -bottom-16 -left-16 h-64 w-64" viewBox="0 0 200 200" aria-hidden><circle cx="0" cy="200" r="180" fill="#1A3170" /><path d="M0 14 A186 186 0 0 1 186 200" stroke="#FF7A00" strokeWidth="8" fill="none" /></svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/raksha-line-light.png" alt="" className="absolute -right-2 top-0 h-full opacity-30" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between"><span className="rounded-md bg-white px-2 py-1">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/wordmark.png" alt="HeladiGi" className="w-24" /></span><span className="text-cap font-bold tracking-[.2em] text-orange-500">GIFT CARD</span></div>
        <div className="flex items-end justify-between">
          <div><p className="font-heading text-[32px] font-bold leading-none">{rs(amount, { decimals: false })}</p><p className="mt-2 font-mono text-sm tracking-widest text-white/80">{code}</p><p className="text-cap text-white/60">For {to} · valid 12 months</p></div>
          <span className="rounded-md bg-white p-1.5"><QRCodeSVG value={code} size={56} /></span>
        </div>
      </div>
    </div>
  );
}

export default function GiftCards() {
  const [amt, setAmt] = useState(10000);
  return (
    <>
      <PageHeader title="Gift cards" sub={`${rs(13_740, { decimals: false })} outstanding balance across 3 active cards`} />
      <SubNav module="promotions" />
      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_440px]">
        <Card title="Issue a gift card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" className="sm:col-span-2"><div className="flex flex-wrap gap-2">{[1000, 2500, 5000, 10000].map((v) => <Button key={v} variant={amt === v ? "secondary" : "outline"} onClick={() => setAmt(v)} size="l">{rs(v, { decimals: false })}</Button>)}<AddonInput prefix="Rs." placeholder="Custom" className="h-12 w-36" /></div></Field>
            <Field label="Recipient name"><Input defaultValue="Kavindu Silva" /></Field>
            <Field label="Recipient mobile"><AddonInput prefix="+94" defaultValue="76 330 7781" /></Field>
            <Field label="Message" className="sm:col-span-2"><Textarea defaultValue="Happy birthday machan! 🎉" className="min-h-[72px]" /></Field>
          </div>
          <div className="mt-4 flex gap-2"><Button variant="primary" icon={Gift}>Issue & collect payment</Button><Button icon={Printer}>Print card</Button></div>
        </Card>
        <Card title="Printable design"><GiftCardArt amount={amt} /></Card>
      </div>
      <Card title="Check balance" className="mb-6"><div className="flex flex-wrap gap-2"><div className="field-wrap max-w-sm flex-1"><Search size={18} className="ml-3 text-fg2" /><input defaultValue="GC-7741-2290" className="font-mono" /></div><Button variant="secondary">Check</Button><span className="ml-2 self-center text-sm">Balance: <b className="tnum">{rs(7_500)}</b> · last used 18/11/2026</span></div></Card>
      <DataTable rows={cards} cols={[
        { key: "id", label: "Card #", render: (c) => <span className="font-mono font-semibold">{c.id}</span> },
        { key: "to", label: "Recipient" },
        { key: "issued", label: "Issued", align: "right", render: (c) => rs(c.issued) },
        { key: "bal", label: "Balance", align: "right", render: (c) => <span className="font-semibold">{rs(c.bal)}</span> },
        { key: "date", label: "Issued on", render: (c) => <span className="text-fg2">{c.date}</span> },
        { key: "exp", label: "Expires", render: (c) => <span className="text-fg2">{c.exp}</span> },
        { key: "s", label: "Status", render: (c) => <Status s={c.s} label={c.s === "Completed" ? "Fully used" : c.s} /> },
      ]} />
    </>
  );
}

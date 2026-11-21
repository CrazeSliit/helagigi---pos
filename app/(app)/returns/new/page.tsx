"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, CheckCircle2, CreditCard, Printer, QrCode, ScanBarcode, Wallet, ArrowLeftRight } from "lucide-react";
import { Button, Card, Checkbox, PageHeader, SearchInput, Select, Steps, QtyStepper, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { ProductThumb } from "@/components/pos-kit";
import { products } from "@/lib/data";
import { cn, rs } from "@/lib/format";

const inv = [{ p: products[0], qty: 2 }, { p: products[1], qty: 1 }, { p: products[3], qty: 1 }, { p: products[2], qty: 2 }];

export default function NewReturn() {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Record<string, { on: boolean; qty: number; reason: string }>>({ p1: { on: true, qty: 1, reason: "Damaged" }, p3: { on: true, qty: 1, reason: "Expired" } });
  const [method, setMethod] = useState("Original payment");
  const refund = inv.reduce((s, l) => s + (sel[l.p.id]?.on ? sel[l.p.id].qty * l.p.price : 0), 0);
  return (
    <>
      <PageHeader title="New return" sub="Process a refund against an original invoice" />
      <SubNav module="returns" />
      <div className="card mb-6 p-5"><Steps steps={["Find invoice", "Select items", "Refund method", "Confirm"]} current={step} /></div>

      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Scan the receipt QR">
            <div className="grid aspect-[4/3] place-items-center rounded-card border-2 border-dashed border-line bg-surface-2">
              <div className="text-center"><span className="relative mx-auto grid h-24 w-24 place-items-center rounded-card bg-surface shadow-soft"><QrCode size={48} /><span className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-orange-500" /></span><p className="mt-4 font-semibold">Point the receipt at the scanner</p><p className="text-sm text-fg2">or the tablet camera</p></div>
            </div>
          </Card>
          <Card title="Or search">
            <SearchInput placeholder="Invoice #, phone or customer name" defaultValue="INV-C03-018453" />
            <button onClick={() => setStep(1)} className="mt-4 flex w-full items-center gap-4 rounded-card border-2 border-orange-500 bg-orange-100/40 p-4 text-left">
              <ScanBarcode size={22} />
              <span className="flex-1"><span className="block font-semibold">INV-C03-018453</span><span className="text-cap text-fg2">Nimal Perera · 21/11/2026 14:56 · 6 items · Cash</span></span>
              <span className="font-semibold tnum">{rs(5_005)}</span><Status s="Completed" />
            </button>
            <p className="mt-3 text-cap text-fg2">Returns accepted within 7 days of purchase with a receipt.</p>
          </Card>
        </div>
      )}

      {step === 1 && (
        <Card title="Select items to return" sub="INV-C03-018453 · Nimal Perera" pad={false}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th className="w-12" /><th>Item</th><th className="text-right">Sold</th><th>Return qty</th><th>Reason</th><th className="text-right">Refund</th></tr></thead>
              <tbody>
                {inv.map(({ p, qty }) => {
                  const s = sel[p.id] ?? { on: false, qty: 1, reason: "Damaged" };
                  return (
                    <tr key={p.id} className={cn(s.on && "sel")}>
                      <td><Checkbox checked={s.on} onChange={(v) => setSel({ ...sel, [p.id]: { ...s, on: v } })} /></td>
                      <td><span className="flex items-center gap-3"><ProductThumb p={p} className="h-10 w-10" size={18} /><span className="font-semibold">{p.name}</span></span></td>
                      <td className="text-right">{qty} × {rs(p.price)}</td>
                      <td><QtyStepper value={s.qty} min={1} onChange={(v) => setSel({ ...sel, [p.id]: { ...s, qty: Math.min(qty, v), on: true } })} /></td>
                      <td><Select className="w-56" options={["Damaged", "Wrong item", "Expired", "Customer changed mind"]} value={s.reason} onChange={(e) => setSel({ ...sel, [p.id]: { ...s, reason: e.target.value } })} disabled={!s.on} /></td>
                      <td className="text-right font-semibold">{s.on ? rs(s.qty * p.price) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line p-5"><span className="text-sm text-fg2">Refund total</span><span className="font-heading text-xl font-bold tnum">{rs(refund)}</span></div>
        </Card>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ l: "Cash", i: Banknote, d: "Pay out from the drawer now" }, { l: "Original payment", i: CreditCard, d: "Back to Cash (original method)" }, { l: "Store credit", i: Wallet, d: "Added to Nimal's account" }, { l: "Exchange", i: ArrowLeftRight, d: "Swap for other items" }].map((m) => (
            <button key={m.l} onClick={() => setMethod(m.l)} aria-pressed={method === m.l} className={cn("card p-5 text-left transition", method === m.l ? "border-orange-500 ring-4 ring-orange-500/15" : "hover:border-orange-500/40")}>
              <span className="grid h-12 w-12 place-items-center rounded-card bg-tint"><m.i size={24} /></span>
              <p className="mt-4 font-semibold">{m.l}</p><p className="text-sm text-fg2">{m.d}</p>
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <div className="flex items-center gap-4"><CheckCircle2 size={44} className="text-success" /><div><h2 className="font-heading text-xl font-semibold">Return RET-C03-00215 processed</h2><p className="text-sm text-fg2">{rs(refund)} refunded via {method}. Stock updated: 2 items back to Colombo 03 (1 marked damaged).</p></div></div>
            <div className="mt-6 flex flex-wrap gap-2"><Button icon={Printer} variant="secondary">Print return receipt</Button><Link href="/returns" className="btn btn-m btn-outline">Back to returns</Link></div>
          </Card>
          <div className="mx-auto w-[302px] bg-white p-4 font-mono text-[11px] leading-[15px] text-black shadow-lift">
            <p className="text-center font-bold">RETURN RECEIPT</p><p className="text-center">HeladiGi Mart — Colombo 03</p>
            <div className="my-2 border-t border-dashed border-black" />
            <p>Return #: RET-C03-00215</p><p>Orig. inv: INV-C03-018453</p><p>Date: 21/11/2026 15:20</p>
            <div className="my-2 border-t border-dashed border-black" />
            {inv.filter((l) => sel[l.p.id]?.on).map((l) => <div key={l.p.id} className="flex justify-between"><span>{l.p.name.slice(0, 26)}</span><span>-{rs(sel[l.p.id].qty * l.p.price, { prefix: false })}</span></div>)}
            <div className="my-2 border-t border-black" />
            <div className="flex justify-between font-bold"><span>REFUND</span><span>{rs(refund)}</span></div>
            <p className="mt-2">Method: {method}</p><p>Processed by: Dilani F.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button icon={ArrowLeft} size="l" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 3 && <Button variant="primary" size="l" iconRight={ArrowRight} onClick={() => setStep(step + 1)} disabled={step === 1 && !refund}>{step === 2 ? `Refund ${rs(refund)}` : "Continue"}</Button>}
      </div>
    </>
  );
}

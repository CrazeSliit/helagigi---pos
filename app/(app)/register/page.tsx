"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, Clock, CreditCard, LogOut, QrCode, Undo2, Wallet, Printer } from "lucide-react";
import { AddonInput, Avatar, Button, Card, Field, PageHeader, Segmented, Select, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { Modal } from "@/components/overlays";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function CurrentShift() {
  const { toast } = useApp();
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<"in" | "out">("out");
  const rows = [
    { l: "Opening float", v: 15_000, i: Wallet },
    { l: "Cash sales", v: 186_420, i: Banknote },
    { l: "Card sales", v: 128_300, i: CreditCard, nc: true },
    { l: "LankaQR sales", v: 74_150, i: QrCode, nc: true },
    { l: "Refunds (cash)", v: -1_570, i: Undo2 },
    { l: "Cash in", v: 2_000, i: ArrowDownLeft },
    { l: "Cash out", v: -3_450, i: ArrowUpRight },
  ];
  const expected = rows.filter((r) => !r.nc).reduce((s, r) => s + r.v, 0);
  return (
    <>
      <PageHeader title="Current shift" sub="Colombo 03 · Terminal 1" actions={<><Button icon={Printer}>X-Report</Button><Button icon={ArrowDownLeft} onClick={() => setOpen(true)}>Cash in / out</Button><Link href="/register/close" className="btn btn-m btn-primary"><LogOut size={18} />Close shift</Link></>} />
      <SubNav module="register" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card flex flex-wrap items-center gap-6 p-5">
            <span className="flex items-center gap-3"><Avatar name="Kasun Jayasuriya" color="#FF7A00" size={44} /><span><span className="block font-semibold">Kasun Jayasuriya</span><span className="text-cap text-fg2">Cashier</span></span></span>
            <span className="flex items-center gap-2 text-sm"><Clock size={16} className="text-fg2" />Started <b>08:01</b> · running <b className="tnum">6h 58m</b></span>
            <span className="ml-auto inline-flex h-8 items-center gap-2 rounded-full bg-success/10 px-3 text-cap font-semibold text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" />Shift open</span>
          </div>
          <Card title="Live summary" pad={false}>
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.l} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-ctl bg-tint"><r.i size={18} /></span>
                  <span className="flex-1 text-sm">{r.l}{r.nc && <span className="ml-2 text-cap text-fg2">not in drawer</span>}</span>
                  <span className={cn("font-semibold tnum", r.v < 0 && "text-danger", r.nc && "text-fg2")}>{rs(r.v)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-b-card bg-navy-900 px-5 py-4 text-white dark:bg-navy-700"><span className="font-semibold">Expected cash in drawer</span><span className="font-heading text-2xl font-bold tnum">{rs(expected)}</span></div>
          </Card>
        </div>
        <Card title="Cash movements today">
          <ul className="space-y-3 text-sm">
            {[["10:15", "out", 1_450, "Tea & snacks for staff"], ["12:40", "in", 2_000, "Change from bank"], ["13:05", "out", 2_000, "Three-wheeler delivery — Hotel Mahaweli"]].map(([t, d, v, n]) => (
              <li key={t as string} className="flex items-start gap-3">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", d === "in" ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>{d === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span>
                <span className="flex-1"><span className="block font-medium">{n}</span><span className="text-cap text-fg2">{t} · Kasun J.</span></span>
                <span className={cn("font-semibold tnum", d === "in" ? "text-success" : "text-danger")}>{d === "in" ? "+" : "−"}{rs(v as number)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Cash in / out" size="s" footer={<><Button size="l" onClick={() => setOpen(false)}>Cancel</Button><Button size="l" variant="primary" onClick={() => { setOpen(false); toast({ tone: "success", title: `Cash ${dir} recorded` }); }}>Record</Button></>}>
        <Segmented size="l" value={dir} onChange={setDir} options={[{ v: "in", label: "Cash in" }, { v: "out", label: "Cash out" }]} />
        <div className="mt-4 space-y-4">
          <Field label="Amount"><AddonInput prefix="Rs." defaultValue="500.00" className="h-12 text-lg font-semibold" /></Field>
          <Field label="Reason"><Select options={dir === "out" ? ["Petty cash — supplies", "Staff meals", "Delivery / transport", "Bank deposit", "Other"] : ["Change from bank", "Owner top-up", "Other"]} /></Field>
          <Field label="Note"><Textarea placeholder="Optional" className="min-h-[72px]" /></Field>
        </div>
      </Modal>
    </>
  );
}

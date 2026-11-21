"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, CreditCard, FileSpreadsheet, Gift, Plus, QrCode, ScanBarcode, Wallet, X, Rocket } from "lucide-react";
import { Arcs, Logo, RakshaMask } from "@/components/brand";
import { LangSwitch } from "@/components/shell";
import { AddonInput, Button, Field, Input, Select, Steps, Textarea, Toggle } from "@/components/ui";
import { cn } from "@/lib/format";

const STEPS = ["Business", "Branch", "Products", "Payments", "Staff", "Done"];

export default function Onboarding() {
  const [s, setS] = useState(0);
  const [pm, setPm] = useState({ Cash: true, Card: true, LankaQR: true, Credit: false, "Gift Card": false });
  const [invites, setInvites] = useState([{ n: "Dilani Fernando", p: "71 552 1934", r: "Manager" }, { n: "Kasun Jayasuriya", p: "76 420 8812", r: "Cashier" }]);
  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-900">
      <Arcs className="bottom-0 left-0 aspect-square w-[46%] min-w-[420px]" />
      <svg className="absolute -right-20 -top-20 h-[360px] w-[360px]" viewBox="0 0 400 400" aria-hidden><circle cx="200" cy="200" r="190" fill="none" stroke="#B9DDF7" strokeOpacity=".15" strokeWidth="2" /><circle cx="200" cy="200" r="140" fill="none" stroke="#FFA940" strokeOpacity=".25" strokeWidth="2" /></svg>
      <header className="relative flex items-center justify-between px-6 py-5"><span className="rounded-ctl bg-white px-3 py-2"><Logo className="w-[130px]" pos /></span><LangSwitch dark /></header>
      <main className="relative mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-modal bg-surface p-6 shadow-lift sm:p-10">
          {s < 5 && <div className="mb-8"><Steps steps={STEPS} current={s} /></div>}
          {s === 0 && (
            <>
              <h1 className="font-heading text-2xl font-semibold">Welcome! Let&apos;s set up your business</h1>
              <p className="mt-1 text-fg2">This takes about 5 minutes. You can change everything later.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Business name" className="sm:col-span-2"><Input defaultValue="HeladiGi Mart (Pvt) Ltd" /></Field>
                <Field label="Business type"><Select options={["Supermarket / grocery", "Pharmacy", "Hardware store", "Café / restaurant", "Retail shop"]} /></Field>
                <Field label="Phone"><AddonInput prefix="+94" defaultValue="11 257 4410" /></Field>
                <Field label="BR number"><Input defaultValue="PV 00245781" /></Field>
                <Field label="VAT number (optional)"><Input defaultValue="114567890-7000" /></Field>
              </div>
            </>
          )}
          {s === 1 && (
            <>
              <h1 className="font-heading text-2xl font-semibold">Add your first branch</h1>
              <p className="mt-1 text-fg2">Where will you be selling? You can add more branches later.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Branch name"><Input defaultValue="Colombo 03" /></Field>
                <Field label="Opening hours"><Input defaultValue="07:30 – 21:30" /></Field>
                <Field label="Address" className="sm:col-span-2"><Textarea defaultValue="No. 214, Galle Road, Colombo 03" className="min-h-[72px]" /></Field>
                <Field label="Number of tills"><Select options={["1", "2", "3", "4", "5+"]} defaultValue="4" /></Field>
              </div>
            </>
          )}
          {s === 2 && (
            <>
              <h1 className="font-heading text-2xl font-semibold">Add your products</h1>
              <p className="mt-1 text-fg2">Import from a spreadsheet, scan as you go, or start with a sample catalogue.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[[FileSpreadsheet, "Import CSV / Excel", "Use our template or your supplier's list"], [ScanBarcode, "Scan to add", "Scan barcodes — we fill in known Sri Lankan products"], [Rocket, "Start with samples", "120 common supermarket items to edit"]].map(([I, t, d], i) => { const Ic = I as typeof Plus; return (
                  <button key={t as string} className={cn("card p-5 text-left transition hover:border-orange-500/60", i === 0 && "border-orange-500 ring-4 ring-orange-500/15")}><span className="grid h-12 w-12 place-items-center rounded-card bg-orange-100 text-navy-900"><Ic size={22} /></span><p className="mt-4 font-semibold">{t as string}</p><p className="text-sm text-fg2">{d as string}</p></button>
                ); })}
              </div>
            </>
          )}
          {s === 3 && (
            <>
              <h1 className="font-heading text-2xl font-semibold">How do customers pay you?</h1>
              <p className="mt-1 text-fg2">Turn on the methods you accept.</p>
              <ul className="mt-6 divide-y divide-line rounded-card border border-line">
                {([["Cash", Banknote], ["Card", CreditCard], ["LankaQR", QrCode], ["Credit", Wallet], ["Gift Card", Gift]] as [keyof typeof pm, typeof Plus][]).map(([n, I]) => (
                  <li key={n} className="flex items-center gap-3 px-4 py-3"><span className="grid h-10 w-10 place-items-center rounded-ctl bg-tint"><I size={20} /></span><span className="flex-1 font-semibold">{n}</span><Toggle checked={pm[n]} onChange={(v) => setPm({ ...pm, [n]: v })} /></li>
                ))}
              </ul>
            </>
          )}
          {s === 4 && (
            <>
              <h1 className="font-heading text-2xl font-semibold">Invite your team</h1>
              <p className="mt-1 text-fg2">They&apos;ll get an SMS with a link to set their PIN.</p>
              <div className="mt-6 space-y-2">
                {invites.map((v, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_140px_auto] gap-2">
                    <Input defaultValue={v.n} aria-label="Name" /><AddonInput prefix="+94" defaultValue={v.p} aria-label="Mobile" /><Select options={["Manager", "Cashier", "Stock Keeper", "Accountant"]} defaultValue={v.r} aria-label="Role" />
                    <button aria-label="Remove" onClick={() => setInvites(invites.filter((_, j) => j !== i))} className="grid h-11 w-11 place-items-center rounded-ctl text-fg2 hover:text-danger"><X size={18} /></button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" icon={Plus} className="mt-2" onClick={() => setInvites([...invites, { n: "", p: "", r: "Cashier" }])}>Add another</Button>
            </>
          )}
          {s === 5 && (
            <div className="relative py-6 text-center">
              {Array.from({ length: 18 }).map((_, i) => <span key={i} className="absolute h-2.5 w-2.5 animate-pop rounded-sm" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, background: ["#FF7A00", "#FFA940", "#B9DDF7", "#0B1E4F"][i % 4], transform: `rotate(${i * 25}deg)`, animationDelay: `${i * 40}ms` }} />)}
              <RakshaMask tone="navy" className="relative mx-auto h-48 dark:invert" />
              <h1 className="relative mt-4 font-heading text-[32px] font-bold">You&apos;re all set, Craze!</h1>
              <p className="relative mx-auto mt-2 max-w-md text-fg2">HeladiGi Mart is ready to sell. Your team invites are on the way.</p>
              <Link href="/pos" className="btn btn-pos btn-primary relative mt-8 px-10">Start Selling<ArrowRight size={20} /></Link>
              <p className="relative mt-4"><Link href="/dashboard" className="text-sm font-semibold text-fg2 hover:text-fg">Go to dashboard</Link></p>
            </div>
          )}
          {s < 5 && (
            <div className="mt-10 flex items-center justify-between">
              <Button size="l" variant="ghost" icon={ArrowLeft} disabled={!s} onClick={() => setS(s - 1)}>Back</Button>
              <div className="flex gap-2">{s >= 2 && <Button size="l" variant="ghost" onClick={() => setS(s + 1)}>Skip</Button>}<Button size="l" variant="primary" iconRight={ArrowRight} onClick={() => setS(s + 1)}>{s === 4 ? "Send invites & finish" : "Continue"}</Button></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

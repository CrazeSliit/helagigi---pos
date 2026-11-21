"use client";
import { BookOpen, Boxes, CreditCard, Keyboard, Mail, MessageCircle, Phone, PlayCircle, ScanBarcode, Settings, Users, Wallet } from "lucide-react";
import { Card, SearchInput } from "@/components/ui";
import { RakshaMask } from "@/components/brand";

const cats = [[ScanBarcode, "Selling at the POS", 24], [Boxes, "Products & stock", 31], [Wallet, "Shifts & cash", 12], [CreditCard, "Payments & LankaQR", 9], [Users, "Customers & loyalty", 15], [Settings, "Setup & hardware", 18]] as const;
const keys = [["F1", "Search products"], ["F2", "Select customer"], ["F4", "Hold sale"], ["F8", "Discount"], ["F12", "Charge / pay"], ["Esc", "Cancel / close"], ["Ctrl K", "Command palette"], ["Ctrl L", "Lock screen"]];

export default function Help() {
  return (
    <>
      <div className="relative mb-8 overflow-hidden rounded-card bg-navy-900 px-6 py-10 text-white sm:px-10">
        <RakshaMask className="absolute -bottom-6 right-4 h-56 opacity-40" />
        <h1 className="relative font-heading text-2xl font-semibold text-white sm:text-[32px]">How can we help?</h1>
        <p className="relative mt-1 text-white/70">Guides in English, සිංහල and தமிழ்</p>
        <SearchInput placeholder="e.g. How do I refund a card payment?" className="relative mt-6 h-14 max-w-xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map(([I, t, n]) => (
              <button key={t} className="card flex items-center gap-4 p-5 text-left transition hover:border-orange-500/50 hover:shadow-lift"><span className="grid h-12 w-12 place-items-center rounded-card bg-tint"><I size={22} /></span><span><span className="block font-semibold">{t}</span><span className="text-cap text-fg2">{n} articles</span></span></button>
            ))}
          </div>
          <Card title="Video tutorials">
            <div className="grid gap-4 sm:grid-cols-3">
              {[["Your first sale in 60 seconds", "1:04"], ["Opening & closing a shift", "3:22"], ["Receiving stock with a GRN", "4:10"]].map(([t, d]) => (
                <button key={t} className="group text-left"><span className="relative grid aspect-video place-items-center overflow-hidden rounded-card bg-navy-900"><span className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-navy-700" /><PlayCircle size={40} className="relative text-orange-500 transition group-hover:scale-110" /><span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 text-[11px] font-semibold text-white">{d}</span></span><span className="mt-2 block text-sm font-semibold">{t}</span></button>
              ))}
            </div>
          </Card>
          <Card title="Popular articles"><ul className="divide-y divide-line">{["Setting up LankaQR payments", "Printing barcode labels for loose items", "What to do when a terminal goes offline", "Giving manager approval with a PIN", "Filing VAT with the tax report"].map((a) => <li key={a}><button className="flex h-12 w-full items-center gap-3 text-left text-sm font-medium hover:text-orange-600"><BookOpen size={16} className="text-fg2" />{a}</button></li>)}</ul></Card>
        </div>
        <div className="space-y-6">
          <Card title="Keyboard shortcuts" action={<Keyboard size={18} className="text-fg2" />}>
            <ul className="space-y-2">{keys.map(([k, l]) => <li key={k} className="flex items-center justify-between text-sm"><span className="text-fg2">{l}</span><kbd className="min-w-[44px] rounded-lg border border-line bg-surface-2 px-2 py-1 text-center font-mono text-cap font-semibold shadow-[0_2px_0_rgb(var(--border))]">{k}</kbd></li>)}</ul>
          </Card>
          <Card title="Contact HeladiGi Support" sub="Every day 7:00 am – 10:00 pm">
            <div className="space-y-2">
              <a href="https://wa.me/94771234567" className="flex h-14 items-center gap-3 rounded-ctl bg-green-700 px-4 font-semibold text-white hover:bg-green-800"><MessageCircle size={20} />WhatsApp us · +94 77 123 4567</a>
              <a href="tel:+94112574410" className="btn btn-l btn-outline w-full justify-start"><Phone size={18} />Call · +94 11 257 4410</a>
              <a href="mailto:support@heladigi.lk" className="btn btn-l btn-outline w-full justify-start"><Mail size={18} />support@heladigi.lk</a>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

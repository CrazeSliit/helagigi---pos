"use client";
import Link from "next/link";
import { MapPin, Monitor, Phone, Plus, User } from "lucide-react";
import { PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { branches } from "@/lib/data";
import { rs } from "@/lib/format";

export default function Branches() {
  return (
    <>
      <PageHeader title="Branches" sub="3 branches · 9 terminals" actions={<Link href="/branches/new" className="btn btn-m btn-primary"><Plus size={18} />Add branch</Link>} />
      <SubNav module="branches" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => (
          <Link key={b.id} href="/branches/new" className="card group overflow-hidden transition hover:shadow-lift">
            <div className="relative h-28 bg-navy-900">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 112" preserveAspectRatio="none" aria-hidden><circle cx="360" cy="140" r="120" fill="#1A3170" /><path d="M240 140 A120 120 0 0 1 360 20" stroke="#FF7A00" strokeWidth="6" fill="none" /></svg>
              <div className="absolute bottom-4 left-5 text-white"><p className="font-heading text-xl font-semibold">{b.name}</p><p className="text-cap text-white/70">Today {rs(b.today, { decimals: false })}</p></div>
              <span className="absolute right-4 top-4"><Status s={b.status === "online" ? "Online" : "Syncing"} /></span>
            </div>
            <ul className="space-y-2.5 p-5 text-sm">
              <li className="flex items-start gap-2.5 text-fg2"><MapPin size={16} className="mt-0.5 shrink-0" />{b.address}</li>
              <li className="flex items-center gap-2.5 text-fg2"><User size={16} />{b.manager}</li>
              <li className="flex items-center gap-2.5 text-fg2"><Phone size={16} />{b.phone}</li>
              <li className="flex items-center gap-2.5 text-fg2"><Monitor size={16} />{b.terminals} terminals</li>
            </ul>
          </Link>
        ))}
      </div>
    </>
  );
}

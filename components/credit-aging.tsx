"use client";
import { MessageCircle, MessageSquare, HandCoins } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { DataTable } from "@/components/table";
import { customers } from "@/lib/data";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";

export function CreditAging() {
  const { toast } = useApp();
  const rows = customers.filter((c) => c.credit > 0).map((c, i) => {
    const b = [[c.credit, 0, 0, 0], [c.credit * 0.4, c.credit * 0.6, 0, 0], [c.credit * 0.3, c.credit * 0.3, c.credit * 0.25, c.credit * 0.15], [0, 0, c.credit, 0], [c.credit * 0.5, 0, 0, c.credit * 0.5]][i % 5];
    return { ...c, b };
  });
  const tot = [0, 1, 2, 3].map((i) => rows.reduce((s, r) => s + r.b[i], 0));
  const labels = ["0–30 days", "31–60 days", "61–90 days", "90+ days"];
  const tones = ["bg-success/10 text-success", "bg-warning/15 text-[#8A6500] dark:text-warning", "bg-orange-100 text-navy-900", "bg-danger/10 text-danger"];
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {labels.map((l, i) => <div key={l} className="card p-5"><span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-cap font-semibold", tones[i])}>{l}</span><p className="mt-3 font-heading text-xl font-semibold tnum">{rs(tot[i], { decimals: false })}</p></div>)}
      </div>
      <DataTable rows={rows} selectable bulk={[{ label: "Send reminders", icon: MessageCircle }]} rowActions={[{ label: "Receive payment", icon: HandCoins }, { label: "SMS reminder", icon: MessageSquare, onClick: (r) => toast({ tone: "success", title: `Reminder sent to ${r.name}` }) }, { label: "WhatsApp reminder", icon: MessageCircle }]} cols={[
        { key: "name", label: "Customer", render: (c) => <span className="flex items-center gap-3"><Avatar name={c.name} size={32} color="#1A3170" /><span><span className="block font-semibold">{c.name}</span><span className="text-cap text-fg2">{c.phone}</span></span></span> },
        ...labels.map((l, i) => ({ key: "b" + i, label: l, align: "right" as const, render: (c: (typeof rows)[number]) => <span className={cn(c.b[i] ? (i === 3 ? "font-semibold text-danger" : "font-semibold") : "text-muted")}>{c.b[i] ? rs(c.b[i], { decimals: false }) : "—"}</span> })),
        { key: "credit", label: "Total due", align: "right", render: (c) => <span className="font-heading font-semibold">{rs(c.credit)}</span>, sort: (c) => c.credit },
        { key: "act", label: "", render: (c) => <Button size="s" icon={MessageCircle} onClick={(e) => { e.stopPropagation(); toast({ tone: "success", title: `WhatsApp reminder sent`, body: c.name }); }}>Remind</Button> },
      ]} />
    </>
  );
}


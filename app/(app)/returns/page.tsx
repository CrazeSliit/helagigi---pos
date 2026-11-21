"use client";
import Link from "next/link";
import { Plus, ArrowLeftRight } from "lucide-react";
import { PageHeader, StatCard, Badge } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { rs } from "@/lib/format";
import { Undo2, Wallet, PackageX } from "lucide-react";

const rows = [
  { id: "RET-C03-00214", inv: "INV-C03-018431", cust: "Nimal Perera", amt: 1_150, reason: "Damaged", method: "Cash", by: "Dilani F.", date: "21/11/2026 15:12" },
  { id: "RET-C03-00213", inv: "INV-C03-018377", cust: "Walk-in Customer", amt: 420, reason: "Expired", method: "Original payment", by: "Kasun J.", date: "21/11/2026 11:40" },
  { id: "RET-KDY-00098", inv: "INV-KDY-009812", cust: "Fathima Rizwan", amt: 2_890, reason: "Wrong item", method: "Exchange", by: "Ruwan B.", date: "20/11/2026 17:05" },
  { id: "RET-C03-00212", inv: "INV-C03-018102", cust: "Kavindu Silva", amt: 560, reason: "Customer changed mind", method: "Store credit", by: "Sachini P.", date: "20/11/2026 13:22" },
  { id: "RET-KUR-00041", inv: "INV-KUR-004470", cust: "Sanduni Rathnayake", amt: 1_060, reason: "Damaged", method: "Original payment", by: "Ishara W.", date: "19/11/2026 10:18" },
  { id: "RET-C03-00211", inv: "INV-C03-017990", cust: "Chaminda Herath", amt: 790, reason: "Expired", method: "Cash", by: "Dilani F.", date: "18/11/2026 16:47" },
];

export default function Returns() {
  return (
    <>
      <PageHeader title="Returns & exchanges" sub="Refunds, exchanges and store credit" actions={<><Link href="/returns/exchange" className="btn btn-m btn-outline"><ArrowLeftRight size={18} />Exchange</Link><Link href="/returns/new" className="btn btn-m btn-primary"><Plus size={18} />New return</Link></>} />
      <SubNav module="returns" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Refunded this week" value={rs(18_460)} delta={-6.2} invert icon={Undo2} foot="vs last week" />
        <StatCard label="Store credit issued" value={rs(4_210)} delta={12} icon={Wallet} foot="vs last week" />
        <StatCard label="Damaged / expired" value="23 items" delta={-14} invert icon={PackageX} foot="vs last week" />
      </div>
      <FilterBar placeholder="Search return # or invoice…" filters={[{ label: "All reasons", options: ["Damaged", "Wrong item", "Expired", "Customer changed mind"] }, { label: "All methods", options: ["Cash", "Original payment", "Store credit", "Exchange"] }]} />
      <DataTable rows={rows} total={rows.length} cols={[
        { key: "id", label: "Return #", render: (r) => <span className="font-semibold">{r.id}</span> },
        { key: "inv", label: "Original invoice", render: (r) => <span className="text-fg2">{r.inv}</span> },
        { key: "cust", label: "Customer" },
        { key: "amt", label: "Refund", align: "right", render: (r) => <span className="font-semibold">{rs(r.amt)}</span>, sort: (r) => r.amt },
        { key: "reason", label: "Reason", render: (r) => <Badge tone={r.reason === "Damaged" || r.reason === "Expired" ? "orange" : "gray"}>{r.reason}</Badge> },
        { key: "method", label: "Method", render: (r) => <span className="text-fg2">{r.method}</span> },
        { key: "by", label: "Processed by" },
        { key: "date", label: "Date", render: (r) => <span className="text-fg2">{r.date}</span> },
      ]} />
    </>
  );
}

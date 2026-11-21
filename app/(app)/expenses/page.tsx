"use client";
import Link from "next/link";
import { Paperclip, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { expenseCats } from "@/lib/data";
import { rs } from "@/lib/format";

const rows = [
  ["21/11/2026", "Utilities – CEB/Water", "CEB electricity bill — October", 48_620, "Dilani F.", "Bank transfer", true, "Colombo 03"],
  ["20/11/2026", "Transport", "Three-wheeler deliveries (week 47)", 6_400, "Kasun J.", "Cash", true, "Colombo 03"],
  ["20/11/2026", "Maintenance", "Freezer compressor repair — Kandy", 18_500, "Ruwan B.", "Cash", true, "Kandy"],
  ["18/11/2026", "Marketing", "Facebook ads — Avurudu promo", 12_000, "Craze W.", "Card", false, "All branches"],
  ["15/11/2026", "Utilities – CEB/Water", "NWSDB water bill", 3_840, "Ishara W.", "Bank transfer", true, "Kurunegala"],
  ["10/11/2026", "Rent", "Shop rent — November", 185_000, "Craze W.", "Cheque", true, "Colombo 03"],
  ["05/11/2026", "Other", "Tea, sugar & staff refreshments", 2_350, "Kasun J.", "Cash", false, "Colombo 03"],
  ["01/11/2026", "Salaries", "Staff salaries — October", 642_000, "Ishara W.", "Bank transfer", false, "All branches"],
].map((r, i) => ({ id: i, date: r[0] as string, cat: r[1] as string, desc: r[2] as string, amt: r[3] as number, by: r[4] as string, method: r[5] as string, att: r[6] as boolean, br: r[7] as string }));

export default function Expenses() {
  return (
    <>
      <PageHeader title="Expenses" sub={`November 2026 · ${rs(rows.reduce((s, r) => s + r.amt, 0), { decimals: false })}`} actions={<Link href="/expenses/new" className="btn btn-m btn-primary"><Plus size={18} />Add expense</Link>} />
      <SubNav module="expenses" />
      <FilterBar placeholder="Search description…" filters={[{ label: "All categories", options: expenseCats }, { label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }]} />
      <DataTable rows={rows} rowActions={[{ label: "Edit", icon: Pencil }, { label: "Delete", icon: Trash2, danger: true }]} cols={[
        { key: "date", label: "Date", render: (r) => <span className="text-fg2">{r.date}</span> },
        { key: "cat", label: "Category", render: (r) => <Badge tone={r.cat.startsWith("Util") ? "sky" : r.cat === "Rent" || r.cat === "Salaries" ? "navy" : "orange"}>{r.cat}</Badge> },
        { key: "desc", label: "Description", render: (r) => <span className="font-medium">{r.desc}</span> },
        { key: "amt", label: "Amount", align: "right", render: (r) => <span className="font-semibold">{rs(r.amt)}</span>, sort: (r) => r.amt },
        { key: "by", label: "Paid by" },
        { key: "method", label: "Method", render: (r) => <span className="text-fg2">{r.method}</span> },
        { key: "att", label: "Receipt", align: "center", render: (r) => r.att ? <Paperclip size={16} className="mx-auto text-fg" aria-label="Receipt attached" /> : <span className="text-muted">—</span> },
        { key: "br", label: "Branch", render: (r) => <span className="text-fg2">{r.br}</span> },
      ]} />
    </>
  );
}

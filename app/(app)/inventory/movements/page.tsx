"use client";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { PageHeader, Badge } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { cn } from "@/lib/format";

const types = [["Sale", -2, "INV-C03-018453"], ["GRN", 48, "GRN-C03-00311"], ["Sale", -1, "INV-C03-018449"], ["Return", 1, "RET-C03-00214"], ["Transfer out", -24, "TRF-00142"], ["Adjustment", -3, "ADJ-C03-00087"], ["Sale", -4, "INV-C03-018440"], ["Stock take", 2, "SC-C03-0018"], ["Sale", -1, "INV-C03-018436"], ["GRN", 60, "GRN-C03-00309"]] as const;
const rows = types.map(([t, q, ref], i) => ({ id: i, date: `21/11/2026 ${String(15 - i).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}`, prod: "Anchor Milk Powder 400g", type: t, qty: q, ref, bal: 84 + types.slice(0, i).reduce((s, x) => s - x[1], 0), user: ["Kasun J.", "Nuwan E.", "Sachini P.", "Dilani F."][i % 4], branch: "Colombo 03" }));

export default function Movements() {
  return (
    <>
      <PageHeader title="Stock movement history" sub="Full ledger of every stock in and out" />
      <SubNav module="inventory" />
      <FilterBar placeholder="Product, SKU or reference…" filters={[{ label: "All movement types", options: ["Sale", "GRN", "Return", "Transfer in", "Transfer out", "Adjustment", "Stock take"] }, { label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }]} />
      <DataTable rows={rows} total={18_240} cols={[
        { key: "date", label: "Date / time", render: (r) => <span className="text-fg2">{r.date}</span> },
        { key: "prod", label: "Product", render: (r) => <span className="font-semibold">{r.prod}</span> },
        { key: "type", label: "Type", render: (r) => <Badge tone={r.qty > 0 ? "sky" : "gray"}>{r.type}</Badge> },
        { key: "ref", label: "Reference", render: (r) => <span className="font-mono text-cap">{r.ref}</span> },
        { key: "qty", label: "In / Out", align: "right", render: (r) => <span className={cn("inline-flex items-center gap-1 font-semibold", r.qty > 0 ? "text-success" : "text-danger")}>{r.qty > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}{r.qty > 0 ? `+${r.qty}` : r.qty}</span> },
        { key: "bal", label: "Balance", align: "right", render: (r) => <span className="font-semibold">{r.bal}</span> },
        { key: "user", label: "User" },
        { key: "branch", label: "Branch", render: (r) => <span className="text-fg2">{r.branch}</span> },
      ]} />
    </>
  );
}

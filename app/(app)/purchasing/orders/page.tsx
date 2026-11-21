"use client";
import Link from "next/link";
import { Plus, PackageCheck, Pencil, Send, Ban } from "lucide-react";
import { PageHeader, Status, Tabs } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { suppliers } from "@/lib/data";
import { rs } from "@/lib/format";
import { useState } from "react";

const st = ["Draft", "Sent", "Partially Received", "Received", "Received", "Cancelled", "Sent", "Received"];
const rows = Array.from({ length: 12 }, (_, i) => ({ id: `PO-C03-00${420 - i}`, sup: suppliers[i % suppliers.length].name, date: `${21 - i}/11/2026`, exp: `${24 - i}/11/2026`, total: 40_000 + ((i * 37_310) % 180_000), status: st[i % st.length], branch: ["Colombo 03", "Kandy", "Kurunegala"][i % 3] }));

export default function POs() {
  const [tab, setTab] = useState("All");
  const shown = tab === "All" ? rows : rows.filter((r) => r.status === tab);
  return (
    <>
      <PageHeader title="Purchase orders" actions={<Link href="/purchasing/orders/new" className="btn btn-m btn-primary"><Plus size={18} />Create PO</Link>} />
      <SubNav module="purchasing" />
      <Tabs variant="pill" className="mb-4" value={tab} onChange={setTab} tabs={["All", "Draft", "Sent", "Partially Received", "Received", "Cancelled"].map((v) => ({ v, label: v, count: v === "All" ? rows.length : rows.filter((r) => r.status === v).length }))} />
      <FilterBar placeholder="Search PO # or supplier…" filters={[{ label: "All suppliers", options: suppliers.map((s) => s.name) }, { label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }]} />
      <DataTable rows={shown} rowActions={[{ label: "Receive (GRN)", icon: PackageCheck }, { label: "Edit", icon: Pencil }, { label: "Resend", icon: Send }, { label: "Cancel", icon: Ban, danger: true }]} cols={[
        { key: "id", label: "PO #", render: (r) => <Link href="/purchasing/grn" className="font-semibold hover:underline">{r.id}</Link> },
        { key: "sup", label: "Supplier" },
        { key: "branch", label: "Branch", render: (r) => <span className="text-fg2">{r.branch}</span> },
        { key: "date", label: "Order date", render: (r) => <span className="text-fg2">{r.date}</span> },
        { key: "exp", label: "Expected", render: (r) => <span className="text-fg2">{r.exp}</span> },
        { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{rs(r.total)}</span>, sort: (r) => r.total },
        { key: "status", label: "Status", render: (r) => <Status s={r.status} /> },
      ]} />
    </>
  );
}

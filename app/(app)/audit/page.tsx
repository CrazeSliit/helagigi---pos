"use client";
import { ArrowRight } from "lucide-react";
import { Avatar, Badge, PageHeader } from "@/components/ui";
import { DataTable, FilterBar } from "@/components/table";
import { staff } from "@/lib/data";

const raw: [string, string, string, string, string, string, string][] = [
  ["21/11/2026 15:12", "Dilani Fernando", "Refund processed", "INV-C03-018431", "Rs. 0.00", "Rs. 1,150.00", "C03 · T1"],
  ["21/11/2026 14:58", "Kasun Jayasuriya", "Discount override", "INV-C03-018448 (approved by Dilani F.)", "10%", "15%", "C03 · T1"],
  ["21/11/2026 14:31", "Kasun Jayasuriya", "Sale voided", "INV-C03-018431", "Completed", "Voided", "C03 · T1"],
  ["21/11/2026 13:02", "Dilani Fernando", "Price changed", "Kotmale Fresh Milk 1L", "Rs. 600.00", "Rs. 620.00", "Back office"],
  ["21/11/2026 11:45", "Nuwan Ekanayake", "Stock adjusted", "Highland Set Yoghurt 80g · Damage", "220", "214", "KUR · Back office"],
  ["21/11/2026 09:02", "Ishara Wijesinghe", "Login", "Back office (Chrome · Windows)", "—", "—", "KUR · 112.135.64.21"],
  ["21/11/2026 08:12", "Craze Weligepola", "Login", "Owner (Safari · iPhone)", "—", "—", "Mobile · 175.157.42.8"],
  ["20/11/2026 21:58", "Tharushi Silva", "Shift closed", "Z-Report #0320", "Expected Rs. 142,600", "Counted Rs. 142,600", "KDY · T2"],
  ["20/11/2026 17:20", "Craze Weligepola", "Permission changed", "Cashier · Give discounts above 10%", "Allowed", "Blocked", "Back office"],
];
const rows = raw.map((r, i) => ({ id: i, ts: r[0], user: r[1], action: r[2], item: r[3], old: r[4], nw: r[5], term: r[6] }));
const tone = (a: string) => (["Sale voided", "Refund processed", "Discount override"].includes(a) ? "orange" : a === "Login" ? "gray" : a.includes("changed") ? "amber" : "sky") as "orange" | "gray" | "amber" | "sky";

export default function Audit() {
  return (
    <>
      <PageHeader title="Audit log" sub="Every sensitive action, who did it and from where" />
      <FilterBar placeholder="Search item, invoice or user…" filters={[{ label: "All users", options: staff.map((s) => s.name) }, { label: "All actions", options: ["Price changed", "Sale voided", "Discount override", "Stock adjusted", "Login", "Refund processed"] }, { label: "All terminals", options: ["C03 · T1", "C03 · T2", "KDY · T1", "Back office"] }]} />
      <DataTable rows={rows} total={24_118} cols={[
        { key: "ts", label: "Timestamp", render: (r) => <span className="text-fg2">{r.ts}</span> },
        { key: "user", label: "User", render: (r) => <span className="flex items-center gap-2"><Avatar name={r.user} size={28} color={staff.find((s) => s.name === r.user)?.color} /><span className="font-semibold">{r.user}</span></span> },
        { key: "action", label: "Action", render: (r) => <Badge tone={tone(r.action)}>{r.action}</Badge> },
        { key: "item", label: "Item affected", className: "max-w-[260px] truncate" },
        { key: "chg", label: "Old → New", render: (r) => r.old === "—" ? <span className="text-muted">—</span> : <span className="inline-flex items-center gap-2"><span className="text-fg2 line-through decoration-danger/60">{r.old}</span><ArrowRight size={13} className="text-fg2" /><span className="font-semibold">{r.nw}</span></span> },
        { key: "term", label: "Terminal / IP", render: (r) => <span className="font-mono text-cap text-fg2">{r.term}</span> },
      ]} />
    </>
  );
}

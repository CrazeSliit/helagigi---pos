"use client";
import { FileText } from "lucide-react";
import { Avatar, PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { staff } from "@/lib/data";
import { cn, rs } from "@/lib/format";

const rows = Array.from({ length: 12 }, (_, i) => {
  const s = staff[2 + (i % 4)];
  const v = [0, -1017, 0, 250, 0, -500, 0, 0, 120, 0, -2000, 0][i];
  return { id: i, who: s.name, color: s.color, br: s.branch, date: `${21 - Math.floor(i / 3)}/11/2026`, time: ["08:01 – 15:02", "15:05 – 22:00", "08:00 – 16:30"][i % 3], dur: ["6h 58m", "6h 55m", "8h 30m"][i % 3], sales: 280_000 + ((i * 41_310) % 160_000), v };
});

export default function ShiftHistory() {
  return (
    <>
      <PageHeader title="Shift history" />
      <SubNav module="register" />
      <FilterBar placeholder="Search cashier…" filters={[{ label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }, { label: "Any variance", options: ["Balanced", "Short", "Over"] }]} />
      <DataTable rows={rows} rowActions={[{ label: "View Z-Report", icon: FileText }]} cols={[
        { key: "who", label: "Cashier", render: (r) => <span className="flex items-center gap-2.5"><Avatar name={r.who} size={30} color={r.color} /><span className="font-semibold">{r.who}</span></span> },
        { key: "br", label: "Branch", render: (r) => <span className="text-fg2">{r.br}</span> },
        { key: "date", label: "Date", render: (r) => <span className="text-fg2">{r.date}</span> },
        { key: "time", label: "Time", render: (r) => <span className="text-fg2">{r.time}</span> },
        { key: "dur", label: "Duration" },
        { key: "sales", label: "Sales", align: "right", render: (r) => <span className="font-semibold">{rs(r.sales, { decimals: false })}</span>, sort: (r) => r.sales },
        { key: "v", label: "Variance", align: "right", render: (r) => <span className={cn("font-semibold", r.v < 0 ? "text-danger" : r.v > 0 ? "text-[#8A6500] dark:text-warning" : "text-success")}>{r.v === 0 ? rs(0) : `${r.v > 0 ? "+" : "−"} ${rs(Math.abs(r.v))}`}</span>, sort: (r) => r.v },
        { key: "s", label: "Result", render: (r) => <Status s={r.v === 0 ? "Balanced" : r.v < 0 ? "Short" : "Over"} /> },
      ]} />
    </>
  );
}

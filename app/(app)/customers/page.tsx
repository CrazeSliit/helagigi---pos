"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Avatar, Badge, PageHeader, Tabs } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { customers } from "@/lib/data";
import { rs } from "@/lib/format";

const tierTone = (t: string) => (t === "Platinum" ? "navy" : t === "Gold" ? "amber" : "gray") as "navy" | "amber" | "gray";

export default function Customers() {
  const router = useRouter();
  const [seg, setSeg] = useState("All");
  const rows = seg === "All" ? customers : seg === "With credit" ? customers.filter((c) => c.credit > 0) : seg === "VIP" ? customers.filter((c) => c.group === "VIP") : seg === "Wholesale" ? customers.filter((c) => c.group === "Wholesale") : customers.slice(0, 3);
  return (
    <>
      <PageHeader title="Customers" sub="3,842 customers · 1,204 loyalty members" actions={<Link href="/customers/new" className="btn btn-m btn-primary"><Plus size={18} />Add customer</Link>} />
      <SubNav module="customers" />
      <Tabs variant="pill" className="mb-4" value={seg} onChange={setSeg} tabs={["All", "VIP", "Wholesale", "With credit", "Birthdays this month", "Inactive 60+ days"].map((v) => ({ v, label: v }))} />
      <FilterBar placeholder="Search name, phone or email…" filters={[{ label: "All groups", options: ["Retail", "Wholesale", "VIP"] }, { label: "All tiers", options: ["Silver", "Gold", "Platinum"] }]} />
      <DataTable rows={rows} total={3842} onRow={() => router.push("/customers/profile")} selectable bulk={[{ label: "Send SMS / WhatsApp", icon: MessageCircle }, { label: "Change group", icon: Tag }, { label: "Delete", icon: Trash2, danger: true }]}
        rowActions={[{ label: "Edit", icon: Pencil }, { label: "Message", icon: MessageCircle }]}
        cols={[
          { key: "name", label: "Customer", render: (c) => <span className="flex items-center gap-3"><Avatar name={c.name} size={34} color="#1A3170" /><span className="font-semibold">{c.name}</span></span>, sort: (c) => c.name },
          { key: "phone", label: "Phone", render: (c) => <span className="text-fg2">{c.phone}</span> },
          { key: "group", label: "Group / tier", render: (c) => <span className="flex gap-1.5"><Badge tone="gray">{c.group}</Badge><Badge tone={tierTone(c.tier)}>{c.tier}</Badge></span> },
          { key: "spent", label: "Total spent", align: "right", render: (c) => <span className="font-semibold">{rs(c.spent, { decimals: false })}</span>, sort: (c) => c.spent },
          { key: "visits", label: "Visits", align: "right", sort: (c) => c.visits },
          { key: "points", label: "Points", align: "right", render: (c) => c.points.toLocaleString(), sort: (c) => c.points },
          { key: "credit", label: "Credit balance", align: "right", render: (c) => <span className={c.credit ? "font-semibold text-orange-600 dark:text-orange-500" : "text-fg2"}>{rs(c.credit, { decimals: false })}</span>, sort: (c) => c.credit },
          { key: "last", label: "Last visit", render: (c) => <span className="text-fg2">{c.last}</span> },
        ]} />
    </>
  );
}

"use client";
import Link from "next/link";
import { KeyRound, Pencil, Plus, UserX } from "lucide-react";
import { Avatar, Badge, PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { staff } from "@/lib/data";

export default function Staff() {
  return (
    <>
      <PageHeader title="Staff" sub={`${staff.length} people · 3 branches`} actions={<Link href="/staff/new" className="btn btn-m btn-primary"><Plus size={18} />Add staff</Link>} />
      <SubNav module="staff" />
      <FilterBar placeholder="Search name or phone…" filters={[{ label: "All roles", options: ["Owner", "Manager", "Cashier", "Stock Keeper", "Accountant"] }, { label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }]} />
      <DataTable rows={staff} rowActions={[{ label: "Edit", icon: Pencil }, { label: "Reset PIN", icon: KeyRound }, { label: "Deactivate", icon: UserX, danger: true }]} cols={[
        { key: "name", label: "Name", render: (s) => <span className="flex items-center gap-3"><Avatar name={s.name} size={36} color={s.color} /><span className="font-semibold">{s.name}</span></span>, sort: (s) => s.name },
        { key: "role", label: "Role", render: (s) => <Badge tone={s.role === "Owner" ? "orange" : s.role === "Manager" ? "navy" : "gray"}>{s.role}</Badge> },
        { key: "branch", label: "Branch", render: (s) => <span className="text-fg2">{s.branch}</span> },
        { key: "phone", label: "Phone", render: (s) => <span className="text-fg2">{s.phone}</span> },
        { key: "status", label: "Status", render: (s) => <Status s={s.status} /> },
        { key: "last", label: "Last login", render: (s) => <span className="text-fg2">{s.last}</span> },
      ]} />
    </>
  );
}

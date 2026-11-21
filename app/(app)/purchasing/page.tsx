"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, FileText, Wallet } from "lucide-react";
import { PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { suppliers } from "@/lib/data";
import { rs } from "@/lib/format";

export default function Suppliers() {
  const router = useRouter();
  return (
    <>
      <PageHeader title="Suppliers" sub={`${suppliers.length} suppliers · ${rs(suppliers.reduce((s, x) => s + x.outstanding, 0), { decimals: false })} payable`} actions={<Link href="/purchasing/supplier" className="btn btn-m btn-primary"><Plus size={18} />Add supplier</Link>} />
      <SubNav module="purchasing" />
      <FilterBar placeholder="Search supplier or contact…" filters={[{ label: "All statuses", options: ["Active", "On hold"] }]} />
      <DataTable rows={suppliers} onRow={() => router.push("/purchasing/supplier")}
        rowActions={[{ label: "Edit", icon: Pencil }, { label: "New PO", icon: FileText }, { label: "Record payment", icon: Wallet }]}
        cols={[
          { key: "name", label: "Supplier", render: (s) => <span className="font-semibold">{s.name}</span>, sort: (s) => s.name },
          { key: "contact", label: "Contact person" },
          { key: "phone", label: "Phone", render: (s) => <span className="text-fg2">{s.phone}</span> },
          { key: "email", label: "Email", render: (s) => <span className="text-fg2">{s.email}</span> },
          { key: "outstanding", label: "Outstanding", align: "right", render: (s) => <span className={s.outstanding ? "font-semibold text-orange-600 dark:text-orange-500" : "text-fg2"}>{rs(s.outstanding)}</span>, sort: (s) => s.outstanding },
          { key: "total", label: "Total purchases", align: "right", render: (s) => rs(s.total, { decimals: false }), sort: (s) => s.total },
          { key: "status", label: "Status", render: (s) => <Status s={s.status} /> },
        ]} />
    </>
  );
}

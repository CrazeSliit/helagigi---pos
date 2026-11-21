"use client";
import { Calendar, Download } from "lucide-react";
import { Avatar, Button, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";
import { staff } from "@/lib/data";
import { rs } from "@/lib/format";

export default function Commissions() {
  const rows = staff.filter((s) => s.sales !== undefined && s.sales > 0).map((s) => ({ ...s, month: s.sales! * 21.4, rate: 0.5 }));
  return (
    <>
      <PageHeader title="Commissions" sub="November 2026 (to date)" actions={<><Button icon={Calendar}>01/11/2026 – 21/11/2026</Button><Button icon={Download}>Export for payroll</Button></>} />
      <SubNav module="staff" />
      <DataTable rows={rows} cols={[
        { key: "name", label: "Staff", render: (s) => <span className="flex items-center gap-2.5"><Avatar name={s.name} size={32} color={s.color} /><span className="font-semibold">{s.name}</span></span> },
        { key: "branch", label: "Branch", render: (s) => <span className="text-fg2">{s.branch}</span> },
        { key: "month", label: "Sales", align: "right", render: (s) => rs(s.month, { decimals: false }), sort: (s) => s.month },
        { key: "rate", label: "Rate", align: "right", render: (s) => `${s.rate}%` },
        { key: "com", label: "Commission earned", align: "right", render: (s) => <span className="font-heading font-semibold text-orange-600 dark:text-orange-500">{rs((s.month * s.rate) / 100)}</span>, sort: (s) => s.month },
      ]} />
    </>
  );
}

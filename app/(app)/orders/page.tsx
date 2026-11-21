"use client";
import { useState } from "react";
import { OrderDetail } from "@/components/order-detail";
import { Ban, Calendar, Mail, Printer, Undo2, User, Lock, Receipt, Eye } from "lucide-react";
import { PageHeader, Status, Button, Avatar, Badge } from "@/components/ui";
import { DataTable, FilterBar } from "@/components/table";
import { Drawer } from "@/components/overlays";
import { Tooltip } from "@/components/overlays";
import { orders, products, type Order } from "@/lib/data";
import { rs, cn } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function Orders() {
  const [open, setOpen] = useState<Order | null>(null);
  return (
    <>
      <PageHeader title="Orders" sub="Every sale across your branches" actions={<Button icon={Calendar}>21/11/2026 – 21/11/2026</Button>} />
      <FilterBar placeholder="Search invoice, customer or phone…" filters={[{ label: "All statuses", options: ["Completed", "Refunded", "Partially Refunded", "Voided", "On Credit"] }, { label: "All payment methods", options: ["Cash", "Card", "LankaQR", "Credit", "Gift Card"] }, { label: "All cashiers", options: ["Kasun J.", "Sachini P.", "Mohamed I.", "Tharushi S."] }, { label: "All branches", options: ["Colombo 03", "Kandy", "Kurunegala"] }]} />
      <DataTable rows={orders} total={1248} onRow={setOpen} selectedId={open?.id} selectable bulk={[{ label: "Export", icon: Receipt }, { label: "Print receipts", icon: Printer }]}
        rowActions={[{ label: "View", icon: Eye, onClick: setOpen }, { label: "Reprint", icon: Printer }, { label: "Refund", icon: Undo2 }, { label: "Void", icon: Lock, danger: true }]}
        cols={[
          { key: "id", label: "Invoice #", render: (o) => <span className="font-semibold">{o.id}</span>, sort: (o) => o.id },
          { key: "date", label: "Date / time", render: (o) => <span className="text-fg2">{o.date} · {o.time}</span> },
          { key: "customer", label: "Customer" },
          { key: "cashier", label: "Cashier", render: (o) => <span className="text-fg2">{o.cashier}</span> },
          { key: "branch", label: "Branch", render: (o) => <span className="text-fg2">{o.branch}</span> },
          { key: "items", label: "Items", align: "right", sort: (o) => o.items },
          { key: "total", label: "Total", align: "right", render: (o) => <span className="font-semibold">{rs(o.total)}</span>, sort: (o) => o.total },
          { key: "method", label: "Payment", render: (o) => <span className="text-fg2">{o.method}</span> },
          { key: "status", label: "Status", render: (o) => <Status s={o.status} /> },
        ]} />
      <OrderDetail o={open} onClose={() => setOpen(null)} />
    </>
  );
}

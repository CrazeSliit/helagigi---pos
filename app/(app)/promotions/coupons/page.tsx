"use client";
import { useState } from "react";
import { Copy, Download, Sparkles } from "lucide-react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Progress, Segmented, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";

const rows = [
  { id: 1, code: "AVURUDU10", type: "10% off", limit: 2000, used: 1284, exp: "30/11/2026", s: "Active" },
  { id: 2, code: "WELCOME250", type: "Rs. 250 off", limit: 500, used: 211, exp: "31/12/2026", s: "Active" },
  { id: 3, code: "KDY-OPEN15", type: "15% off", limit: 300, used: 300, exp: "15/11/2026", s: "Expired" },
  { id: 4, code: "VIP-XMAS-*", type: "Rs. 1,000 off · 50 codes", limit: 50, used: 0, exp: "26/12/2026", s: "Scheduled" },
  { id: 5, code: "NEWYEAR25", type: "25% off", limit: 100, used: 100, exp: "05/01/2026", s: "Expired" },
];

export default function Coupons() {
  const [mode, setMode] = useState<"single" | "bulk">("bulk");
  return (
    <>
      <PageHeader title="Coupons" sub="Codes customers enter at checkout" />
      <SubNav module="promotions" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <DataTable rows={rows} rowActions={[{ label: "Copy code", icon: Copy }, { label: "Export codes", icon: Download }]} cols={[
          { key: "code", label: "Code", render: (r) => <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-sm font-semibold">{r.code}</span> },
          { key: "type", label: "Value" },
          { key: "used", label: "Redemptions", render: (r) => <div className="w-40"><div className="mb-1 flex justify-between text-cap"><span className="tnum">{r.used} / {r.limit}</span><span className="text-fg2">{Math.round((r.used / r.limit) * 100)}%</span></div><Progress value={(r.used / r.limit) * 100} tone={r.used >= r.limit ? "danger" : "orange"} /></div> },
          { key: "exp", label: "Expires", render: (r) => <span className="text-fg2">{r.exp}</span> },
          { key: "s", label: "Status", render: (r) => <Status s={r.s} /> },
        ]} />
        <Card title="Generate coupons" className="h-fit">
          <Segmented size="l" value={mode} onChange={setMode} options={[{ v: "single", label: "Single code" }, { v: "bulk", label: "Bulk codes" }]} />
          <div className="mt-4 space-y-4">
            {mode === "single" ? <Field label="Code"><div className="flex gap-2"><Input defaultValue="FATHIMA15" className="font-mono" /><Button icon={Sparkles} aria-label="Random code" /></div></Field> : <div className="grid grid-cols-2 gap-3"><Field label="Prefix"><Input defaultValue="VIP-XMAS-" className="font-mono" /></Field><Field label="How many"><Input defaultValue="50" inputMode="numeric" /></Field></div>}
            <Field label="Discount"><AddonInput prefix="Rs." defaultValue="1,000.00" /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Uses per code"><Input defaultValue="1" /></Field><Field label="Expiry"><Input type="date" defaultValue="2026-12-26" /></Field></div>
            <Button variant="primary" className="w-full" size="l">{mode === "bulk" ? "Generate 50 codes" : "Create coupon"}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

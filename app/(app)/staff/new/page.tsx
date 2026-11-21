"use client";
import { useState } from "react";
import { Camera } from "lucide-react";
import { AddonInput, Avatar, Button, Card, Checkbox, Field, Input, PageHeader, PasswordInput, Select } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { cn } from "@/lib/format";

export default function AddStaff() {
  const [role, setRole] = useState("Cashier");
  const [br, setBr] = useState(["Colombo 03"]);
  return (
    <>
      <PageHeader title="Add staff member" actions={<><Button>Cancel</Button><Button variant="primary">Save & send invite</Button></>} />
      <SubNav module="staff" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Personal info">
          <div className="mb-5 flex items-center gap-4"><Avatar name="Hasini Wickramaratne" size={64} color="#2563EB" /><Button icon={Camera} size="s">Upload photo</Button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required className="sm:col-span-2"><Input defaultValue="Hasini Wickramaratne" /></Field>
            <Field label="Mobile" required><AddonInput prefix="+94" defaultValue="71 404 5521" /></Field>
            <Field label="NIC"><Input defaultValue="200045601234" /></Field>
            <Field label="Email" className="sm:col-span-2"><Input type="email" defaultValue="hasini@heladigi.lk" /></Field>
          </div>
        </Card>
        <Card title="Login & POS access">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username"><Input defaultValue="hasini.w" /></Field>
            <Field label="Temporary password"><PasswordInput defaultValue="Welcome@2026" /></Field>
            <Field label="POS PIN" hint="4–6 digits, used for quick login & approvals"><Input defaultValue="••••" className="font-mono tracking-[.4em]" /></Field>
            <Field label="Confirm PIN"><Input defaultValue="••••" className="font-mono tracking-[.4em]" /></Field>
          </div>
        </Card>
        <Card title="Role & branches">
          <Field label="Role"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{["Owner", "Manager", "Cashier", "Stock Keeper", "Accountant"].map((r) => <button key={r} onClick={() => setRole(r)} aria-pressed={role === r} className={cn("h-12 rounded-ctl border text-sm font-semibold", role === r ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}>{r}</button>)}</div></Field>
          <Field label="Assigned branches" className="mt-4"><div className="flex flex-wrap gap-4">{["Colombo 03", "Kandy", "Kurunegala"].map((b) => <Checkbox key={b} checked={br.includes(b)} onChange={(v) => setBr(v ? [...br, b] : br.filter((x) => x !== b))} label={b} />)}</div></Field>
        </Card>
        <Card title="Pay">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hourly rate"><AddonInput prefix="Rs." defaultValue="450.00" /></Field>
            <Field label="Commission"><AddonInput suffix="% of sales" defaultValue="0.5" /></Field>
            <Field label="EPF number"><Input placeholder="Optional" /></Field>
            <Field label="Pay cycle"><Select options={["Monthly", "Weekly"]} /></Field>
          </div>
        </Card>
      </div>
    </>
  );
}

"use client";
import { Button, Card, Field, Input, PageHeader, Select, Textarea, Toggle, AddonInput } from "@/components/ui";
import { SubNav } from "@/components/shell";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function BranchForm() {
  return (
    <>
      <PageHeader title="Colombo 03" sub="Edit branch" actions={<><Button>Cancel</Button><Button variant="primary">Save branch</Button></>} />
      <SubNav module="branches" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Branch name" required><Input defaultValue="Colombo 03" /></Field>
            <Field label="Branch code"><Input defaultValue="C03" className="font-mono" /></Field>
            <Field label="Address" className="sm:col-span-2"><Textarea defaultValue="No. 214, Galle Road, Colombo 03" className="min-h-[72px]" /></Field>
            <Field label="Phone"><AddonInput prefix="+94" defaultValue="11 257 4410" /></Field>
            <Field label="Manager"><Select options={["Dilani Fernando", "Ruwan Bandara", "Ishara Wijesinghe"]} /></Field>
            <Field label="Default price list"><Select options={["Retail", "Wholesale"]} /></Field>
            <Field label="Stock source for online orders"><Select options={["This branch", "Nearest branch"]} /></Field>
          </div>
        </Card>
        <Card title="Operating hours">
          <ul className="space-y-2">
            {days.map((d, i) => (
              <li key={d} className="flex flex-wrap items-center gap-3">
                <span className="w-28 text-sm font-medium">{d}</span>
                <Toggle checked={i !== 6 || true} />
                <Input type="time" defaultValue={i === 6 ? "08:00" : "07:30"} className="h-10 w-32" />
                <span className="text-fg2">–</span>
                <Input type="time" defaultValue={i >= 5 ? "22:00" : "21:30"} className="h-10 w-32" />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Receipt header for this branch" className="xl:col-span-2">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Header line 1"><Input defaultValue="HeladiGi Mart — Colombo 03" /></Field>
              <Field label="Header line 2"><Input defaultValue="No. 214, Galle Road, Colombo 03" /></Field>
              <Field label="Phone on receipt"><Input defaultValue="Tel: +94 11 257 4410" /></Field>
              <Field label="VAT Reg. number"><Input defaultValue="114567890-7000" /></Field>
            </div>
            <div className="mx-auto w-[280px] bg-white p-4 text-center font-mono text-[11px] leading-[15px] text-black shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wordmark.png" alt="HeladiGi" className="mx-auto mb-2 w-[55%]" />
              <p className="font-bold">HeladiGi Mart — Colombo 03</p><p>No. 214, Galle Road, Colombo 03</p><p>Tel: +94 11 257 4410</p><p>VAT Reg: 114567890-7000</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

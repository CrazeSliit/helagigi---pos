"use client";
import { useState } from "react";
import { Camera, FileImage, X, Zap, Home, Users, Truck, Wrench, Megaphone, MoreHorizontal } from "lucide-react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { expenseCats } from "@/lib/data";
import { cn } from "@/lib/format";

const icons = [Home, Zap, Users, Truck, Wrench, Megaphone, MoreHorizontal];

export default function AddExpense() {
  const [cat, setCat] = useState(expenseCats[1]);
  return (
    <>
      <PageHeader title="Add expense" actions={<><Button>Cancel</Button><Button variant="primary">Save expense</Button></>} />
      <SubNav module="expenses" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="space-y-5">
            <Field label="Amount" required><AddonInput prefix="Rs." defaultValue="48,620.00" className="h-14 text-xl font-semibold" /></Field>
            <Field label="Category">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {expenseCats.map((c, i) => { const I = icons[i]; return <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={cn("flex h-16 flex-col items-center justify-center gap-1 rounded-ctl border px-2 text-center text-cap font-semibold", cat === c ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}><I size={18} />{c}</button>; })}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date"><Input type="date" defaultValue="2026-11-21" /></Field>
              <Field label="Payment method"><Select options={["Bank transfer", "Cash", "Card", "Cheque"]} /></Field>
              <Field label="Branch"><Select options={["Colombo 03", "Kandy", "Kurunegala", "All branches"]} /></Field>
            </div>
            <Field label="Description"><Input defaultValue="CEB electricity bill — October" /></Field>
            <Field label="Notes"><Textarea defaultValue="Account no. 4407 2213 09 · 2,840 units" className="min-h-[72px]" /></Field>
          </div>
        </Card>
        <Card title="Receipt photo">
          <div className="relative overflow-hidden rounded-card border border-line bg-surface-2">
            <div className="grid aspect-[3/4] place-items-center p-6 text-center"><span><FileImage size={36} className="mx-auto text-fg2" /><span className="mt-2 block text-sm font-semibold">CEB_bill_Oct.jpg</span><span className="text-cap text-fg2">1.2 MB</span></span></div>
            <button aria-label="Remove photo" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-surface shadow-soft"><X size={16} /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2"><Button icon={Camera}>Take photo</Button><Button icon={FileImage}>Upload</Button></div>
        </Card>
      </div>
    </>
  );
}

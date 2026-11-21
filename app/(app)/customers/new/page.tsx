"use client";
import { useState } from "react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";

export default function NewCustomer() {
  const [consent, setConsent] = useState(true);
  return (
    <>
      <PageHeader title="Add customer" actions={<><Button>Cancel</Button><Button variant="primary">Save customer</Button></>} />
      <SubNav module="customers" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Personal details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required className="sm:col-span-2"><Input defaultValue="Kavindu Silva" /></Field>
            <Field label="Mobile" required error="This number belongs to another customer (Kavindu S., KDY)"><AddonInput prefix="+94" defaultValue="76 330 7781" inputMode="tel" className="border-danger" /></Field>
            <Field label="Email"><Input type="email" defaultValue="kavindu.s@outlook.com" /></Field>
            <Field label="NIC" hint="Old (9 digits + V) or new 12-digit"><Input defaultValue="199823401234" /></Field>
            <Field label="Birthday" hint="For birthday offers"><Input type="date" defaultValue="1998-08-21" /></Field>
            <Field label="Address" className="sm:col-span-2"><Textarea defaultValue="No. 22/4, Temple Road, Maharagama" className="min-h-[72px]" /></Field>
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Account">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer group"><Select options={["Retail", "Wholesale", "VIP"]} /></Field>
              <Field label="Home branch"><Select options={["Colombo 03", "Kandy", "Kurunegala"]} /></Field>
              <Field label="Credit limit" hint="Set 0 to disable credit sales"><AddonInput prefix="Rs." defaultValue="10,000.00" /></Field>
              <Field label="Preferred language"><Select options={["English", "සිංහල", "தமிழ்"]} /></Field>
            </div>
          </Card>
          <Card title="Marketing">
            <Toggle checked={consent} onChange={setConsent} label="Customer agrees to receive offers by SMS / WhatsApp" />
            <p className="mt-2 text-cap text-fg2">Recorded with date and staff member for consent tracking.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

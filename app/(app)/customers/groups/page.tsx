"use client";
import { Crown, Plus, Store, Users } from "lucide-react";
import { Button, Card, PageHeader, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";

const groups = [
  { n: "Retail", d: "Default group for walk-in and registered shoppers", disc: "0%", price: "Retail price list", count: 3_612, i: Users, c: "bg-tint text-fg" },
  { n: "Wholesale", d: "Shops, hotels and bulk buyers — invoices on credit", disc: "5%", price: "Wholesale price list", count: 184, i: Store, c: "bg-sky-300/40 text-navy-900 dark:text-sky-300" },
  { n: "VIP", d: "Top customers — priority service and extra points", disc: "3%", price: "Retail price list", count: 46, i: Crown, c: "bg-orange-100 text-navy-900" },
];

export default function Groups() {
  return (
    <>
      <PageHeader title="Customer groups" sub="Default discounts and price lists per group" actions={<Button variant="primary" icon={Plus}>New group</Button>} />
      <SubNav module="customers" />
      <div className="grid gap-6 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.n}>
            <span className={`grid h-12 w-12 place-items-center rounded-card ${g.c}`}><g.i size={22} /></span>
            <h3 className="mt-4 font-heading text-lg font-semibold">{g.n}</h3>
            <p className="text-sm text-fg2">{g.d}</p>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-fg2">Default discount</dt><dd className="font-semibold">{g.disc}</dd></div>
              <div className="flex justify-between"><dt className="text-fg2">Price list</dt><dd className="font-semibold">{g.price}</dd></div>
              <div className="flex justify-between"><dt className="text-fg2">Customers</dt><dd className="font-semibold tnum">{g.count.toLocaleString()}</dd></div>
            </dl>
            <div className="mt-4 flex items-center justify-between"><Toggle checked={g.n !== "Retail"} label="Allow credit" /><Button size="s">Edit</Button></div>
          </Card>
        ))}
      </div>
    </>
  );
}

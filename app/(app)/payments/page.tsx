"use client";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, HandCoins, Truck } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { CreditAging } from "@/components/credit-aging";
import { suppliers } from "@/lib/data";
import { rs } from "@/lib/format";

export default function Payments() {
  return (
    <>
      <PageHeader title="Payments & credit" sub="What customers owe you and what you owe suppliers" actions={<><Link href="/purchasing/payments" className="btn btn-m btn-outline"><Truck size={18} />Pay a supplier</Link><Link href="/customers/profile" className="btn btn-m btn-primary"><HandCoins size={18} />Receive payment</Link></>} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Receivable (customers)" value={rs(308_100, { decimals: false })} delta={4.2} icon={ArrowDownLeft} foot="vs last month" />
        <StatCard label="Payable (suppliers)" value={rs(suppliers.reduce((s, x) => s + x.outstanding, 0), { decimals: false })} delta={-8.5} invert icon={ArrowUpRight} foot="vs last month" />
        <StatCard label="Collected this week" value={rs(86_450, { decimals: false })} delta={12.1} icon={HandCoins} foot="vs last week" />
      </div>
      <h2 className="h-section mb-3">Customer receivables by age</h2>
      <CreditAging />
      <Card title="Supplier payables" className="mt-6" pad={false}>
        <table className="tbl"><thead><tr><th>Supplier</th><th className="text-right">Outstanding</th><th>Next due</th></tr></thead>
          <tbody>{suppliers.filter((s) => s.outstanding).map((s, i) => <tr key={s.id}><td className="font-semibold">{s.name}</td><td className="text-right font-semibold">{rs(s.outstanding)}</td><td className="text-fg2">{["08/12/2026", "28/11/2026", "05/12/2026", "30/11/2026", "12/12/2026"][i % 5]}</td></tr>)}</tbody>
        </table>
      </Card>
    </>
  );
}

"use client";
import { Fragment, useState } from "react";
import { Plus, Lock } from "lucide-react";
import { Button, Card, Checkbox, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";

const ROLES = ["Owner", "Manager", "Cashier", "Stock Keeper", "Accountant"];
const GROUPS: { g: string; p: [string, boolean[]][] }[] = [
  { g: "Sales", p: [["Make sales", [true, true, true, false, false]], ["Give discounts up to 10%", [true, true, true, false, false]], ["Give discounts above 10%", [true, true, false, false, false]], ["Override prices", [true, true, false, false, false]], ["Void sales", [true, true, false, false, false]], ["Process refunds", [true, true, false, false, false]], ["Sell on credit", [true, true, true, false, false]]] },
  { g: "Products & stock", p: [["View cost price", [true, true, false, true, true]], ["Edit products", [true, true, false, true, false]], ["Adjust stock", [true, true, false, true, false]], ["Receive goods (GRN)", [true, true, false, true, false]], ["Transfer stock", [true, true, false, true, false]]] },
  { g: "Money", p: [["Open / close shift", [true, true, true, false, false]], ["Cash in / out", [true, true, true, false, false]], ["Approve variances", [true, true, false, false, false]], ["Record expenses", [true, true, false, false, true]], ["Pay suppliers", [true, false, false, false, true]]] },
  { g: "Insights & admin", p: [["View reports", [true, true, false, false, true]], ["Export data", [true, true, false, false, true]], ["Manage staff", [true, false, false, false, false]], ["Change settings", [true, false, false, false, false]], ["View audit log", [true, true, false, false, true]]] },
];

export default function Roles() {
  const [m, setM] = useState(GROUPS);
  const toggle = (gi: number, pi: number, ri: number) => setM(m.map((g, a) => (a !== gi ? g : { ...g, p: g.p.map((p, b) => (b !== pi ? p : [p[0], p[1].map((v, c) => (c === ri ? !v : v))] as [string, boolean[]])) })));
  return (
    <>
      <PageHeader title="Roles & permissions" sub="What each role can do across HeladiGi POS" actions={<><Button icon={Plus}>New role</Button><Button variant="primary">Save permissions</Button></>} />
      <SubNav module="staff" />
      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead className="sticky top-0"><tr><th className="min-w-[260px]">Permission</th>{ROLES.map((r) => <th key={r} className="text-center">{r}<span className="block text-[10px] font-medium normal-case text-fg2">{{ Owner: 1, Manager: 2, Cashier: 5, "Stock Keeper": 1, Accountant: 1 }[r]} people</span></th>)}</tr></thead>
            <tbody>
              {m.map((g, gi) => (
                <Fragment key={g.g}>
                  <tr className="hover:bg-transparent"><td colSpan={6} className="h-10 bg-tint font-heading text-cap font-semibold uppercase tracking-wide text-fg">{g.g}</td></tr>
                  {g.p.map(([name, vals], pi) => (
                    <tr key={name}>
                      <td className="font-medium">{name}</td>
                      {vals.map((v, ri) => (
                        <td key={ri} className="text-center">
                          {ri === 0 ? <span className="inline-flex items-center gap-1 text-fg2" title="Owner always has full access"><Lock size={14} /></span> : <span className="inline-flex justify-center"><Checkbox checked={v} onChange={() => toggle(gi, pi, ri)} /></span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

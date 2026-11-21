"use client";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card, PageHeader, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { expenseCats } from "@/lib/data";
import { rs } from "@/lib/format";

export default function ExpenseCats() {
  const budgets = [200_000, 60_000, 700_000, 25_000, 30_000, 20_000, 10_000];
  return (
    <>
      <PageHeader title="Expense categories" actions={<Button variant="primary" icon={Plus}>Add category</Button>} />
      <SubNav module="expenses" />
      <Card pad={false}>
        <ul className="divide-y divide-line">
          {expenseCats.map((c, i) => (
            <li key={c} className="flex h-16 items-center gap-3 px-5">
              <GripVertical size={18} className="text-fg2" />
              <span className="flex-1 font-semibold">{c}</span>
              <span className="hidden text-sm text-fg2 sm:block">Monthly budget <b className="text-fg tnum">{rs(budgets[i], { decimals: false })}</b></span>
              <Toggle checked={i !== 6} label="Needs receipt" />
              <button className="icon-btn" aria-label="Edit"><Pencil size={17} /></button>
              <button className="icon-btn hover:text-danger" aria-label="Delete"><Trash2 size={17} /></button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

"use client";
import { Card, PageHeader, Progress } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { VBars } from "@/components/charts";
import { expenseCats } from "@/lib/data";
import { rs } from "@/lib/format";

const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const data = months.map((m, i) => ({ x: m, rent: 185_000, util: [51_200, 54_800, 49_900, 52_300, 55_100, 52_460][i], sal: 642_000, other: [38_400, 41_200, 52_800, 36_900, 44_600, 38_850][i] }));

export default function ExpenseSummary() {
  const nov = [185_000, 52_460, 642_000, 6_400, 18_500, 12_000, 2_350];
  const budgets = [200_000, 60_000, 700_000, 25_000, 30_000, 20_000, 10_000];
  return (
    <>
      <PageHeader title="Expense summary" sub="Monthly totals by category" />
      <SubNav module="expenses" />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card title="Last 6 months"><VBars data={data} stacked height={320} keys={[{ k: "sal", label: "Salaries" }, { k: "rent", label: "Rent", color: "#FF7A00" }, { k: "util", label: "Utilities", color: "#FFA940" }, { k: "other", label: "Other", color: "#B9DDF7" }]} /></Card>
        <Card title="November vs budget">
          <ul className="space-y-4">
            {expenseCats.map((c, i) => (
              <li key={c}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{c}</span><span className="tnum"><b>{rs(nov[i], { decimals: false })}</b> <span className="text-fg2">/ {rs(budgets[i], { decimals: false })}</span></span></div>
                <Progress value={(nov[i] / budgets[i]) * 100} tone={nov[i] / budgets[i] > 0.9 ? "danger" : "navy"} />
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-line pt-4"><span className="font-semibold">Total</span><span className="font-heading text-lg font-bold tnum">{rs(nov.reduce((a, b) => a + b, 0))}</span></div>
        </Card>
      </div>
    </>
  );
}

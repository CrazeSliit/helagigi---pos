"use client";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { Avatar, Card, PageHeader, Segmented, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { staff } from "@/lib/data";
import { cn } from "@/lib/format";

const days = ["Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20", "Sat 21", "Sun 22"];

export default function Attendance() {
  const [view, setView] = useState<"log" | "sheet">("sheet");
  const ppl = staff.slice(1, 9);
  const hrs = (i: number, d: number) => (d === 6 ? 0 : [8, 8.5, 7, 8, 9, 7.5, 8, 6.5][(i + d) % 8] - (i === 3 && d === 2 ? 8 : 0));
  return (
    <>
      <PageHeader title="Attendance" sub="Week of 16/11/2026" actions={<Segmented value={view} onChange={setView} options={[{ v: "sheet", label: "Timesheet" }, { v: "log", label: "Clock-in log" }]} />} />
      <SubNav module="staff" />
      {view === "sheet" ? (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Staff</th>{days.map((d) => <th key={d} className="text-center">{d}</th>)}<th className="text-right">Total</th></tr></thead>
              <tbody>
                {ppl.map((s, i) => {
                  const h = days.map((_, d) => hrs(i, d));
                  return (
                    <tr key={s.id}>
                      <td><span className="flex items-center gap-2.5"><Avatar name={s.name} size={30} color={s.color} /><span><span className="block font-semibold">{s.name}</span><span className="text-cap text-fg2">{s.role}</span></span></span></td>
                      {h.map((v, d) => <td key={d} className="text-center"><span className={cn("inline-grid h-9 w-12 place-items-center rounded-lg text-cap font-semibold", v === 0 ? "bg-surface-2 text-muted" : v >= 9 ? "bg-orange-100 text-navy-900" : "bg-tint text-fg")}>{v ? `${v}h` : d === 6 ? "Off" : "Leave"}</span></td>)}
                      <td className="text-right font-heading font-semibold">{h.reduce((a, b) => a + b, 0)}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card pad={false}>
          <ul className="divide-y divide-line">
            {[["Kasun Jayasuriya", "in", "08:01", "Colombo 03 · T1"], ["Sachini Perera", "in", "08:04", "Colombo 03 · T2"], ["Mohamed Imran", "in", "08:20", "Kandy · T1"], ["Nuwan Ekanayake", "in", "07:30", "Kurunegala"], ["Tharushi Silva", "out", "21:10 (yesterday)", "Kandy · T2"], ["Ruwan Bandara", "in", "07:48", "Kandy"]].map(([n, d, t, w]) => {
              const s = staff.find((x) => x.name === n)!;
              return (
                <li key={n} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={n} size={36} color={s.color} />
                  <span className="flex-1"><span className="block font-semibold">{n}</span><span className="text-cap text-fg2">{w}</span></span>
                  <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", d === "in" ? "text-success" : "text-fg2")}>{d === "in" ? <LogIn size={16} /> : <LogOut size={16} />}{d === "in" ? "Clocked in" : "Clocked out"} {t}</span>
                  <Status s={d === "in" ? "Online" : "Offline"} label={d === "in" ? "On shift" : "Off"} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}

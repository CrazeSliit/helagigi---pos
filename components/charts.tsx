"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/store";
import { rs, rsShort, cn } from "@/lib/format";

export const BRAND_SERIES = ["#0B1E4F", "#FF7A00", "#FFA940", "#B9DDF7", "#1A3170", "#4A5875"];

function useAxis() {
  const { theme } = useApp();
  const dark = theme === "dark";
  return {
    dark,
    tick: { fill: dark ? "#B9C7E2" : "#4A5875", fontSize: 12 },
    grid: dark ? "#1E3466" : "#E3E8F0",
    primary: dark ? "#B9DDF7" : "#0B1E4F",
    tip: { background: dark ? "#0F2350" : "#fff", border: `1px solid ${dark ? "#1E3466" : "#E3E8F0"}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(11,30,79,.12)", fontSize: 13, color: dark ? "#EAF0FB" : "#0B1E4F" },
  };
}

export function TrendChart({ data, height = 280, nowLabel = "Today", prevLabel = "Last Saturday" }: { data: { h: string; now: number | null; prev: number }[]; height?: number; nowLabel?: string; prevLabel?: string }) {
  const a = useAxis();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gNow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF7A00" stopOpacity={0.28} /><stop offset="100%" stopColor="#FF7A00" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={a.grid} />
        <XAxis dataKey="h" tick={a.tick} axisLine={false} tickLine={false} />
        <YAxis tick={a.tick} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => rsShort(v).replace("Rs. ", "")} />
        <Tooltip contentStyle={a.tip} formatter={(v: unknown, n: unknown) => [rs(Number(v)), n === "now" ? nowLabel : prevLabel]} />
        <Area type="monotone" dataKey="prev" stroke={a.primary} strokeOpacity={0.45} strokeDasharray="5 5" strokeWidth={2} fill="none" />
        <Area type="monotone" dataKey="now" stroke="#FF7A00" strokeWidth={2.5} fill="url(#gNow)" connectNulls={false} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data, keys, height = 260 }: { data: Record<string, number | string>[]; keys: { k: string; label: string; color?: string }[]; height?: number }) {
  const a = useAxis();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={a.grid} />
        <XAxis dataKey="x" tick={a.tick} axisLine={false} tickLine={false} />
        <YAxis tick={a.tick} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => rsShort(v).replace("Rs. ", "")} />
        <Tooltip contentStyle={a.tip} formatter={(v: unknown) => rs(Number(v))} />
        {keys.map((k, i) => <Line key={k.k} dataKey={k.k} name={k.label} stroke={k.color ?? (i === 0 ? "#FF7A00" : a.primary)} strokeWidth={2.5} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220, center }: { data: { name: string; value: number; color: string }[]; height?: number; center?: { label: string; value: string } }) {
  const a = useAxis();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((d) => <Cell key={d.name} fill={a.dark && d.color === "#0B1E4F" ? "#EAF0FB" : d.color} />)}
          </Pie>
          <Tooltip contentStyle={a.tip} formatter={(v: unknown) => [`${rs(Number(v))} · ${((Number(v) / total) * 100).toFixed(1)}%`]} />
        </PieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-cap text-fg2">{center.label}</span>
          <span className="font-heading text-lg font-semibold tnum">{center.value}</span>
        </div>
      )}
    </div>
  );
}

export function HBars({ data, height = 260, color = "#0B1E4F" }: { data: { name: string; value: number }[]; height?: number; color?: string }) {
  const a = useAxis();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tick={a.tick} axisLine={false} tickLine={false} width={104} />
        <Tooltip cursor={{ fill: a.grid, opacity: 0.4 }} contentStyle={a.tip} formatter={(v: unknown) => [rs(Number(v)), "Sales"]} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={a.dark && color === "#0B1E4F" ? "#B9DDF7" : color}>
          {data.map((d, i) => <Cell key={d.name} fill={i === 0 ? "#FF7A00" : a.dark && color === "#0B1E4F" ? "#B9DDF7" : color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBars({ data, keys, height = 260, stacked }: { data: Record<string, number | string>[]; keys: { k: string; label: string; color?: string }[]; height?: number; stacked?: boolean }) {
  const a = useAxis();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={a.grid} />
        <XAxis dataKey="x" tick={a.tick} axisLine={false} tickLine={false} />
        <YAxis tick={a.tick} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => rsShort(v).replace("Rs. ", "")} />
        <Tooltip cursor={{ fill: a.grid, opacity: 0.4 }} contentStyle={a.tip} formatter={(v: unknown, n: unknown) => [rs(Number(v)), String(n)]} />
        {keys.map((k, i) => (
          <Bar key={k.k} dataKey={k.k} name={k.label} stackId={stacked ? "s" : undefined} radius={stacked ? 0 : [6, 6, 0, 0]}
            fill={k.color ?? (i === 0 ? (a.dark ? "#B9DDF7" : "#0B1E4F") : i === 1 ? "#FF7A00" : BRAND_SERIES[i])} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Day-of-week × hour heatmap — navy scale with the peak in orange. */
export function Heatmap({ rows, cols, values, className }: { rows: string[]; cols: string[]; values: number[][]; className?: string }) {
  const max = Math.max(...values.flat());
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="border-separate border-spacing-1 text-cap">
        <thead><tr><th />{cols.map((c) => <th key={c} className="w-10 font-medium text-fg2">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r}>
              <th className="pr-2 text-right font-medium text-fg2">{r}</th>
              {values[i].map((v, j) => {
                const t = v / max;
                const peak = t > 0.92;
                return (
                  <td key={j} title={`${r} ${cols[j]}:00 · ${rs(v * 1000, { decimals: false })}`}
                    className={cn("h-8 w-10 rounded-md border-0 text-center text-[10px] font-semibold", peak ? "text-navy-900" : t > 0.55 ? "text-white" : "text-transparent")}
                    style={{ background: peak ? "#FF7A00" : `rgba(26,49,112,${0.08 + t * 0.92})` }}>
                    {Math.round(v)}K
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-2 text-cap text-fg2">
        Low <span className="h-2 w-28 rounded-full" style={{ background: "linear-gradient(90deg, rgba(26,49,112,.08), rgba(26,49,112,1))" }} /> High
        <span className="ml-3 inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" /> Peak hour
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2 text-cap text-fg2">
          <span className={cn("h-2.5 w-2.5 rounded-sm", i.dashed && "h-0.5 w-4 rounded-none")} style={{ background: i.color }} />
          {i.label}{i.value && <span className="font-semibold text-fg tnum">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}

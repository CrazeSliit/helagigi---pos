"use client";
import { useRef, useState } from "react";
import { Clock, Move, Plus, Users } from "lucide-react";
import { Button, PageHeader, Tabs } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { cn } from "@/lib/format";

type T = { id: string; x: number; y: number; seats: number; shape: "sq" | "round" | "long"; s: "Available" | "Occupied" | "Bill Requested" | "Reserved"; guests?: number; mins?: number };
const init: Record<string, T[]> = {
  Indoor: [
    { id: "T1", x: 40, y: 40, seats: 2, shape: "round", s: "Occupied", guests: 2, mins: 34 }, { id: "T2", x: 200, y: 40, seats: 4, shape: "sq", s: "Available" },
    { id: "T3", x: 360, y: 40, seats: 4, shape: "sq", s: "Bill Requested", guests: 4, mins: 72 }, { id: "T4", x: 520, y: 40, seats: 2, shape: "round", s: "Reserved" },
    { id: "T5", x: 40, y: 220, seats: 6, shape: "long", s: "Occupied", guests: 5, mins: 18 }, { id: "T6", x: 330, y: 220, seats: 4, shape: "sq", s: "Available" },
    { id: "T7", x: 490, y: 220, seats: 4, shape: "sq", s: "Occupied", guests: 3, mins: 51 }, { id: "T8", x: 200, y: 380, seats: 2, shape: "round", s: "Available" },
    { id: "T9", x: 360, y: 380, seats: 8, shape: "long", s: "Reserved" },
  ],
  Outdoor: [{ id: "O1", x: 60, y: 60, seats: 4, shape: "round", s: "Occupied", guests: 4, mins: 22 }, { id: "O2", x: 240, y: 60, seats: 4, shape: "round", s: "Available" }, { id: "O3", x: 420, y: 60, seats: 6, shape: "long", s: "Available" }],
  "AC Room": [{ id: "A1", x: 80, y: 80, seats: 10, shape: "long", s: "Reserved" }, { id: "A2", x: 420, y: 80, seats: 4, shape: "sq", s: "Occupied", guests: 2, mins: 9 }],
};
const STY: Record<T["s"], string> = {
  Available: "bg-surface border-line text-fg",
  Occupied: "bg-orange-500 border-orange-600 text-navy-900",
  "Bill Requested": "bg-amber-400 border-amber-400 text-navy-900",
  Reserved: "bg-sky-300 border-sky-300 text-navy-900",
};

export default function FloorPlan() {
  const [area, setArea] = useState("Indoor");
  const [tables, setTables] = useState(init);
  const [edit, setEdit] = useState(false);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const list = tables[area];
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const x = Math.round((e.clientX - r.left - drag.current.dx) / 8) * 8, y = Math.round((e.clientY - r.top - drag.current.dy) / 8) * 8;
    setTables({ ...tables, [area]: list.map((t) => (t.id === drag.current!.id ? { ...t, x: Math.max(0, x), y: Math.max(0, y) } : t)) });
  };
  return (
    <>
      <PageHeader title="Table floor plan" sub="HeladiGi Café · Kandy" actions={<><Button icon={Move} variant={edit ? "secondary" : "outline"} onClick={() => setEdit(!edit)}>{edit ? "Done arranging" : "Arrange tables"}</Button><Button variant="primary" icon={Plus}>New order</Button></>} />
      <SubNav module="restaurant" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs variant="pill" value={area} onChange={setArea} tabs={Object.keys(tables).map((a) => ({ v: a, label: a, count: tables[a].length }))} />
        <div className="flex flex-wrap gap-4 text-cap text-fg2">{(Object.keys(STY) as T["s"][]).map((s) => <span key={s} className="inline-flex items-center gap-1.5"><span className={cn("h-3.5 w-3.5 rounded border", STY[s])} />{s}</span>)}</div>
      </div>
      <div ref={box} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}
        className={cn("card relative h-[560px] overflow-auto", edit && "bg-[radial-gradient(rgb(var(--border))_1px,transparent_1px)] [background-size:16px_16px]")}>
        {list.map((t) => (
          <button key={t.id} onPointerDown={(e) => { if (!edit) return; const r = e.currentTarget.getBoundingClientRect(); drag.current = { id: t.id, dx: e.clientX - r.left, dy: e.clientY - r.top }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            className={cn("absolute flex flex-col items-center justify-center border-2 shadow-soft transition-shadow", STY[t.s], edit ? "cursor-grab active:cursor-grabbing" : "hover:shadow-lift",
              t.shape === "round" ? "h-28 w-28 rounded-full" : t.shape === "long" ? "h-28 w-60 rounded-card" : "h-28 w-32 rounded-card")}
            style={{ left: t.x, top: t.y }} aria-label={`${t.id}, ${t.s}`}>
            <span className="font-heading text-lg font-bold">{t.id}</span>
            <span className="flex items-center gap-1 text-cap font-semibold"><Users size={13} />{t.guests ? `${t.guests}/${t.seats}` : t.seats}</span>
            {t.mins && <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 text-[11px] font-bold", t.mins > 60 ? "bg-danger text-white" : "bg-white/60")}><Clock size={11} />{t.mins}m</span>}
            {t.s === "Reserved" && <span className="mt-1 text-[11px] font-semibold">19:30 · Perera</span>}
            {t.s === "Bill Requested" && <span className="mt-1 text-[11px] font-semibold">Bill requested</span>}
          </button>
        ))}
      </div>
    </>
  );
}

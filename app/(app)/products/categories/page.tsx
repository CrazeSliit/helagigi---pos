"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { Icon } from "@/components/brand";
import { categories } from "@/lib/data";
import { cn } from "@/lib/format";

const children: Record<string, string[]> = { bev: ["Soft drinks", "Juices", "Water", "Energy drinks"], dairy: ["Milk powder", "Fresh milk", "Yoghurt & curd", "Ice cream"], snacks: ["Biscuits", "Chocolates", "Chips & bites"], grocery: ["Rice & grains", "Dhal & pulses", "Spices", "Noodles"] };

export default function Categories() {
  const [open, setOpen] = useState<Record<string, boolean>>({ dairy: true, bev: true });
  const [list, setList] = useState(categories);
  const [drag, setDrag] = useState<number | null>(null);
  const [sel, setSel] = useState("dairy");
  const cur = list.find((c) => c.id === sel)!;
  return (
    <>
      <PageHeader title="Categories" sub="Drag to reorder — the POS shows categories in this order" actions={<Button variant="primary" icon={Plus}>Add category</Button>} />
      <SubNav module="products" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card pad={false}>
          <ul className="divide-y divide-line">
            {list.map((c, i) => (
              <li key={c.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (drag === null) return; const n = [...list]; const [m] = n.splice(drag, 1); n.splice(i, 0, m); setList(n); setDrag(null); }}
                className={cn(drag === i && "opacity-50")}>
                <div className={cn("flex h-16 items-center gap-3 px-4", sel === c.id && "bg-tint")}>
                  <GripVertical size={18} className="cursor-grab text-fg2" aria-label="Drag to reorder" />
                  <button onClick={() => setOpen({ ...open, [c.id]: !open[c.id] })} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2" aria-label={open[c.id] ? "Collapse" : "Expand"} disabled={!children[c.id]}>
                    {children[c.id] ? (open[c.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="h-1 w-1 rounded-full bg-fg2" />}
                  </button>
                  <span className="grid h-10 w-10 place-items-center rounded-ctl text-navy-900" style={{ background: c.color }}><Icon name={c.icon} size={20} /></span>
                  <button onClick={() => setSel(c.id)} className="flex-1 text-left"><span className="font-semibold">{c.name[0]}</span><span className="ml-2 text-cap text-fg2">{c.name[1]}</span></button>
                  <span className="text-sm text-fg2 tnum">{c.count} products</span>
                  <button className="icon-btn" aria-label="More"><MoreHorizontal size={18} /></button>
                </div>
                {open[c.id] && children[c.id] && (
                  <ul className="border-t border-line bg-surface-2/50">
                    {children[c.id].map((s, j) => (
                      <li key={s} className="flex h-12 items-center gap-3 pl-[104px] pr-4 text-sm"><GripVertical size={16} className="text-fg2" /><span className="h-2 w-2 rounded-full" style={{ background: c.color }} /><span className="flex-1">{s}</span><span className="text-fg2 tnum">{[48, 31, 22, 14][j]}</span></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Edit category">
          <div className="space-y-4">
            <Field label="Name (English)"><Input key={cur.id + "en"} defaultValue={cur.name[0]} /></Field>
            <Field label="Name (සිංහල)"><Input key={cur.id + "si"} defaultValue={cur.name[1]} /></Field>
            <Field label="Name (தமிழ்)"><Input key={cur.id + "ta"} defaultValue={cur.name[2]} /></Field>
            <Field label="Parent"><select className="field"><option>— None (top level) —</option>{list.map((c) => <option key={c.id}>{c.name[0]}</option>)}</select></Field>
            <div>
              <span className="label">Colour</span>
              <div className="flex flex-wrap gap-2">{["#EAF0FB", "#FFF0E0", "#B9DDF7", "#FDE7C8", "#DDF3E4", "#F7E4EE", "#E6E9F7"].map((c) => <button key={c} aria-label={`Colour ${c}`} className={cn("h-10 w-10 rounded-ctl border-2", cur.color === c ? "border-orange-500" : "border-line")} style={{ background: c }} />)}</div>
            </div>
            <div>
              <span className="label">Icon</span>
              <div className="grid grid-cols-6 gap-2">{["CupSoda", "Milk", "Cookie", "Coffee", "Wheat", "Apple", "SprayCan", "Sparkles", "Pill", "Candy", "Baby", "Beef"].map((n) => <button key={n} aria-label={n} className={cn("grid h-11 place-items-center rounded-ctl border", cur.icon === n ? "border-orange-500 bg-orange-100 text-navy-900" : "border-line hover:bg-tint")}><Icon name={n} size={20} /></button>)}</div>
            </div>
            <Button variant="primary" className="w-full">Save category</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

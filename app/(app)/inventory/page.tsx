"use client";
import Link from "next/link";
import { Boxes, CalendarClock, PackageMinus, PackageX, Wallet, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { ProductThumb } from "@/components/pos-kit";
import { products, stockState, categories } from "@/lib/data";
import { rs, rsShort, cn } from "@/lib/format";

export default function Inventory() {
  const rows = products.map((p, i) => {
    const kdy = p.stock ? Math.max(0, Math.round(p.stock * (0.5 + ((i * 13) % 7) / 14))) : 0;
    const kur = p.stock ? Math.max(0, Math.round(p.stock * (0.3 + ((i * 7) % 5) / 12))) : 0;
    const total = p.stock + kdy + kur;
    return { ...p, cmb: p.stock, kdy, kur, total, value: total * p.cost };
  });
  const cards = [
    { l: "Total SKUs", v: "1,549", i: Boxes, c: "bg-tint text-fg" },
    { l: "Stock value (cost)", v: rsShort(rows.reduce((s, r) => s + r.value, 0) * 38), i: Wallet, c: "bg-orange-100 text-navy-900" },
    { l: "Low stock", v: "38", i: PackageMinus, c: "bg-warning/15 text-[#8A6500] dark:text-warning" },
    { l: "Out of stock", v: "9", i: PackageX, c: "bg-danger/10 text-danger" },
    { l: "Expiring in 30 days", v: "14 batches", i: CalendarClock, c: "bg-sky-300/40 text-navy-900 dark:text-sky-300" },
  ];
  const cell = (n: number, r: number) => <span className={cn("font-semibold", n === 0 ? "text-danger" : n < r / 2 ? "text-[#8A6500] dark:text-warning" : "")}>{n}</span>;
  return (
    <>
      <PageHeader title="Stock overview" sub="Live stock across all branches"
        actions={<><Link href="/inventory/transfers" className="btn btn-m btn-outline"><ArrowLeftRight size={18} />Transfer</Link><Link href="/inventory/adjust" className="btn btn-m btn-primary"><SlidersHorizontal size={18} />Adjust stock</Link></>} />
      <SubNav module="inventory" />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.l} className="card flex items-center gap-4 p-5">
            <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-card", c.c)}><c.i size={22} /></span>
            <span><span className="block text-cap text-fg2">{c.l}</span><span className="font-heading text-lg font-semibold tnum">{c.v}</span></span>
          </div>
        ))}
      </div>
      <FilterBar placeholder="Search product, SKU or barcode…" filters={[{ label: "All categories", options: categories.map((c) => c.name[0]) }, { label: "All statuses", options: ["In stock", "Low stock", "Out of stock"] }]} />
      <DataTable rows={rows} total={1549} pageSize={12} cols={[
        { key: "name", label: "Product", render: (r) => <span className="flex items-center gap-3"><ProductThumb p={r} className="h-10 w-10" size={18} /><span><span className="block font-semibold">{r.name}</span><span className="font-mono text-[11px] text-fg2">{r.sku}</span></span></span>, sort: (r) => r.name },
        { key: "cmb", label: "Colombo 03", align: "right", render: (r) => cell(r.cmb, r.reorder), sort: (r) => r.cmb },
        { key: "kdy", label: "Kandy", align: "right", render: (r) => cell(r.kdy, r.reorder), sort: (r) => r.kdy },
        { key: "kur", label: "Kurunegala", align: "right", render: (r) => cell(r.kur, r.reorder), sort: (r) => r.kur },
        { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{r.total}{r.unit === "kg" ? " kg" : ""}</span>, sort: (r) => r.total },
        { key: "value", label: "Stock value", align: "right", render: (r) => rs(r.value, { decimals: false }), sort: (r) => r.value },
        { key: "status", label: "Status", render: (r) => { const s = stockState(r); return <Status s={s === "in" ? "In Stock" : s === "low" ? "Low Stock" : "Out of Stock"} />; } },
      ]} />
    </>
  );
}

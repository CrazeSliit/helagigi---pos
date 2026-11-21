"use client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";

const brands = [
  ["Anchor", "Fonterra Brands Lanka", 18], ["Munchee", "Ceylon Biscuits Ltd", 42], ["Elephant House", "Ceylon Cold Stores", 37], ["Dilmah", "Dilmah Ceylon Tea", 24],
  ["Maliban", "Maliban Biscuit Manufactories", 29], ["Kotmale", "Kotmale Holdings", 14], ["Highland", "Milco (Pvt) Ltd", 21], ["Prima", "Prima Ceylon", 16],
  ["Sunlight", "Unilever Sri Lanka", 9], ["Signal", "Unilever Sri Lanka", 11], ["Baby Cheramy", "Hemas Consumer Brands", 13], ["Kist", "Cargills Quality Foods", 19],
].map(([n, c, k], i) => ({ id: i, name: n as string, co: c as string, count: k as number }));

export default function Brands() {
  return (
    <>
      <PageHeader title="Brands" sub={`${brands.length} brands`} actions={<Button variant="primary" icon={Plus}>Add brand</Button>} />
      <SubNav module="products" />
      <FilterBar placeholder="Search brands…" exportable={false} />
      <DataTable rows={brands} rowActions={[{ label: "Edit", icon: Pencil }, { label: "Delete", icon: Trash2, danger: true }]} cols={[
        { key: "logo", label: "Logo", render: (b) => <span className="grid h-10 w-10 place-items-center rounded-ctl border border-line bg-surface-2 font-heading text-sm font-bold">{b.name.slice(0, 2).toUpperCase()}</span> },
        { key: "name", label: "Brand", render: (b) => <span className="font-semibold">{b.name}</span>, sort: (b) => b.name },
        { key: "co", label: "Company", render: (b) => <span className="text-fg2">{b.co}</span> },
        { key: "count", label: "Products", align: "right", sort: (b) => b.count },
      ]} />
    </>
  );
}

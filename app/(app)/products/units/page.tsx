"use client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, PageHeader } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";

const units = [
  { id: 1, name: "Piece", short: "pcs", type: "Count", base: "—", decimals: "No", count: 1204 },
  { id: 2, name: "Kilogram", short: "kg", type: "Weight", base: "—", decimals: "3 places", count: 58 },
  { id: 3, name: "Gram", short: "g", type: "Weight", base: "0.001 kg", decimals: "No", count: 12 },
  { id: 4, name: "Litre", short: "L", type: "Volume", base: "—", decimals: "2 places", count: 21 },
  { id: 5, name: "Millilitre", short: "ml", type: "Volume", base: "0.001 L", decimals: "No", count: 33 },
  { id: 6, name: "Pack", short: "pack", type: "Count", base: "—", decimals: "No", count: 196 },
  { id: 7, name: "Dozen", short: "doz", type: "Count", base: "12 pcs", decimals: "No", count: 4 },
  { id: 8, name: "Carton (24)", short: "ctn", type: "Count", base: "24 pcs", decimals: "No", count: 17 },
];

export default function Units() {
  return (
    <>
      <PageHeader title="Units of measure" sub="Used for stock, pricing and weighed items" actions={<Button variant="primary" icon={Plus}>Add unit</Button>} />
      <SubNav module="products" />
      <DataTable rows={units} rowActions={[{ label: "Edit", icon: Pencil }, { label: "Delete", icon: Trash2, danger: true }]} cols={[
        { key: "name", label: "Unit", render: (u) => <span className="font-semibold">{u.name}</span> },
        { key: "short", label: "Symbol", render: (u) => <span className="font-mono">{u.short}</span> },
        { key: "type", label: "Type", render: (u) => <Badge tone={u.type === "Weight" ? "amber" : u.type === "Volume" ? "sky" : "navy"}>{u.type}</Badge> },
        { key: "base", label: "Conversion", render: (u) => <span className="text-fg2">{u.base}</span> },
        { key: "decimals", label: "Decimals", render: (u) => <span className="text-fg2">{u.decimals}</span> },
        { key: "count", label: "Products", align: "right" },
      ]} />
    </>
  );
}

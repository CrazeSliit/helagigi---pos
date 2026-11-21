"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, CircleSlash, FolderInput, LayoutGrid, List, Pencil, Plus, Printer, Trash2, Upload, Copy } from "lucide-react";
import { PageHeader, Segmented, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, FilterBar } from "@/components/table";
import { ProductCard, ProductThumb } from "@/components/pos-kit";
import { categories, products, stockState } from "@/lib/data";
import { rs } from "@/lib/format";

export default function Products() {
  const [view, setView] = useState<"table" | "grid">("table");
  const rows = products.map((p, i) => ({ ...p, active: i !== 29 }));
  return (
    <>
      <PageHeader title="Products" sub="1,549 products · 9 categories · 84 brands"
        actions={<><Link href="/products/import" className="btn btn-m btn-outline"><Upload size={18} />Import CSV/Excel</Link><Link href="/products/new" className="btn btn-m btn-primary"><Plus size={18} />Add Product</Link></>} />
      <SubNav module="products" />
      <FilterBar placeholder="Search name, SKU or barcode…" filters={[{ label: "All categories", options: categories.map((c) => c.name[0]) }, { label: "All brands", options: ["Anchor", "Munchee", "Elephant House", "Dilmah", "Maliban"] }, { label: "Any stock", options: ["In stock", "Low stock", "Out of stock"] }]}>
        <Segmented value={view} onChange={setView} options={[{ v: "table", label: <span className="inline-flex items-center gap-1"><List size={14} />Table</span> }, { v: "grid", label: <span className="inline-flex items-center gap-1"><LayoutGrid size={14} />Grid</span> }]} />
      </FilterBar>
      {view === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <DataTable rows={rows} total={1549} pageSize={12} selectable
          bulk={[{ label: "Activate", icon: CheckCircle2 }, { label: "Deactivate", icon: CircleSlash }, { label: "Change category", icon: FolderInput }, { label: "Print labels", icon: Printer }, { label: "Delete", icon: Trash2, danger: true }]}
          rowActions={[{ label: "Edit", icon: Pencil }, { label: "Duplicate", icon: Copy }, { label: "Print label", icon: Printer }, { label: "Delete", icon: Trash2, danger: true }]}
          cols={[
            { key: "img", label: "Image", render: (p) => <ProductThumb p={p} className="h-10 w-10" size={18} /> },
            { key: "name", label: "Name", render: (p) => <Link href="/products/new" className="font-semibold hover:underline">{p.name}</Link>, sort: (p) => p.name },
            { key: "sku", label: "SKU", render: (p) => <span className="font-mono text-cap text-fg2">{p.sku}</span> },
            { key: "barcode", label: "Barcode", render: (p) => <span className="font-mono text-cap text-fg2">{p.barcode}</span> },
            { key: "cat", label: "Category", render: (p) => categories.find((c) => c.id === p.cat)?.name[0] },
            { key: "brand", label: "Brand", render: (p) => <span className="text-fg2">{p.brand}</span> },
            { key: "cost", label: "Cost", align: "right", render: (p) => <span className="text-fg2">{rs(p.cost)}</span> },
            { key: "price", label: "Price", align: "right", render: (p) => <span className="font-semibold">{rs(p.price)}</span>, sort: (p) => p.price },
            { key: "stock", label: "Stock", align: "right", sort: (p) => p.stock, render: (p) => { const s = stockState(p); return <span className={s === "out" ? "font-semibold text-danger" : s === "low" ? "font-semibold text-[#8A6500] dark:text-warning" : ""}>{p.stock}{p.unit === "kg" ? " kg" : ""}</span>; } },
            { key: "status", label: "Status", render: (p) => <Status s={p.active ? "Active" : "Inactive"} /> },
          ]} />
      )}
    </>
  );
}

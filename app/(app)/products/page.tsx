"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, SearchInput, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable, type Col } from "@/components/table";
import { Confirm } from "@/components/overlays";
import { Pager } from "@/components/pager";
import { ProductThumb } from "@/components/pos-kit";
import { api, apiAll, apiPage, errText, toProduct, type ApiProduct, type Meta } from "@/lib/api";
import { rs } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useApp } from "@/lib/store";

type Row = ApiProduct & { stockState: "in" | "low" | "out" };

export default function Products() {
  const { me } = useSession();
  const { toast } = useApp();
  const router = useRouter();
  const editable = can(me, "products.edit"), showCost = can(me, "products.view_cost");
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [del, setDel] = useState<Row | null>(null);
  useEffect(() => { apiAll<{ id: string; name: string }>("/categories").then(setCats).catch(() => undefined); }, []);
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (q.trim()) p.set("q", q.trim());
    if (categoryId) p.set("categoryId", categoryId);
    try { const r = await apiPage<Row>(`/products?${p}`); setRows(r.rows); setMeta(r.meta); }
    catch (e) { setErr(errText(e)); setRows([]); setMeta(null); }
    finally { setLoading(false); }
  }, [page, q, categoryId]);
  useEffect(() => { const h = setTimeout(() => void load(), q ? 250 : 0); return () => clearTimeout(h); }, [load, q]);
  const remove = async () => {
    if (!del) return;
    const name = del.name; setDel(null);
    try { await api(`/products/${del.id}`, { method: "DELETE" }); toast({ tone: "success", title: `${name} removed` }); await load(); }
    catch (e) { toast({ tone: "error", title: "Couldn't remove product", body: errText(e) }); }
  };
  const cols: Col<Row>[] = [
    { key: "img", label: "Image", render: (p) => <ProductThumb p={toProduct(p)} className="h-10 w-10" size={18} /> },
    { key: "name", label: "Name", render: (p) => (editable ? <Link href={`/products/new?id=${p.id}`} className="font-semibold hover:underline">{p.name}</Link> : <span className="font-semibold">{p.name}</span>), sort: (p) => p.name },
    { key: "sku", label: "SKU", render: (p) => <span className="font-mono text-cap text-fg2">{p.sku}</span> },
    { key: "barcode", label: "Barcode", render: (p) => <span className="font-mono text-cap text-fg2">{p.barcode}</span> },
    { key: "cat", label: "Category", render: (p) => p.category.name },
    { key: "brand", label: "Brand", render: (p) => <span className="text-fg2">{p.brand?.name}</span> },
    ...(showCost ? [{ key: "cost", label: "Cost", align: "right" as const, render: (p: Row) => <span className="text-fg2">{rs(p.cost ?? 0)}</span> }] : []),
    { key: "price", label: "Price", align: "right", render: (p) => <span className="font-semibold">{rs(p.price)}</span>, sort: (p) => p.price },
    { key: "stock", label: "Stock", align: "right", sort: (p) => p.stock, render: (p) => (p.trackStock ? <span className={p.stockState === "out" ? "font-semibold text-danger" : p.stockState === "low" ? "font-semibold text-[#8A6500] dark:text-warning" : ""}>{p.stock}{p.unit.code === "kg" ? " kg" : ""}</span> : <span className="text-fg2">Not tracked</span>) },
    { key: "status", label: "Status", render: (p) => <Status s={p.active ? "Active" : "Inactive"} /> },
  ];
  return (
    <>
      <PageHeader title="Products" sub={meta ? `${meta.total.toLocaleString()} products at this branch` : undefined}
        actions={editable ? <Link href="/products/new" className="btn btn-m btn-primary"><Plus size={18} />Add Product</Link> : undefined} />
      <SubNav module="products" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search name, SKU or barcode…" className="w-full sm:w-72" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select aria-label="Category" className="field h-11 w-full sm:w-auto sm:min-w-[170px]" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      {err && <p role="alert" className="mb-4 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
      <DataTable rows={rows} loading={loading} pageSize={20} cols={cols} footer={meta ? <Pager meta={meta} onPage={setPage} /> : undefined}
        rowActions={editable ? [{ label: "Edit", icon: Pencil, onClick: (p) => router.push(`/products/new?id=${p.id}`) }, { label: "Remove", icon: Trash2, danger: true, onClick: setDel }] : undefined} />
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={() => void remove()} title={`Remove ${del?.name ?? "product"}?`} body="It will no longer appear on the POS. Past sales are kept." confirmLabel="Remove" />
    </>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { AddonInput, Button, Card, Field, Input, PageHeader, Textarea, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { api, apiAll, ApiFail, errText, type ApiProduct } from "@/lib/api";
import { cn, rs } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useApp } from "@/lib/store";

type Opt = { id: string; name: string };
const empty = { name: "", nameSi: "", description: "", categoryId: "", brandId: "", unitId: "", taxRateId: "", sku: "", barcode: "", price: "", cost: "", mrp: "", reorderLevel: "0", openingStock: "" };
const Sel = ({ value, onChange, options, none, label }: { value: string; onChange: (v: string) => void; options: Opt[]; none?: string; label: string }) => (
  <select aria-label={label} className="field h-11 w-full" value={value} onChange={(e) => onChange(e.target.value)}>
    {none !== undefined && <option value="">{none}</option>}
    {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
  </select>
);

export default function ProductForm() {
  const { toast } = useApp();
  const { me } = useSession();
  const router = useRouter();
  const showCost = can(me, "products.view_cost");
  const [id, setId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [v, setV] = useState(empty);
  const [track, setTrack] = useState(true);
  const [weighed, setWeighed] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [active, setActive] = useState(true);
  const [opts, setOpts] = useState<{ group: string; options: string[] }[]>([]);
  const [lists, setLists] = useState<{ cats: Opt[]; brands: Opt[]; units: Opt[]; taxes: Opt[] }>({ cats: [], brands: [], units: [], taxes: [] });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    (async () => {
      try {
        const pid = new URLSearchParams(window.location.search).get("id");
        const [cats, brands, units, taxes] = await Promise.all([apiAll<Opt>("/categories"), apiAll<Opt>("/brands"), apiAll<Opt>("/units"), apiAll<{ id: string; name: string; rate: number; onReceipt: boolean }>("/tax-rates")]);
        const taxOpts = taxes.filter((t) => t.onReceipt).map((t) => ({ id: t.id, name: `${t.name} (${t.rate}%)` }));
        setLists({ cats, brands, units, taxes: taxOpts });
        if (pid) {
          const p = await api<ApiProduct>(`/products/${pid}`);
          setId(p.id); setTrack(p.trackStock); setWeighed(p.weighed); setFavorite(p.favorite); setActive(p.active); setOpts(p.variantGroups ?? []);
          setV({ name: p.name, nameSi: p.nameSi ?? "", description: p.description ?? "", categoryId: p.categoryId, brandId: p.brandId ?? "", unitId: p.unitId, taxRateId: p.taxRateId ?? "", sku: p.sku, barcode: p.barcode ?? "", price: String(p.price), cost: String(p.cost ?? ""), mrp: p.mrp != null ? String(p.mrp) : "", reorderLevel: String(p.reorderLevel), openingStock: "" });
        } else {
          setV((x) => ({ ...x, categoryId: cats[0]?.id ?? "", unitId: (units.find((u) => u.name === "Pieces") ?? units[0])?.id ?? "", taxRateId: taxOpts[0]?.id ?? "" }));
        }
      } catch (e) { setErr(errText(e)); } finally { setReady(true); }
    })();
  }, []);

  const price = parseFloat(v.price) || 0, cost = parseFloat(v.cost) || 0;
  const margin = price ? ((price - cost) / price) * 100 : 0;
  const save = async (again: boolean) => {
    if (!v.name.trim() || !v.sku.trim() || !v.price || !v.categoryId || !v.unitId) return setErr("Name, SKU, category, unit and selling price are required");
    setBusy(true); setErr("");
    const body: Record<string, unknown> = {
      name: v.name.trim(), nameSi: v.nameSi.trim() || null, description: v.description.trim() || null, categoryId: v.categoryId, brandId: v.brandId || null, unitId: v.unitId, taxRateId: v.taxRateId || null,
      sku: v.sku.trim(), barcode: v.barcode.trim() || null, price, mrp: v.mrp ? parseFloat(v.mrp) : null, reorderLevel: parseFloat(v.reorderLevel) || 0,
      trackStock: track, weighed, favorite, active, variantGroups: opts.filter((o) => o.group.trim() && o.options.length).length ? opts.filter((o) => o.group.trim() && o.options.length) : null,
    };
    if (showCost) body.cost = cost;
    if (!id && track && parseFloat(v.openingStock) > 0) body.openingStock = parseFloat(v.openingStock);
    try {
      if (id) await api(`/products/${id}`, { method: "PATCH", body });
      else await api("/products", { body });
      toast({ tone: "success", title: "Product saved", body: v.name.trim() });
      if (again) { setId(null); setOpts([]); setV((x) => ({ ...empty, categoryId: x.categoryId, unitId: x.unitId, taxRateId: x.taxRateId, brandId: x.brandId })); window.history.replaceState(null, "", "/products/new"); window.scrollTo(0, 0); }
      else router.push("/products");
    } catch (e) {
      setErr(e instanceof ApiFail && e.code === "duplicate" ? "That SKU or barcode is already used by another product" : errText(e));
      window.scrollTo(0, 0);
    } finally { setBusy(false); }
  };
  const S = ({ title, children }: { title: string; children: ReactNode }) => <Card title={title}>{children}</Card>;
  if (!ready) return <p className="py-20 text-center text-sm text-fg2" role="status">Loading…</p>;
  return (
    <>
      <PageHeader title={id ? v.name || "Edit product" : "Add product"} crumbs={["Products", id ? "Edit" : "Add"]} />
      <SubNav module="products" />
      {err && <p role="alert" className="mb-4 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
      <div className="mx-auto max-w-4xl space-y-6 pb-24">
        {S({ title: "Basic info", children: (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name (English)" required><Input value={v.name} onChange={set("name")} /></Field>
            <Field label="Product name (සිංහල)" hint="Printed on Sinhala screens"><Input value={v.nameSi} onChange={set("nameSi")} /></Field>
            <Field label="Description" className="md:col-span-2"><Textarea value={v.description} onChange={set("description")} /></Field>
            <Field label="Category" required><Sel label="Category" value={v.categoryId} onChange={(x) => setV({ ...v, categoryId: x })} options={lists.cats} /></Field>
            <Field label="Brand"><Sel label="Brand" value={v.brandId} onChange={(x) => setV({ ...v, brandId: x })} options={lists.brands} none="No brand" /></Field>
            <Field label="Unit" required><Sel label="Unit" value={v.unitId} onChange={(x) => setV({ ...v, unitId: x })} options={lists.units} /></Field>
            <Field label="Tax class"><Sel label="Tax class" value={v.taxRateId} onChange={(x) => setV({ ...v, taxRateId: x })} options={lists.taxes} none="No tax" /></Field>
          </div>
        ) })}
        {S({ title: "Pricing", children: (
          <div className="grid gap-4 md:grid-cols-3">
            {showCost && <Field label="Cost price"><AddonInput prefix="Rs." inputMode="decimal" value={v.cost} onChange={set("cost")} /></Field>}
            <Field label="Selling price" required hint="Includes tax"><AddonInput prefix="Rs." inputMode="decimal" value={v.price} onChange={set("price")} /></Field>
            <Field label="MRP" hint="Maximum retail price on pack"><AddonInput prefix="Rs." inputMode="decimal" value={v.mrp} onChange={set("mrp")} /></Field>
            {showCost && <Field label="Margin" hint="Calculated automatically"><div className={cn("flex h-11 items-center justify-between rounded-ctl px-3 font-semibold tnum", margin >= 15 ? "bg-success/10 text-success" : margin > 0 ? "bg-warning/15 text-[#8A6500]" : "bg-danger/10 text-danger")}>{margin.toFixed(1)}%<span className="text-cap font-medium">{rs(price - cost)} / unit</span></div></Field>}
          </div>
        ) })}
        {S({ title: "Identifiers", children: (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SKU" required><Input value={v.sku} onChange={set("sku")} className="font-mono" /></Field>
            <Field label="Barcode"><Input value={v.barcode} onChange={set("barcode")} className="font-mono" /></Field>
          </div>
        ) })}
        {S({ title: "Inventory", children: (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-8"><Toggle checked={track} onChange={setTrack} label="Track stock" /><Toggle checked={weighed} onChange={setWeighed} label="Sold by weight" /></div>
            {track && <div className="grid gap-4 md:grid-cols-2">
              {!id && <Field label="Opening stock" hint="Added to your current branch"><Input inputMode="decimal" value={v.openingStock} onChange={set("openingStock")} /></Field>}
              <Field label="Reorder level"><Input inputMode="decimal" value={v.reorderLevel} onChange={set("reorderLevel")} /></Field>
            </div>}
          </div>
        ) })}
        <Card title="Options" sub="For example Size or Flavour. Choices are recorded on the sale." action={<Button icon={Plus} size="s" onClick={() => setOpts([...opts, { group: "", options: [] }])}>Add option</Button>}>
          <div className="space-y-3">
            {!opts.length && <p className="text-sm text-fg2">This product has no options.</p>}
            {opts.map((o, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-card border border-line p-3">
                <Input value={o.group} placeholder="Option name" onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, group: e.target.value } : x)))} className="h-10 w-36 font-semibold" aria-label="Option name" />
                {o.options.map((val) => <span key={val} className="inline-flex h-9 items-center gap-1 rounded-full bg-tint pl-3 pr-1 text-sm font-medium">{val}<button aria-label={`Remove ${val}`} onClick={() => setOpts(opts.map((x, j) => (j === i ? { ...x, options: x.options.filter((y) => y !== val) } : x)))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface"><X size={13} /></button></span>)}
                <input placeholder="+ Add value, press Enter" aria-label="Add option value" className="h-9 min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const val = e.currentTarget.value.trim(); if (val && !o.options.includes(val)) setOpts(opts.map((x, j) => (j === i ? { ...x, options: [...x.options, val] } : x))); e.currentTarget.value = ""; } }} />
                <button aria-label="Remove option" onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-fg2 hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </Card>
        {S({ title: "Status", children: <div className="flex flex-wrap gap-8"><Toggle checked={active} onChange={setActive} label="Active on POS" /><Toggle checked={favorite} onChange={setFavorite} label="Show in favourites" /></div> })}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur lg:left-[var(--sb,264px)]">
        <div className="mx-auto flex max-w-[1440px] justify-end gap-2 px-4 py-3 sm:px-8">
          <Button size="l" onClick={() => router.push("/products")}>Cancel</Button>
          <Button size="l" variant="secondary" loading={busy} onClick={() => void save(true)}>Save & add another</Button>
          <Button size="l" variant="primary" loading={busy} onClick={() => void save(false)}>Save product</Button>
        </div>
      </div>
    </>
  );
}

"use client";
import { useMemo, useState } from "react";
import { Barcode, ImagePlus, Plus, RefreshCw, ScanBarcode, Star, Trash2, X, Upload, Info } from "lucide-react";
import { AddonInput, Badge, Button, Card, Field, Input, PageHeader, Select, Textarea, Toggle } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { categories, branches } from "@/lib/data";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";

const SECTIONS = ["Basic info", "Images", "Pricing", "Identifiers", "Inventory", "Variants", "Status"];

export default function ProductForm() {
  const { toast } = useApp();
  const [cost, setCost] = useState(905);
  const [price, setPrice] = useState(1100);
  const [track, setTrack] = useState(true);
  const [batch, setBatch] = useState(true);
  const [active, setActive] = useState(true);
  const [pos, setPos] = useState(true);
  const [primary, setPrimary] = useState(0);
  const [opts, setOpts] = useState([{ name: "Flavour", values: ["Vanilla", "Chocolate", "Strawberry"] }, { name: "Size", values: ["1L", "2L"] }]);
  const margin = price ? ((price - cost) / price) * 100 : 0;
  const matrix = useMemo(() => opts.reduce<string[][]>((acc, o) => acc.flatMap((a) => o.values.map((v) => [...a, v])), [[]]), [opts]);
  return (
    <>
      <PageHeader title="Elephant House Ice Cream" sub="Edit product · last updated 19/11/2026 by Dilani F." crumbs={["Products", "All products", "Edit"]} />
      <SubNav module="products" />
      <div className="grid gap-6 pb-24 lg:grid-cols-[200px_1fr]">
        <nav className="sticky top-24 hidden h-fit space-y-1 lg:block" aria-label="Form sections">
          {SECTIONS.map((s, i) => <a key={s} href={`#s${i}`} className={cn("flex h-10 items-center rounded-ctl px-3 text-sm font-medium", i === 0 ? "bg-tint text-fg" : "text-fg2 hover:bg-tint hover:text-fg")}>{s}</a>)}
        </nav>
        <div className="space-y-6">
          <Card title="Basic info" className="scroll-mt-24" sub="Shown on receipts and the POS">
            <div id="s0" className="grid gap-4 md:grid-cols-2">
              <Field label="Product name (English)" required><Input defaultValue="Elephant House Ice Cream" /></Field>
              <Field label="Product name (සිංහල)" hint="Printed on Sinhala receipts"><Input defaultValue="එලිෆන්ට් හවුස් අයිස්ක්‍රීම්" className="font-[Noto_Sans_Sinhala]" /></Field>
              <Field label="Description" className="md:col-span-2"><Textarea defaultValue="Creamy Sri Lankan favourite. Keep frozen at −18°C." /></Field>
              <Field label="Category" required><Select options={categories.map((c) => c.name[0])} defaultValue="Dairy" /></Field>
              <Field label="Brand"><Select options={["Elephant House", "Anchor", "Munchee", "Highland", "Kotmale"]} /></Field>
              <Field label="Unit"><Select options={["pcs", "kg", "L", "pack"]} /></Field>
              <Field label="Supplier"><Select options={["Elephant House (Ceylon Cold Stores)", "Fonterra Brands Lanka"]} /></Field>
            </div>
          </Card>
          <Card title="Images">
            <div id="s1" className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <label className="grid aspect-square cursor-pointer place-items-center rounded-card border-2 border-dashed border-line bg-surface-2 text-center transition hover:border-orange-500">
                <span><Upload size={28} className="mx-auto text-fg2" /><span className="mt-2 block text-sm font-semibold">Drag & drop images</span><span className="text-cap text-fg2">PNG or JPG, up to 5 MB · or <u>browse</u></span></span>
                <input type="file" className="sr-only" multiple accept="image/*" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["#EAF0FB", "#FFF0E0", "#B9DDF7"].map((c, i) => (
                  <div key={i} className={cn("group relative aspect-square rounded-card border-2", primary === i ? "border-orange-500" : "border-transparent")} style={{ background: c }}>
                    <span className="absolute inset-0 grid place-items-center text-cap font-semibold text-navy-900/60">IMG_0{i + 1}.jpg</span>
                    {primary === i && <Badge tone="orange" className="absolute left-2 top-2"><Star size={12} className="fill-navy-900" />Primary</Badge>}
                    <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      {primary !== i && <button onClick={() => setPrimary(i)} className="h-8 flex-1 rounded-lg bg-white/90 text-[11px] font-semibold text-navy-900">Set as primary</button>}
                      <button aria-label="Remove image" className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-danger"><X size={14} /></button>
                    </div>
                  </div>
                ))}
                <button className="grid aspect-square place-items-center rounded-card border border-dashed border-line text-fg2 hover:bg-tint" aria-label="Add image"><ImagePlus size={24} /></button>
              </div>
            </div>
          </Card>
          <Card title="Pricing">
            <div id="s2" className="grid gap-4 md:grid-cols-3">
              <Field label="Cost price"><AddonInput prefix="Rs." inputMode="decimal" value={cost} onChange={(e) => setCost(+e.target.value || 0)} /></Field>
              <Field label="Selling price" required><AddonInput prefix="Rs." inputMode="decimal" value={price} onChange={(e) => setPrice(+e.target.value || 0)} /></Field>
              <Field label="Margin" hint="Calculated automatically">
                <div className={cn("flex h-11 items-center justify-between rounded-ctl px-3 font-semibold tnum", margin >= 15 ? "bg-success/10 text-success" : margin > 0 ? "bg-warning/15 text-[#8A6500]" : "bg-danger/10 text-danger")}>{margin.toFixed(1)}%<span className="text-cap font-medium">{rs(price - cost)} / unit</span></div>
              </Field>
              <Field label="Wholesale price"><AddonInput prefix="Rs." defaultValue="1,040.00" /></Field>
              <Field label="MRP" hint="Maximum retail price on pack"><AddonInput prefix="Rs." defaultValue="1,150.00" /></Field>
              <Field label="Tax class"><Select options={["VAT 18%", "VAT Exempt", "SSCL 2.5% + VAT"]} /></Field>
            </div>
          </Card>
          <Card title="Identifiers">
            <div id="s3" className="grid gap-4 md:grid-cols-2">
              <Field label="SKU"><div className="flex gap-2"><Input defaultValue="HD-DAI-1049" className="font-mono" /><Button icon={RefreshCw}>Generate</Button></div></Field>
              <Field label="Barcode (EAN-13)"><div className="flex gap-2"><Input defaultValue="4791034071232" className="font-mono" /><Button icon={ScanBarcode} aria-label="Scan barcode" /><Button icon={Barcode}>Generate</Button></div></Field>
            </div>
          </Card>
          <Card title="Inventory">
            <div id="s4" className="space-y-5">
              <div className="flex flex-wrap gap-8"><Toggle checked={track} onChange={setTrack} label="Track stock" /><Toggle checked={batch} onChange={setBatch} label="Batch & expiry tracking" /></div>
              {track && (
                <div className="overflow-x-auto rounded-card border border-line">
                  <table className="tbl"><thead><tr><th>Branch</th><th>Opening stock</th><th>Reorder level</th><th>Location</th></tr></thead>
                    <tbody>{branches.map((b, i) => <tr key={b.id}><td className="font-semibold">{b.name}</td><td><Input defaultValue={[34, 22, 12][i]} className="h-10 w-28" inputMode="numeric" /></td><td><Input defaultValue={[12, 10, 6][i]} className="h-10 w-28" inputMode="numeric" /></td><td><Input defaultValue={["Freezer A2", "Freezer 1", "Chiller"][i]} className="h-10 w-40" /></td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
          <Card title="Variants" sub={`${matrix.length} variants generated`} action={<Button icon={Plus} size="s" onClick={() => setOpts([...opts, { name: "Pack", values: ["Single"] }])}>Add option</Button>}>
            <div id="s5" className="space-y-3">
              {opts.map((o, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-card border border-line p-3">
                  <Input value={o.name} onChange={(e) => setOpts(opts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="h-10 w-36 font-semibold" aria-label="Option name" />
                  {o.values.map((v) => <span key={v} className="inline-flex h-9 items-center gap-1 rounded-full bg-tint pl-3 pr-1 text-sm font-medium">{v}<button aria-label={`Remove ${v}`} onClick={() => setOpts(opts.map((x, j) => (j === i ? { ...x, values: x.values.filter((y) => y !== v) } : x)))} className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface"><X size={13} /></button></span>)}
                  <input placeholder="+ Add value, press Enter" className="h-9 min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted" onKeyDown={(e) => { if (e.key === "Enter" && e.currentTarget.value) { const v = e.currentTarget.value; setOpts(opts.map((x, j) => (j === i ? { ...x, values: [...x.values, v] } : x))); e.currentTarget.value = ""; } }} />
                  <button aria-label="Remove option" onClick={() => setOpts(opts.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-fg2 hover:bg-danger/10 hover:text-danger"><Trash2 size={16} /></button>
                </div>
              ))}
              <div className="overflow-x-auto rounded-card border border-line">
                <table className="tbl"><thead><tr><th>Variant</th><th>Price</th><th>SKU</th><th>Stock</th></tr></thead>
                  <tbody>{matrix.map((m, i) => <tr key={m.join()}><td className="font-semibold">{m.join(" / ")}</td><td><AddonInput prefix="Rs." defaultValue={(m.includes("2L") ? 2050 : 1100).toFixed(2)} className="h-10 w-36" /></td><td><Input defaultValue={`HD-DAI-1049-${String(i + 1).padStart(2, "0")}`} className="h-10 w-44 font-mono text-cap" /></td><td><Input defaultValue={[12, 8, 5, 6, 3, 0][i % 6]} className="h-10 w-20" inputMode="numeric" /></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </Card>
          <Card title="Status & visibility">
            <div id="s6" className="flex flex-wrap gap-8"><Toggle checked={active} onChange={setActive} label="Active" /><Toggle checked={pos} onChange={setPos} label="Show on POS" /><Toggle checked={false} label="Show in online store" /><Toggle checked label="Allow discounts" /></div>
          </Card>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur lg:left-[var(--sb,264px)]">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-8">
          <span className="hidden items-center gap-2 text-sm text-fg2 sm:flex"><Info size={16} />Unsaved changes</span>
          <div className="ml-auto flex gap-2"><Button size="l">Discard</Button><Button size="l" variant="secondary">Save & add another</Button><Button size="l" variant="primary" onClick={() => toast({ tone: "success", title: "Product saved", body: "Elephant House Ice Cream · 6 variants" })}>Save product</Button></div>
        </div>
      </div>
    </>
  );
}

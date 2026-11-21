"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileSpreadsheet, UploadCloud, XCircle, AlertTriangle } from "lucide-react";
import { Button, Card, PageHeader, Select, Steps, StatCard } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { cn } from "@/lib/format";

const cols = [["Item Name", "Product name"], ["Item Code", "SKU"], ["EAN", "Barcode"], ["Category", "Category"], ["Cost", "Cost price"], ["Retail", "Selling price"], ["Qty", "Opening stock"], ["Sinhala Name", "Product name (සිංහල)"]];
const rows = [
  { n: "Lanka Soy Wada Mix 200g", sku: "LS-200", bc: "4792088100212", cat: "Grocery", cost: "185", price: "230", qty: "48", err: [] as string[] },
  { n: "Kist Tomato Sauce 400g", sku: "KS-400", bc: "4791034000123", cat: "Grocery", cost: "410", price: "495", qty: "36", err: [] },
  { n: "Astra Margarine 250g", sku: "AS-250", bc: "479103", cat: "Dairy", cost: "520", price: "610", qty: "24", err: ["bc"] },
  { n: "Wijaya Chilli Powder 100g", sku: "WJ-100", bc: "4792145001001", cat: "Spices", cost: "290", price: "", qty: "60", err: ["price", "cat"] },
  { n: "Raigam Salt 1kg", sku: "RG-1000", bc: "4792188000017", cat: "Grocery", cost: "110", price: "140", qty: "120", err: [] },
  { n: "Ceylinco Tea Buds 400g", sku: "LS-200", bc: "4792200400011", cat: "Tea & Coffee", cost: "980", price: "1150", qty: "18", err: ["sku"] },
];

export default function Import() {
  const [step, setStep] = useState(2);
  return (
    <>
      <PageHeader title="Bulk import" sub="Add or update many products from a CSV or Excel file" actions={<Button icon={Download}>Download template</Button>} />
      <SubNav module="products" />
      <div className="card mb-6 p-5"><Steps steps={["Upload file", "Map columns", "Preview & validate", "Summary"]} current={step} /></div>
      {step === 0 && (
        <label className="card grid cursor-pointer place-items-center border-2 border-dashed p-16 text-center hover:border-orange-500">
          <span><UploadCloud size={44} className="mx-auto text-fg2" /><span className="mt-4 block font-heading text-lg font-semibold">Drop your file here</span><span className="text-sm text-fg2">.csv, .xlsx up to 10 MB · or click to browse</span></span>
          <input type="file" className="sr-only" accept=".csv,.xlsx" onChange={() => setStep(1)} />
        </label>
      )}
      {step === 1 && (
        <Card title="Map columns" sub="supplier_pricelist_nov.xlsx · 248 rows">
          <div className="divide-y divide-line rounded-card border border-line">
            {cols.map(([a, b]) => (
              <div key={a} className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr]"><span className="flex items-center gap-2 font-semibold"><FileSpreadsheet size={16} className="text-success" />{a}</span><ArrowRight size={16} className="hidden text-fg2 sm:block" /><Select options={[b, "— Skip column —", "Brand", "Unit", "MRP"]} /></div>
            ))}
          </div>
        </Card>
      )}
      {step === 2 && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className="card flex items-center gap-3 p-4"><CheckCircle2 className="text-success" /><span><b className="tnum">244</b> rows ready</span></div>
            <div className="card flex items-center gap-3 p-4"><XCircle className="text-danger" /><span><b className="tnum">4</b> rows with errors — fix or skip</span></div>
            <div className="card flex items-center gap-3 p-4"><AlertTriangle className="text-warning" /><span><b className="tnum">17</b> will update existing products</span></div>
          </div>
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Row</th><th>Product name</th><th>SKU</th><th>Barcode</th><th>Category</th><th className="text-right">Cost</th><th className="text-right">Price</th><th className="text-right">Stock</th><th>Issues</th></tr></thead>
              <tbody>
                {rows.map((r, i) => {
                  const bad = (k: string) => r.err.includes(k) && "bg-danger/10 text-danger font-semibold ring-1 ring-inset ring-danger/40";
                  return (
                    <tr key={i} className={cn(r.err.length && "bg-danger/[.03]")}>
                      <td className="text-fg2">{i + 2}</td><td className="font-semibold">{r.n}</td>
                      <td className={cn("font-mono text-cap", bad("sku"))}>{r.sku}</td><td className={cn("font-mono text-cap", bad("bc"))}>{r.bc}</td>
                      <td className={cn(bad("cat"))}>{r.cat}</td><td className="text-right">{r.cost}</td><td className={cn("text-right", bad("price"))}>{r.price || "—"}</td><td className="text-right">{r.qty}</td>
                      <td>{r.err.length ? <span className="inline-flex items-center gap-1 text-cap font-semibold text-danger"><XCircle size={14} />{r.err.map((e) => ({ bc: "Barcode must be 13 digits", price: "Price missing", cat: "Unknown category “Spices”", sku: "Duplicate SKU (row 2)" })[e]).join(" · ")}</span> : <span className="inline-flex items-center gap-1 text-cap font-semibold text-success"><CheckCircle2 size={14} />OK</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {step === 3 && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Created" value="227" delta={0} foot="new products" />
          <StatCard label="Updated" value="17" delta={0} foot="prices & stock" />
          <StatCard label="Skipped" value="4" delta={0} foot="see error file" />
          <div className="card flex flex-col justify-center gap-2 p-5"><Button icon={Download}>Error report (.csv)</Button></div>
        </div>
      )}
      <div className="mt-6 flex justify-between">
        <Button icon={ArrowLeft} size="l" disabled={!step} onClick={() => setStep(step - 1)}>Back</Button>
        {step < 3 && <Button variant="primary" size="l" iconRight={ArrowRight} onClick={() => setStep(step + 1)}>{step === 2 ? "Import 244 products" : "Continue"}</Button>}
      </div>
    </>
  );
}

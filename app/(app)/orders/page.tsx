"use client";
import { useCallback, useEffect, useState } from "react";
import { OrderDetail } from "@/components/order-detail";
import { Pager } from "@/components/pager";
import { PageHeader, SearchInput, Status } from "@/components/ui";
import { DataTable } from "@/components/table";
import { apiPage, errText, METHOD, STATUS, type Meta } from "@/lib/api";
import { ddmmyyyy, hhmm, rs } from "@/lib/format";

type Row = { id: string; number: string; soldAt: string; status: string; total: number; customer: { name: string } | null; cashier: { name: string }; branch: { name: string }; payments: { method: string; amount: number }[]; _count: { items: number } };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
const sel = "field h-11 w-full sm:w-auto sm:min-w-[150px]";

export default function Orders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (method) p.set("method", method);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    try { const r = await apiPage<Row>(`/sales?${p}`); setRows(r.rows); setMeta(r.meta); }
    catch (e) { setErr(errText(e)); setRows([]); setMeta(null); }
    finally { setLoading(false); }
  }, [page, q, status, method, from, to]);
  useEffect(() => { const h = setTimeout(() => void load(), q ? 250 : 0); return () => clearTimeout(h); }, [load, q]);
  const f = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  return (
    <>
      <PageHeader title="Orders" sub={meta ? `${meta.total.toLocaleString()} sales in this period` : "Sales at this branch"} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search invoice or customer…" className="w-full sm:w-72" value={q} onChange={(e) => f(setQ)(e.target.value)} />
        <select aria-label="Status" className={sel} value={status} onChange={(e) => f(setStatus)(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select aria-label="Payment method" className={sel} value={method} onChange={(e) => f(setMethod)(e.target.value)}><option value="">All payment methods</option>{Object.entries(METHOD).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input type="date" aria-label="From date" className={sel} value={from} max={to} onChange={(e) => f(setFrom)(e.target.value)} />
        <input type="date" aria-label="To date" className={sel} value={to} min={from} onChange={(e) => f(setTo)(e.target.value)} />
      </div>
      {err && <p role="alert" className="mb-4 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
      <DataTable rows={rows} loading={loading} pageSize={20} onRow={(r) => setOpen(r.id)} selectedId={open ?? undefined} footer={meta ? <Pager meta={meta} onPage={setPage} /> : undefined}
        cols={[
          { key: "number", label: "Invoice #", render: (o) => <span className="font-semibold">{o.number}</span> },
          { key: "date", label: "Date / time", render: (o) => <span className="text-fg2">{ddmmyyyy(new Date(o.soldAt))} · {hhmm(new Date(o.soldAt))}</span> },
          { key: "customer", label: "Customer", render: (o) => o.customer?.name ?? "Walk-in Customer" },
          { key: "cashier", label: "Cashier", render: (o) => <span className="text-fg2">{o.cashier.name}</span> },
          { key: "items", label: "Lines", align: "right", render: (o) => o._count.items },
          { key: "total", label: "Total", align: "right", render: (o) => <span className="font-semibold">{rs(o.total)}</span>, sort: (o) => o.total },
          { key: "method", label: "Payment", render: (o) => <span className="text-fg2">{[...new Set(o.payments.filter((p) => p.amount > 0).map((p) => METHOD[p.method] ?? p.method))].join(" + ")}</span> },
          { key: "status", label: "Status", render: (o) => <Status s={STATUS[o.status]} /> },
        ]} />
      <OrderDetail id={open} onClose={() => setOpen(null)} onChanged={() => void load()} />
    </>
  );
}

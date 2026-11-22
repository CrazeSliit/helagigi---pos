"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { Avatar, PageHeader, Status } from "@/components/ui";
import { SubNav } from "@/components/shell";
import { DataTable } from "@/components/table";
import { Pager } from "@/components/pager";
import { api, apiPage, errText, type Meta } from "@/lib/api";
import { cn, ddmmyyyy, hhmm, rs } from "@/lib/format";
import { can, useSession } from "@/lib/session";
import { useApp } from "@/lib/store";

type Row = { id: string; number: string; userId: string; status: "OPEN" | "CLOSED" | "APPROVED"; openedAt: string; closedAt: string | null; expectedCash: number | null; countedCash: number | null; variance: number | null; user: { id: string; name: string }; branch: { name: string } };
const dur = (a: string, b: string | null) => { const m = Math.max(0, Math.floor(((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / 60000)); return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`; };

export default function ShiftHistory() {
  const { me } = useSession();
  const { toast } = useApp();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try { const r = await apiPage<Row>(`/shifts?page=${page}&limit=20`); setRows(r.rows); setMeta(r.meta); }
    catch (e) { setErr(errText(e)); } finally { setLoading(false); }
  }, [page]);
  useEffect(() => { void load(); }, [load]);
  const approve = async (r: Row) => {
    if (r.status !== "CLOSED") return toast({ tone: "info", title: "Only closed shifts with a variance need approval" });
    try { await api(`/shifts/${r.id}/approve`, { body: {} }); toast({ tone: "success", title: `${r.number} approved` }); await load(); }
    catch (e) { toast({ tone: "error", title: "Couldn't approve", body: errText(e) }); }
  };
  const actions = [{ label: "View report", icon: FileText, onClick: (r: Row) => router.push(`/register/z-report?id=${r.id}`) }, ...(can(me, "shift.approve") ? [{ label: "Approve variance", icon: CheckCircle2, onClick: (r: Row) => void approve(r) }] : [])];
  return (
    <>
      <PageHeader title="Shift history" />
      <SubNav module="register" />
      {err && <p role="alert" className="mb-4 rounded-card bg-danger/10 p-3 text-sm font-medium text-danger">{err}</p>}
      <DataTable rows={rows} loading={loading} pageSize={20} rowActions={actions} footer={meta ? <Pager meta={meta} onPage={setPage} /> : undefined} cols={[
        { key: "who", label: "Cashier", render: (r) => <span className="flex items-center gap-2.5"><Avatar name={r.user.name} size={30} /><span className="font-semibold">{r.user.name}</span></span> },
        { key: "number", label: "Shift", render: (r) => <span className="font-mono text-cap text-fg2">{r.number}</span> },
        { key: "date", label: "Date", render: (r) => <span className="text-fg2">{ddmmyyyy(new Date(r.openedAt))}</span> },
        { key: "time", label: "Time", render: (r) => <span className="text-fg2">{hhmm(new Date(r.openedAt))} – {r.closedAt ? hhmm(new Date(r.closedAt)) : "now"}</span> },
        { key: "dur", label: "Duration", render: (r) => dur(r.openedAt, r.closedAt) },
        { key: "v", label: "Variance", align: "right", render: (r) => { const v = r.variance; return v == null ? <span className="text-fg2">—</span> : <span className={cn("font-semibold", v < 0 ? "text-danger" : v > 0 ? "text-[#8A6500] dark:text-warning" : "text-success")}>{v === 0 ? rs(0) : `${v > 0 ? "+" : "−"} ${rs(Math.abs(v))}`}</span>; } },
        { key: "s", label: "Result", render: (r) => r.status === "OPEN" ? <Status s="Active" label="Open" /> : <Status s={!r.variance ? "Balanced" : r.variance < 0 ? "Short" : "Over"} label={r.status === "CLOSED" && r.variance ? `${r.variance < 0 ? "Short" : "Over"} · needs approval` : undefined} /> },
      ]} />
    </>
  );
}

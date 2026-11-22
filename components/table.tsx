"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Filter, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/format";
import { Button, Checkbox, EmptyState, Pagination, SearchInput, Select, Skeleton } from "./ui";
import { Dropdown, MenuItem } from "./overlays";

export type Col<T> = { key: string; label: string; render?: (r: T) => ReactNode; sort?: (r: T) => number | string; align?: "right" | "center"; className?: string };

export function DataTable<T extends { id: string | number }>({
  rows, cols, selectable, bulk, rowActions, onRow, loading, empty, pageSize = 10, total, selectedId, footer,
}: {
  rows: T[]; cols: Col<T>[]; selectable?: boolean; bulk?: { label: string; icon?: React.ComponentType<{ size?: number }>; danger?: boolean }[];
  rowActions?: { label: string; icon?: React.ComponentType<{ size?: number }>; danger?: boolean; onClick?: (r: T) => void }[];
  onRow?: (r: T) => void; loading?: boolean; empty?: ReactNode; pageSize?: number; total?: number; selectedId?: string | number; footer?: ReactNode;
}) {
  const [sel, setSel] = useState<Set<string | number>>(new Set());
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = cols.find((x) => x.key === sort.k);
    if (!c?.sort) return rows;
    return [...rows].sort((a, b) => (c.sort!(a) > c.sort!(b) ? 1 : -1) * sort.dir);
  }, [rows, sort, cols]);
  const shown = sorted.slice(0, pageSize);
  const all = shown.length > 0 && shown.every((r) => sel.has(r.id));

  return (
    <div className="card overflow-hidden">
      {selectable && sel.size > 0 && bulk && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-navy-900 px-4 py-2.5 text-white dark:bg-navy-700">
          <span className="text-sm font-semibold tnum">{sel.size} selected</span>
          <span className="mx-2 h-5 w-px bg-white/20" />
          {bulk.map((b) => (
            <button key={b.label} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold hover:bg-white/10", b.danger && "text-red-300")}>
              {b.icon && <b.icon size={16} />}{b.label}
            </button>
          ))}
          <button onClick={() => setSel(new Set())} className="ml-auto grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10" aria-label="Clear selection"><X size={18} /></button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              {selectable && <th className="w-12"><Checkbox checked={all} indeterminate={!all && sel.size > 0} onChange={() => setSel(all ? new Set() : new Set(shown.map((r) => r.id)))} /></th>}
              {cols.map((c) => (
                <th key={c.key} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center")}>
                  {c.sort ? (
                    <button className="inline-flex items-center gap-1 uppercase hover:text-fg" onClick={() => setSort(sort?.k === c.key ? { k: c.key, dir: sort.dir === 1 ? -1 : 1 } : { k: c.key, dir: -1 })}>
                      {c.label}
                      {sort?.k === c.key ? (sort.dir === 1 ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-50" />}
                    </button>
                  ) : c.label}
                </th>
              ))}
              {rowActions && <th className="w-12" />}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{selectable && <td><Skeleton className="h-5 w-5" /></td>}{cols.map((c) => <td key={c.key}><Skeleton className="h-4 w-3/4" /></td>)}{rowActions && <td />}</tr>
                ))
              : shown.map((r) => (
                  <tr key={r.id} onClick={() => onRow?.(r)} className={cn(onRow && "cursor-pointer", (sel.has(r.id) || selectedId === r.id) && "sel")}>
                    {selectable && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={sel.has(r.id)} onChange={() => { const n = new Set(sel); n.has(r.id) ? n.delete(r.id) : n.add(r.id); setSel(n); }} />
                      </td>
                    )}
                    {cols.map((c) => (
                      <td key={c.key} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                        {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}
                      </td>
                    ))}
                    {rowActions && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <Dropdown trigger={() => <button className="icon-btn h-9 w-9" aria-label="Row actions"><MoreHorizontal size={18} /></button>} width="w-48">
                          {(close) => rowActions.map((a) => <MenuItem key={a.label} icon={a.icon} danger={a.danger} onClick={() => { a.onClick?.(r); close(); }}>{a.label}</MenuItem>)}
                        </Dropdown>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (empty ?? <EmptyState title="Nothing here yet" body="Try changing the filters or date range." />)}
      </div>
      {rows.length > 0 && (footer ?? <Pagination total={total ?? rows.length} pages={Math.max(1, Math.ceil((total ?? rows.length) / pageSize))} />)}
    </div>
  );
}

/** Standard filters bar used on list pages. */
export function FilterBar({ placeholder = "Search…", filters = [], children, onSearch, exportable = true }: { placeholder?: string; filters?: { label: string; options: string[] }[]; children?: ReactNode; onSearch?: (q: string) => void; exportable?: boolean }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SearchInput placeholder={placeholder} className="w-full sm:w-72" onChange={(e) => onSearch?.(e.target.value)} />
      {filters.map((f) => <Select key={f.label} aria-label={f.label} options={[f.label, ...f.options]} className="w-full sm:w-auto sm:min-w-[150px]" />)}
      <Button icon={Filter} variant="ghost">More filters</Button>
      <div className="ml-auto flex gap-2">
        {children}
        {exportable && (
          <Dropdown trigger={() => <Button icon={Download}>Export</Button>} width="w-40">
            <MenuItem>CSV</MenuItem><MenuItem>Excel</MenuItem><MenuItem>PDF</MenuItem>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Meta } from "@/lib/api";

export function Pager({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  const from = (meta.page - 1) * meta.limit + 1, to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-fg2">
      <span className="tnum">Showing {from}–{to} of {meta.total.toLocaleString()}</span>
      <div className="flex items-center gap-2">
        <button className="icon-btn h-9 w-9 disabled:opacity-40" aria-label="Previous page" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft size={18} /></button>
        <span className="font-semibold tnum text-fg">{meta.page} / {Math.max(1, meta.pages)}</span>
        <button className="icon-btn h-9 w-9 disabled:opacity-40" aria-label="Next page" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

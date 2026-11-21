"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Button } from "./ui";

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, sub, children, footer, size = "m", className, hideClose }: {
  open: boolean; onClose: () => void; title?: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; size?: "s" | "m" | "l" | "xl"; className?: string; hideClose?: boolean;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  const w = { s: "max-w-md", m: "max-w-xl", l: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn("relative flex max-h-[94vh] w-full flex-col rounded-t-modal bg-surface shadow-lift animate-rise sm:rounded-modal", w, className)}>
        {(title || !hideClose) && (
          <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div>{title && <h2 className="font-heading text-lg font-semibold">{title}</h2>}{sub && <p className="mt-0.5 text-sm text-fg2">{sub}</p>}</div>
            {!hideClose && <button onClick={onClose} className="icon-btn -mr-2 -mt-1" aria-label="Close"><X size={20} /></button>}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, body, confirmLabel = "Delete" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel?: string }) {
  return (
    <Modal open={open} onClose={onClose} size="s" hideClose>
      <div className="pt-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger"><AlertTriangle size={28} /></span>
        <h2 className="mt-4 font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-fg2">{body}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button size="l" onClick={onClose}>Cancel</Button>
          <Button size="l" variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}

export function Drawer({ open, onClose, title, sub, children, footer, width = "max-w-lg" }: { open: boolean; onClose: () => void; title?: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-900/40" onClick={onClose} />
      <aside className={cn("absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-lift animate-slidein", width)}>
        <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div>{title && <h2 className="font-heading text-lg font-semibold">{title}</h2>}{sub && <div className="mt-0.5 text-sm text-fg2">{sub}</div>}</div>
          <button onClick={onClose} className="icon-btn -mr-2" aria-label="Close"><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap gap-2 border-t border-line px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Toaster({ position = "top-right" }: { position?: "top-right" | "bottom" }) {
  const { toasts, dismiss } = useApp();
  const icon = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
  const tone = { success: "text-success", error: "text-danger", warning: "text-warning", info: "text-info" };
  return (
    <div className={cn("pointer-events-none fixed z-[70] flex flex-col gap-2", position === "top-right" ? "right-4 top-4 w-[360px] max-w-[calc(100vw-2rem)]" : "bottom-6 left-1/2 w-[420px] max-w-[calc(100vw-2rem)] -translate-x-1/2")}>
      {toasts.map((t) => {
        const I = icon[t.tone];
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-lift animate-rise">
            <I className={cn("mt-0.5 shrink-0", tone[t.tone])} size={20} />
            <div className="flex-1"><p className="text-sm font-semibold">{t.title}</p>{t.body && <p className="mt-0.5 text-cap text-fg2">{t.body}</p>}</div>
            <button onClick={() => dismiss(t.id)} className="text-fg2 hover:text-fg" aria-label="Dismiss"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}

export function Tooltip({ label, children, side = "top" }: { label: string; children: ReactNode; side?: "top" | "right" | "bottom" }) {
  const pos = { top: "bottom-full left-1/2 -translate-x-1/2 mb-2", right: "left-full top-1/2 -translate-y-1/2 ml-2", bottom: "top-full left-1/2 -translate-x-1/2 mt-2" }[side];
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span role="tooltip" className={cn("pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-navy-900 px-2.5 py-1.5 text-cap font-medium text-white opacity-0 shadow-lift transition group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 dark:bg-white dark:text-navy-900", pos)}>
        {label}
      </span>
    </span>
  );
}

export function Dropdown({ trigger, children, align = "right", width = "w-56" }: { trigger: (open: boolean) => ReactNode; children: ReactNode | ((close: () => void) => ReactNode); align?: "left" | "right"; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  useEsc(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger(open)}</div>
      {open && (
        <div className={cn("absolute z-40 mt-2 rounded-card border border-line bg-surface p-1.5 shadow-lift animate-rise", align === "right" ? "right-0" : "left-0", width)}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
export function MenuItem({ icon: I, children, onClick, danger, kbd }: { icon?: React.ComponentType<{ size?: number }>; children: ReactNode; onClick?: () => void; danger?: boolean; kbd?: string }) {
  return (
    <button onClick={onClick} className={cn("flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-medium transition", danger ? "text-danger hover:bg-danger/10" : "text-fg hover:bg-tint")}>
      {I && <I size={17} />}<span className="flex-1">{children}</span>{kbd && <span className="kbd text-fg2">{kbd}</span>}
    </button>
  );
}

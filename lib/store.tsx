"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Lang } from "./i18n";

export type Sync = "synced" | "syncing" | "offline";
export type Toast = { id: number; tone: "success" | "error" | "warning" | "info"; title: string; body?: string };

type Ctx = {
  theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void;
  lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string;
  collapsed: boolean; setCollapsed: (c: boolean) => void;
  branch: string; setBranch: (b: string) => void;
  sync: Sync; setSync: (s: Sync) => void;
  toasts: Toast[]; toast: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void;
  paletteOpen: boolean; setPaletteOpen: (o: boolean) => void;
  notifOpen: boolean; setNotifOpen: (o: boolean) => void;
};

const AppCtx = createContext<Ctx | null>(null);

function load<T>(k: string, d: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
}
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeS] = useState<"light" | "dark">("light");
  const [lang, setLangS] = useState<Lang>("en");
  const [collapsed, setCollapsedS] = useState(false);
  const [branch, setBranch] = useState("Colombo 03");
  const [sync, setSync] = useState<Sync>("synced");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const qt = q.get("theme"); const ql = q.get("lang");
    setThemeS(qt === "dark" || qt === "light" ? qt : load("hd.theme", "light"));
    setLangS(ql === "si" || ql === "ta" || ql === "en" ? (ql as Lang) : load("hd.lang", "en"));
    setCollapsedS(load("hd.collapsed", false));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setTheme = (t: "light" | "dark") => { setThemeS(t); save("hd.theme", t); };
  const setLang = (l: Lang) => { setLangS(l); save("hd.lang", l); };
  const setCollapsed = (c: boolean) => { setCollapsedS(c); save("hd.collapsed", c); };

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  // Ctrl/Cmd+K anywhere opens the command palette
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const t = useCallback((k: string) => translate(lang, k), [lang]);

  const value = useMemo(() => ({
    theme, setTheme, lang, setLang, t, collapsed, setCollapsed, branch, setBranch, sync, setSync,
    toasts, toast, dismiss, paletteOpen, setPaletteOpen, notifOpen, setNotifOpen,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, lang, t, collapsed, branch, sync, toasts, toast, dismiss, paletteOpen, notifOpen]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell, Check, ChevronDown, ChevronsLeft, ChevronsRight, CornerDownLeft, Languages, LifeBuoy, Lock, LogOut, Menu, Moon, RefreshCw,
  Search, Sun, User, Users2, Palette, Wifi, WifiOff, X, Package, ShoppingCart, Users, Zap, Store,
} from "lucide-react";
import { cn, rs } from "@/lib/format";
import { useApp } from "@/lib/store";
import { NAV, SUBNAV } from "@/lib/nav";
import { LANGS } from "@/lib/i18n";
import { notifications } from "@/lib/data";
import { api, errText } from "@/lib/api";
import { canOpen, isEnabled } from "@/lib/features";
import { branchOf, useSession } from "@/lib/session";
import { Logo, Icon } from "./brand";
import { Avatar, Tabs } from "./ui";
import { Dropdown, MenuItem, Toaster, Tooltip } from "./overlays";

const visibleNav = (perms: string[]) => NAV.map((g) => ({ ...g, items: g.items.filter((i) => canOpen(i.href, perms)) })).filter((g) => g.items.length);

/* ─────────── Sidebar ─────────── */
export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { collapsed, setCollapsed, t } = useApp();
  const { me } = useSession();
  const path = usePathname();
  const c = collapsed && !mobileOpen;
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-navy-900 text-white transition-[width,transform] duration-200 dark:bg-[#061029] dark:border-r dark:border-[#1E3466]",
        c ? "w-[72px]" : "w-[264px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        <div className={cn("flex h-16 shrink-0 items-center", c ? "justify-center px-2" : "justify-between px-4")}>
          {c ? (
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-ctl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wordmark.png" alt="HeladiGi" className="ml-[3px] h-auto w-[196px] max-w-none self-center justify-self-start" />
            </span>
          ) : <Logo tile pos className="w-[124px]" />}
          {mobileOpen && <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-ctl hover:bg-white/10" aria-label="Close menu"><X size={20} /></button>}
        </div>
        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
          {visibleNav(me.permissions).map((g) => (
            <div key={g.group} className="mt-4">
              {c ? <div className="mx-auto mb-2 h-px w-8 bg-white/15" /> : <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-white/50">{t(g.group)}</p>}
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = path === it.href || path.startsWith(it.href + "/");
                  const link = (
                    <Link href={it.href} onClick={onClose} aria-current={active ? "page" : undefined}
                      className={cn("relative flex h-11 items-center gap-3 rounded-ctl text-sm font-medium transition",
                        c ? "w-12 justify-center" : "px-3", active ? "bg-navy-700 text-white" : "text-white/75 hover:bg-white/[.07] hover:text-white")}>
                      {active && <span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r bg-orange-500" />}
                      <it.icon size={20} strokeWidth={1.75} className={active ? "text-orange-500" : ""} />
                      {!c && <span className="flex-1 truncate">{t(it.key)}</span>}
                      {!c && it.badge && <span className="rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-navy-900 tnum">{it.badge}</span>}
                      {c && it.badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />}
                    </Link>
                  );
                  return <li key={it.href}>{c ? <Tooltip label={t(it.key)} side="right">{link}</Tooltip> : link}</li>;
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <div className={cn("flex items-center gap-3 rounded-ctl bg-white/[.06] p-2", c && "justify-center bg-transparent p-0")}>
            <Avatar name={me.name} size={36} color={me.color} />
            {!c && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{me.name}</p><p className="truncate text-[11px] text-white/60">{me.role} · {branchOf(me)?.name}</p></div>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden h-10 w-full items-center justify-center gap-2 rounded-ctl text-cap font-medium text-white/60 hover:bg-white/[.07] hover:text-white lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} />Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────── Sync pill ─────────── */
export function SyncPill({ compact }: { compact?: boolean }) {
  const { sync, t } = useApp();
  const m = {
    synced: ["bg-success/10 text-success border-success/25", Wifi, t("t.synced")],
    syncing: ["bg-warning/15 text-[#7A5A00] border-warning/40 dark:text-warning", RefreshCw, t("t.syncing")],
    offline: ["bg-danger/10 text-danger border-danger/30", WifiOff, t("t.offline")],
  }[sync] as [string, typeof Wifi, string];
  const SI = m[1];
  return (
    <span role="status" className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-cap font-semibold", m[0])}>
      <SI size={14} className={sync === "syncing" ? "animate-spin" : ""} />
      <span className={cn(compact && "hidden xl:inline")}>{m[2]}</span>
    </span>
  );
}

export function LangSwitch({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useApp();
  return (
    <div className={cn("inline-flex h-9 items-center rounded-full border p-0.5", dark ? "border-white/20" : "border-line")} role="radiogroup" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.id} role="radio" aria-checked={lang === l.id} title={l.label} onClick={() => setLang(l.id)}
          className={cn("h-8 min-w-[36px] rounded-full px-2 text-cap font-semibold transition",
            lang === l.id ? "bg-navy-900 text-white dark:bg-orange-500 dark:text-navy-900" : dark ? "text-white/70 hover:text-white" : "text-fg2 hover:text-fg")}>
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="icon-btn" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

/* ─────────── Top bar ─────────── */
function titleFor(path: string, t: (k: string) => string) {
  for (const g of NAV) for (const it of g.items) if (path === it.href || path.startsWith(it.href + "/")) return { group: t(g.group), title: t(it.key) };
  if (path.startsWith("/notifications")) return { group: "", title: "Notifications" };
  if (path.startsWith("/help")) return { group: "", title: t("n.help") };
  if (path.startsWith("/design-system")) return { group: "", title: "Design System" };
  return { group: "", title: "HeladiGi POS" };
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, setPaletteOpen, toast } = useApp();
  const { me } = useSession();
  const path = usePathname();
  const tt = titleFor(path, t);
  const switchBranch = async (branchId: string, close: () => void) => {
    close();
    if (branchId === me.branchId) return;
    try { await api("/auth/branch", { body: { branchId } }); window.location.reload(); }
    catch (e) { toast({ tone: "error", title: "Couldn't switch branch", body: errText(e) }); }
  };
  const logout = async (to: string) => {
    try { await api("/auth/logout", { body: {} }); } finally { window.location.assign(to); }
  };
  const lock = async () => {
    try { await api("/auth/lock", { body: {} }); window.location.assign("/lock"); }
    catch (e) { toast({ tone: "error", title: "Couldn't lock", body: errText(e) }); }
  };
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:gap-3 sm:px-6">
      <button className="icon-btn lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={22} /></button>
      <div className="min-w-0 flex-1 lg:flex-none lg:w-56">
        {tt.group && <p className="hidden text-cap text-fg2 sm:block">{tt.group}</p>}
        <p className="truncate font-heading text-base font-semibold">{tt.title}</p>
      </div>
      <button onClick={() => setPaletteOpen(true)} className="hidden h-10 flex-1 items-center gap-2 rounded-ctl border border-line bg-surface-2 px-3 text-left text-sm text-muted transition hover:border-orange-500/50 md:flex md:max-w-md">
        <Search size={18} className="text-fg2" /><span className="flex-1 truncate">Go to a page…</span><span className="kbd text-fg2">Ctrl K</span>
      </button>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button onClick={() => setPaletteOpen(true)} className="icon-btn md:hidden" aria-label="Search"><Search size={20} /></button>
        {me.branches.length > 1 ? (
          <Dropdown align="right" width="w-64" trigger={(o) => (
            <button className="hidden h-9 items-center gap-2 whitespace-nowrap rounded-ctl border border-line px-3 text-sm font-semibold hover:bg-tint sm:inline-flex">
              <Store size={16} className="text-fg2" />{branchOf(me)?.name}<ChevronDown size={15} className={cn("transition", o && "rotate-180")} />
            </button>
          )}>
            {(close) => (
              <>
                <p className="px-2.5 pb-1 pt-1.5 text-cap font-semibold uppercase tracking-wide text-fg2">Switch branch</p>
                {me.branches.map((b) => (
                  <MenuItem key={b.id} onClick={() => void switchBranch(b.id, close)}>
                    <span className="flex items-center justify-between">{b.name}{me.branchId === b.id && <Check size={16} className="text-orange-500" />}</span>
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
        ) : <span className="hidden items-center gap-2 px-2 text-sm font-semibold sm:inline-flex"><Store size={16} className="text-fg2" />{branchOf(me)?.name}</span>}
        <span className="hidden md:inline-flex"><SyncPill compact /></span>
        <span className="hidden xl:inline-flex"><LangSwitch /></span>
        <Dropdown align="right" width="w-44" trigger={() => <button className="icon-btn hidden sm:inline-flex xl:hidden" aria-label="Language"><Languages size={20} /></button>}>
          <div className="p-1.5"><LangSwitch /></div>
        </Dropdown>
        <ThemeToggle />
        <Dropdown align="right" width="w-60" trigger={() => (
          <button className="flex items-center gap-2 rounded-full p-0.5 pr-1 hover:bg-tint" aria-label="User menu"><Avatar name={me.name} size={36} color={me.color} /><ChevronDown size={15} className="hidden text-fg2 sm:block" /></button>
        )}>
          <div className="flex items-center gap-3 border-b border-line px-2.5 pb-3 pt-2"><Avatar name={me.name} size={40} color={me.color} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{me.name}</p><p className="truncate text-cap text-fg2">{me.role}{me.email ? ` · ${me.email}` : ""}</p></div></div>
          <div className="pt-1.5">
            <div className="px-1.5 pb-2 sm:hidden"><LangSwitch /></div>
            <MenuItem icon={Users2} onClick={() => void logout("/login/pin")}>Switch user</MenuItem>
            <MenuItem icon={Lock} onClick={() => void lock()}>Lock screen</MenuItem>
            <MenuItem icon={LogOut} danger onClick={() => void logout("/login")}>Log out</MenuItem>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}

/* ─────────── Command palette (Ctrl+K) ─────────── */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, t } = useApp();
  const { me } = useSession();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const groups = useMemo(() => {
    const m = (s: string) => s.toLowerCase().includes(q.toLowerCase());
    return [
      { g: "Go to", icon: Zap, items: visibleNav(me.permissions).flatMap((n) => n.items).filter((it) => m(t(it.key))).map((it) => ({ label: t(it.key), meta: "Page", href: it.href })) },
    ].filter((g) => g.items.length);
  }, [q, t, me.permissions]);
  const flat = groups.flatMap((g) => g.items);
  useEffect(() => { setI(0); }, [q]);
  useEffect(() => { if (!paletteOpen) setQ(""); }, [paletteOpen]);
  if (!paletteOpen) return null;
  const go = (href: string) => { setPaletteOpen(false); router.push(href); };
  let n = -1;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-[2px]" onClick={() => setPaletteOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-modal border border-line bg-surface shadow-lift animate-rise">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={20} className="text-fg2" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Go to a page…"
            onKeyDown={(e) => {
              if (e.key === "Escape") setPaletteOpen(false);
              if (e.key === "ArrowDown") { e.preventDefault(); setI(Math.min(flat.length - 1, i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI(Math.max(0, i - 1)); }
              if (e.key === "Enter" && flat[i]) go(flat[i].href);
            }}
            className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted" />
          <span className="kbd text-fg2">Esc</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {groups.map((g) => (
            <div key={g.g} className="mb-1">
              <p className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-cap font-semibold uppercase tracking-wide text-fg2"><g.icon size={13} />{g.g}</p>
              {g.items.map((it) => {
                n++; const on = n === i; const idx = n;
                return (
                  <button key={it.label + idx} onMouseEnter={() => setI(idx)} onClick={() => go(it.href)}
                    className={cn("flex h-12 w-full items-center gap-3 rounded-ctl px-3 text-left", on ? "bg-tint" : "")}>
                    {"ico" in it && it.ico ? <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-100 text-navy-900"><Icon name={it.ico as string} size={16} /></span> : <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-fg2"><g.icon size={16} /></span>}
                    <span className="flex-1 truncate text-sm font-medium">{it.label}</span>
                    <span className="text-cap text-fg2 tnum">{it.meta}</span>
                    {on && <CornerDownLeft size={15} className="text-fg2" />}
                  </button>
                );
              })}
            </div>
          ))}
          {!groups.length && <p className="px-3 py-10 text-center text-sm text-fg2">No results for “{q}”</p>}
        </div>
        <div className="flex gap-4 border-t border-line bg-surface-2 px-4 py-2.5 text-cap text-fg2"><span><span className="kbd">↑↓</span> navigate</span><span><span className="kbd">↵</span> open</span><span><span className="kbd">Esc</span> close</span></div>
      </div>
    </div>
  );
}

/* ─────────── Notifications slide-over ─────────── */
const TONE: Record<string, string> = { warning: "bg-warning/15 text-[#7A5A00] dark:text-warning", danger: "bg-danger/10 text-danger", info: "bg-info/10 text-info", success: "bg-success/10 text-success" };
export function NotificationList({ filter, compact }: { filter: string; compact?: boolean }) {
  const list = notifications.filter((n) => filter === "All" || n.type === filter);
  return (
    <ul className="divide-y divide-line">
      {list.map((n) => (
        <li key={n.id} className={cn("flex gap-3 py-4", compact ? "px-1" : "px-5", n.unread && "relative")}>
          {n.unread && <span className="absolute left-0 top-6 h-2 w-2 rounded-full bg-orange-500" aria-label="Unread" />}
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-ctl", TONE[n.tone])}><Icon name={n.icon} size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-sm", n.unread ? "font-semibold" : "text-fg")}>{n.msg}</p>
            <div className="mt-1 flex items-center gap-3 text-cap"><span className="text-fg2">{n.time}</span><button className="font-semibold text-orange-600 hover:underline dark:text-orange-500">{n.action} →</button></div>
          </div>
        </li>
      ))}
    </ul>
  );
}
export function NotificationsPanel() {
  const { notifOpen, setNotifOpen } = useApp();
  const [tab, setTab] = useState("All");
  if (!notifOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notifications">
      <div className="absolute inset-0 bg-navy-900/30" onClick={() => setNotifOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-lift animate-slidein">
        <header className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-heading text-lg font-semibold">Notifications</h2>
          <div className="flex items-center gap-1"><button className="h-9 rounded-lg px-3 text-cap font-semibold text-fg2 hover:bg-tint hover:text-fg">Mark all as read</button><button onClick={() => setNotifOpen(false)} className="icon-btn" aria-label="Close"><X size={20} /></button></div>
        </header>
        <Tabs className="px-5" value={tab} onChange={setTab} tabs={[{ v: "All", label: "All", count: 6 }, { v: "Stock Alerts", label: "Stock", count: 2 }, { v: "Sales", label: "Sales", count: 2 }, { v: "System", label: "System", count: 2 }]} />
        <div className="flex-1 overflow-y-auto"><NotificationList filter={tab} /></div>
        <Link href="/notifications" onClick={() => setNotifOpen(false)} className="border-t border-line py-4 text-center text-sm font-semibold text-fg hover:bg-tint">View all notifications</Link>
      </aside>
    </div>
  );
}

/* ─────────── App shell ─────────── */
export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed } = useApp();
  const [mobile, setMobile] = useState(false);
  const path = usePathname();
  useEffect(() => setMobile(false), [path]);
  return (
    <div className="min-h-screen" style={{ ["--sb" as string]: collapsed ? "72px" : "264px" }}>
      <Sidebar mobileOpen={mobile} onClose={() => setMobile(false)} />
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]")}>
        <Topbar onMenu={() => setMobile(true)} />
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}

/** Module sub-navigation tabs. */
export function SubNav({ module }: { module: string }) {
  const path = usePathname();
  const { me } = useSession();
  const items = (SUBNAV[module] ?? []).filter((i) => isEnabled(i.href) && canOpen(i.href, me.permissions));
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => path === i.href || path.startsWith(i.href + "/"));
  return (
    <nav className="-mt-2 mb-6 flex gap-1 overflow-x-auto border-b border-line no-scrollbar" aria-label="Section">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={active?.href === i.href ? "page" : undefined}
          className={cn("relative flex h-11 items-center whitespace-nowrap px-3 text-sm font-semibold transition", active?.href === i.href ? "text-fg" : "text-fg2 hover:text-fg")}>
          {i.label}{active?.href === i.href && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t bg-orange-500" />}
        </Link>
      ))}
    </nav>
  );
}

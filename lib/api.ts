"use client";
import type { Customer, Product } from "./data";

export class ApiFail extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}

type Opts = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; noRedirect?: boolean };

async function call(path: string, o: Opts = {}) {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method: o.method ?? (o.body !== undefined ? "POST" : "GET"), credentials: "same-origin",
      headers: o.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
    });
  } catch {
    throw new ApiFail(0, "network", "Can't reach the server. Check your connection and try again.");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (!o.noRedirect && res.status === 401) window.location.assign("/login");
    if (!o.noRedirect && res.status === 423) window.location.assign("/lock");
    throw new ApiFail(res.status, json?.error?.code ?? "error", json?.error?.message ?? "Something went wrong", json?.error?.details);
  }
  return json;
}
export const api = async <T,>(path: string, o?: Opts) => (await call(path, o)).data as T;
export type Meta = { total: number; page: number; limit: number; pages: number };
export const apiPage = async <T,>(path: string) => { const j = await call(path); return { rows: j.data as T[], meta: j.meta as Meta }; };
export async function apiAll<T>(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const out: T[] = [];
  for (let page = 1; ; page++) {
    const { rows, meta } = await apiPage<T>(`${path}${sep}limit=200&page=${page}`);
    out.push(...rows);
    if (page >= meta.pages) return out;
  }
}
export const errText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** Works on plain http LAN terminals, where crypto.randomUUID is unavailable. */
export const newKey = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

export type ApiProduct = {
  id: string; sku: string; barcode: string | null; name: string; nameSi: string | null; nameTa: string | null; description: string | null; price: number; cost?: number; mrp: number | null;
  stock: number; reorderLevel: number; icon: string | null; weighed: boolean; favorite: boolean; trackStock: boolean; active: boolean; variantGroups: { group: string; options: string[] }[] | null;
  categoryId: string; brandId: string | null; unitId: string; taxRateId: string | null;
  category: { id: string; code: string; name: string }; brand: { id: string; name: string } | null; unit: { id: string; code: string; name: string };
};
export const toProduct = (p: ApiProduct): Product => ({
  id: p.id, name: p.name, si: p.nameSi ?? undefined, brand: p.brand?.name ?? "", cat: p.category.code, price: p.price, cost: p.cost ?? 0, mrp: p.mrp ?? undefined,
  stock: p.trackStock ? p.stock : 999999, reorder: p.reorderLevel, unit: p.unit.code as Product["unit"], sku: p.sku, barcode: p.barcode ?? "", icon: p.icon ?? "Package",
  weighed: p.weighed, variants: p.variantGroups ?? undefined, fav: p.favorite, active: p.active,
});

export type ApiCustomer = { id: string; name: string; phone: string | null; email: string | null; tier: "SILVER" | "GOLD" | "PLATINUM"; points: number; balance: number; creditLimit: number; totalSpent: number; visits: number; group?: { name: string } | null };
const TIER = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" } as const;
export const toCustomer = (c: ApiCustomer): Customer => ({
  id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "", group: (c.group?.name ?? "Retail") as Customer["group"], tier: TIER[c.tier],
  spent: c.totalSpent, visits: c.visits, points: c.points, credit: c.balance, limit: c.creditLimit, last: "", since: "",
});

export const STATUS: Record<string, string> = { COMPLETED: "Completed", ON_CREDIT: "On Credit", PARTIALLY_REFUNDED: "Partially Refunded", REFUNDED: "Refunded", VOIDED: "Voided" };
export const METHOD: Record<string, string> = { CASH: "Cash", CARD: "Card", LANKAQR: "LankaQR", CREDIT: "Credit", GIFT_CARD: "Gift Card", LOYALTY: "Loyalty" };

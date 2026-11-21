import clsx, { type ClassValue } from "clsx";

export const cn = (...c: ClassValue[]) => clsx(c);

/** Rs. 12,450.00 */
export function rs(n: number, opts: { decimals?: boolean; prefix?: boolean } = {}) {
  const { decimals = true, prefix = true } = opts;
  const s = Math.abs(n).toLocaleString("en-LK", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  return `${n < 0 ? "−" : ""}${prefix ? "Rs. " : ""}${s}`;
}

/** Compact Rs. 1.24M / Rs. 845K for charts and KPI tiles */
export function rsShort(n: number) {
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `Rs. ${n}`;
}

export const num = (n: number) => n.toLocaleString("en-LK");

/** DD/MM/YYYY in Asia/Colombo */
export function ddmmyyyy(d: Date) {
  return d.toLocaleDateString("en-GB", { timeZone: "Asia/Colombo", day: "2-digit", month: "2-digit", year: "numeric" });
}
export function hhmm(d: Date) {
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" });
}

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

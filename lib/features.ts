// Screens connected to the backend. Everything else stays in the codebase but is not reachable
// until it is connected: add its route here to switch it on.
import type { Permission } from "./server/permissions";

export const ENABLED: Record<string, Permission[]> = {
  "/pos": ["sales.make"],
  "/orders": ["sales.make", "reports.view"],
  "/products": [],
  "/products/new": ["products.edit"],
  "/register": ["shift.manage"],
  "/register/open": ["shift.manage"],
  "/register/close": ["shift.manage"],
  "/register/z-report": ["shift.manage", "reports.view"],
  "/register/history": ["shift.manage", "reports.view"],
};
export const PUBLIC_ROUTES = ["/", "/login", "/login/pin"];
export const SESSION_ROUTES = ["/branch-select", "/lock"];

export const isEnabled = (path: string) => Object.prototype.hasOwnProperty.call(ENABLED, path);
export const canOpen = (path: string, perms: string[]) => {
  if (!isEnabled(path)) return false;
  const need = ENABLED[path];
  return !need.length || need.some((p) => perms.includes(p));
};
export const homeFor = (perms: string[]) => (perms.includes("sales.make") ? "/pos" : perms.includes("reports.view") ? "/orders" : "/products");

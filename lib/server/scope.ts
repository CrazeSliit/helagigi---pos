import { z } from "zod";
import type { Auth } from "./auth";
import { ApiError, badRequest, forbidden } from "./http";

export const canAccessBranch = (a: Auth, id: string) => a.allBranches || a.branchIds.includes(id);

/** The branch of the current session; required for anything that moves stock or money. */
export function requireBranch(a: Auth) {
  if (!a.branchId) throw new ApiError(400, "branch_required", "Select a branch first");
  if (!canAccessBranch(a, a.branchId)) throw forbidden("You no longer have access to this branch");
  return a.branchId;
}

/** Read filter: an explicit ?branchId, "all" for multi-branch users, otherwise the session branch. */
export function branchFilter(a: Auth, q: URLSearchParams): string | undefined {
  const req = q.get("branchId");
  if (req === "all") { if (!a.allBranches) throw forbidden("All-branch view is not available"); return undefined; }
  if (req) { if (!canAccessBranch(a, req)) throw forbidden("No access to this branch"); return req; }
  if (a.branchId) return a.branchId;
  if (a.allBranches) return undefined;
  throw badRequest("Select a branch first");
}

const COLOMBO = "+05:30";
export function dateRange(q: URLSearchParams, defaultDays = 30) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
  const parse = (s: string | null, fallback: string) => {
    const v = s ?? fallback;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw badRequest("Dates must be YYYY-MM-DD");
    return v;
  };
  const toDay = parse(q.get("to"), today);
  const fallbackFrom = new Date(Date.parse(`${toDay}T00:00:00Z`) - (defaultDays - 1) * 86_400_000).toISOString().slice(0, 10);
  const fromDay = parse(q.get("from"), fallbackFrom);
  const from = new Date(`${fromDay}T00:00:00${COLOMBO}`);
  const to = new Date(new Date(`${toDay}T00:00:00${COLOMBO}`).getTime() + 86_400_000); // exclusive
  if (from >= to) throw badRequest("'from' must not be after 'to'");
  return { from, to, fromDay, toDay };
}

export const zMoney = z.coerce.number().min(0).max(999_999_999_999).multipleOf(0.01);
export const zPositiveMoney = zMoney.refine((n) => n > 0, "Must be more than 0");
export const zQty = z.coerce.number().positive().max(99_999_999).multipleOf(0.001);
export const zId = z.string().min(1).max(40);
export const zApproval = z.object({ userId: zId, pin: z.string().regex(/^\d{4,6}$/) }).optional();
export const zDate = z.coerce.date();
export const zText = (max = 500) => z.string().trim().max(max);

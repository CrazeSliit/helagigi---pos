import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodObject, type ZodRawShape, type ZodType, type output } from "zod";
import { Prisma } from "../generated/prisma/client";
import { authenticate, type Auth } from "./auth";
import type { Permission } from "./permissions";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export const notFound = (what = "Record") => new ApiError(404, "not_found", `${what} not found`);
export const conflict = (message: string, details?: unknown) => new ApiError(409, "conflict", message, details);
export const badRequest = (message: string, details?: unknown) => new ApiError(400, "bad_request", message, details);
export const forbidden = (message = "You do not have permission to do this") => new ApiError(403, "forbidden", message);

export type Ctx = {
  req: NextRequest; params: Record<string, string>; query: URLSearchParams; ip: string | null;
  auth: Auth; body: <T>(schema: ZodType<T>) => Promise<T>;
  /** Partial update: only keys actually sent. Zod 4 would otherwise fill in schema defaults. */
  patch: <S extends ZodObject<ZodRawShape>>(schema: S) => Promise<Partial<output<S>>>;
};
export type PublicCtx = Omit<Ctx, "auth"> & { auth: Auth | null };

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type Route = {
  method: Method; path: string; perm?: Permission | Permission[]; public?: boolean; allowLocked?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (c: any) => Promise<unknown>;
};
export const route = (method: Method, path: string, opts: { perm?: Permission | Permission[]; allowLocked?: boolean }, handler: (c: Ctx) => Promise<unknown>): Route => ({ method, path, ...opts, handler });
export const publicRoute = (method: Method, path: string, handler: (c: PublicCtx) => Promise<unknown>): Route => ({ method, path, public: true, handler });

/** Decimals and dates become plain JSON. Money is safe as a number at Decimal(14,2). */
export function serialize(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (Prisma.Decimal.isDecimal(v)) return (v as Prisma.Decimal).toNumber();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "bigint") return Number(v);
  if (Array.isArray(v)) return v.map(serialize);
  if (typeof v === "object") return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, serialize(x)]));
  return v;
}

export function pageArgs(q: URLSearchParams) {
  const page = Math.max(1, Number(q.get("page")) || 1);
  const limit = Math.min(200, Math.max(1, Number(q.get("limit")) || 50));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
export const paged = <T>(data: T[], total: number, p: { page: number; limit: number }) => ({ data, meta: { total, page: p.page, limit: p.limit, pages: Math.ceil(total / p.limit) } });

function match(pattern: string, path: string) {
  const a = pattern.split("/").filter(Boolean), b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

function toResponse(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: { code: e.code, message: e.message, details: serialize(e.details) } }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: { code: "validation", message: "Check the highlighted fields", details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } }, { status: 422 });
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return NextResponse.json({ error: { code: "duplicate", message: "A record with this value already exists" } }, { status: 409 });
    if (e.code === "P2025") return NextResponse.json({ error: { code: "not_found", message: "Record not found" } }, { status: 404 });
    if (e.code === "P2003") return NextResponse.json({ error: { code: "in_use", message: "This record is linked to other records" } }, { status: 409 });
  }
  console.error("[api]", e);
  return NextResponse.json({ error: { code: "internal", message: "Something went wrong" } }, { status: 500 });
}

export function createHandler(routes: Route[]) {
  return async (req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) => {
    try {
      const path = "/" + (await params).path.join("/");
      const candidates = routes.map((r) => ({ r, p: match(r.path, path) })).filter((x) => x.p);
      if (!candidates.length) throw notFound("Endpoint");
      // Literal segments win over :params, e.g. /sales/held before /sales/:id.
      const hit = candidates.filter((x) => x.r.method === req.method).sort((a, b) => Object.keys(a.p!).length - Object.keys(b.p!).length)[0];
      if (!hit) throw new ApiError(405, "method_not_allowed", "Method not allowed");

      if (req.method !== "GET") {
        // Cookie auth: reject cross-site writes.
        const origin = req.headers.get("origin");
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        if (origin && new URL(origin).host !== host) throw forbidden("Cross-origin request blocked");
      }

      const auth = await authenticate(req);
      if (!hit.r.public) {
        if (!auth) throw new ApiError(401, "unauthenticated", "Please sign in");
        if (auth.locked && !hit.r.allowLocked) throw new ApiError(423, "locked", "Terminal is locked");
        if (hit.r.perm) {
          const need = Array.isArray(hit.r.perm) ? hit.r.perm : [hit.r.perm];
          if (!need.some((p) => auth.permissions.has(p))) throw forbidden();
        }
      }
      const readJson = async () => {
        try { return (await req.json()) as unknown; } catch { throw badRequest("Request body must be valid JSON"); }
      };
      const ctx = {
        req, params: hit.p!, query: req.nextUrl.searchParams, auth,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null,
        body: async <T,>(schema: ZodType<T>) => schema.parse(await readJson()),
        patch: async <S extends ZodObject<ZodRawShape>>(schema: S) => {
          const json = await readJson();
          const parsed = schema.partial().parse(json) as Record<string, unknown>;
          const sent = new Set(Object.keys(json as object));
          return Object.fromEntries(Object.entries(parsed).filter(([k]) => sent.has(k))) as Partial<output<S>>;
        },
      };
      const out = await hit.r.handler(ctx);
      if (out instanceof NextResponse || out instanceof Response) return out;
      const isPaged = !!out && typeof out === "object" && "data" in out && "meta" in out;
      return NextResponse.json(serialize(isPaged ? out : { data: out }), { status: req.method === "POST" ? 201 : 200 });
    } catch (e) {
      return toResponse(e);
    }
  };
}

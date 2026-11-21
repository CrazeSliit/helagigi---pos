import type { ZodObject, ZodRawShape } from "zod";
import { audit, db } from "./db";
import { notFound, paged, pageArgs, route, type Ctx, type Route } from "./http";
import type { Permission } from "./permissions";

type Opts = {
  path: string; model: string; entity: string;
  read?: Permission | Permission[]; write: Permission | Permission[];
  schema: ZodObject<ZodRawShape>; search?: string[]; orderBy?: Record<string, unknown>;
  include?: Record<string, unknown>; softDelete?: boolean; noDelete?: boolean;
  transform?: (data: Record<string, unknown>, c: Ctx) => Record<string, unknown> | Promise<Record<string, unknown>>;
  filter?: (c: Ctx) => Record<string, unknown>;
  output?: (row: Record<string, unknown>, c: Ctx) => unknown;
};

/** Standard list / get / create / update / delete for reference data. Every write is audited. */
export function crud(o: Opts): Route[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (db as any)[o.model];
  const out = (r: Record<string, unknown>, c: Ctx) => (o.output ? o.output(r, c) : r);
  const whereFor = (c: Ctx) => {
    const s = c.query.get("q")?.trim();
    return {
      ...(o.filter?.(c) ?? {}),
      ...(o.softDelete && c.query.get("includeInactive") !== "true" ? { active: true } : {}),
      ...(s && o.search ? { OR: o.search.map((f) => ({ [f]: { contains: s, mode: "insensitive" } })) } : {}),
    };
  };
  const one = async (c: Ctx) => {
    const row = await model.findFirst({ where: { id: c.params.id, ...(o.filter?.(c) ?? {}) }, include: o.include });
    if (!row) throw notFound(o.entity);
    return row;
  };
  const log = (c: Ctx, action: string, id: string, detail?: unknown) =>
    audit(db, { userId: c.auth.userId, branchId: c.auth.branchId, ip: c.ip }, `${o.entity.toLowerCase()}.${action}`, o.entity, id, detail as never);
  const clean = (v: unknown) => JSON.parse(JSON.stringify(v));

  const routes: Route[] = [
    route("GET", o.path, { perm: o.read }, async (c) => {
      const p = pageArgs(c.query), where = whereFor(c);
      const [rows, total] = await Promise.all([
        model.findMany({ where, include: o.include, orderBy: o.orderBy ?? { name: "asc" }, skip: p.skip, take: p.take }),
        model.count({ where }),
      ]);
      return paged(rows.map((r: Record<string, unknown>) => out(r, c)), total, p);
    }),
    route("GET", `${o.path}/:id`, { perm: o.read }, async (c) => out(await one(c), c)),
    route("POST", o.path, { perm: o.write }, async (c) => {
      const parsed = (await c.body(o.schema)) as Record<string, unknown>;
      const data = o.transform ? await o.transform(parsed, c) : parsed;
      const row = await model.create({ data, include: o.include });
      await log(c, "create", row.id, clean(parsed));
      return out(row, c);
    }),
    route("PATCH", `${o.path}/:id`, { perm: o.write }, async (c) => {
      await one(c);
      const parsed = (await c.patch(o.schema)) as Record<string, unknown>;
      const data = o.transform ? await o.transform(parsed, c) : parsed;
      const row = await model.update({ where: { id: c.params.id }, data, include: o.include });
      await log(c, "update", row.id, clean(parsed));
      return out(row, c);
    }),
  ];
  if (!o.noDelete) routes.push(route("DELETE", `${o.path}/:id`, { perm: o.write }, async (c) => {
    await one(c);
    if (o.softDelete) await model.update({ where: { id: c.params.id }, data: { active: false } });
    else await model.delete({ where: { id: c.params.id } });
    await log(c, "delete", c.params.id);
    return { deleted: true };
  }));
  return routes;
}

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client";

const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const raw = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL_POOLED is not set");
  // pg treats sslmode=require as verify-full today; say so explicitly to keep that strictness.
  const connectionString = raw.replace("sslmode=require", "sslmode=verify-full");
  const schema = new URL(raw).searchParams.get("schema") ?? undefined;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 5 }, { schema }) });
}

export const db = globalForDb.prisma ?? makeClient();
if (process.env.NODE_ENV !== "production") globalForDb.prisma = db;

export type Tx = Prisma.TransactionClient;

/** Interactive transaction with limits suited to a remote database. */
export const tx = <T>(fn: (t: Tx) => Promise<T>) => db.$transaction(fn, { maxWait: 10_000, timeout: 25_000 });

type DecimalInput = string | number | Prisma.Decimal;
export const D = (v: DecimalInput) => new Prisma.Decimal(v);
export const ZERO = D(0);
export const money = (v: DecimalInput) => D(v).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
export const qty3 = (v: DecimalInput) => D(v).toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);

/** Next document number, e.g. INV-CMB-000123. Atomic, and rolls back with the transaction. */
export async function nextNumber(t: Tx, prefix: string, scope?: string) {
  const key = scope ? `${prefix}-${scope}` : prefix;
  const c = await t.counter.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
  return `${key}-${String(c.value).padStart(6, "0")}`;
}

export async function audit(
  t: Tx | PrismaClient,
  a: { userId?: string | null; branchId?: string | null; ip?: string | null },
  action: string, entity: string, entityId?: string | null, detail?: Prisma.InputJsonValue,
) {
  await t.auditLog.create({ data: { userId: a.userId ?? null, branchId: a.branchId ?? null, ip: a.ip ?? null, action, entity, entityId: entityId ?? null, detail } });
}

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { audit, db } from "./db";
import { ALL_PERMISSIONS, type Permission } from "./permissions";

export const SESSION_COOKIE = "hd_session";
export const DEVICE_COOKIE = "hd_device";
const SESSION_HOURS = 12;
const DEVICE_DAYS = 90;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
// Compared against when the account does not exist, so response time doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync("heladigi-not-a-real-credential", 10);

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const hashSecret = (s: string) => bcrypt.hash(s, 11);

export type Auth = {
  sessionId: string; userId: string; name: string; role: string; permissions: Set<Permission>;
  allBranches: boolean; branchIds: string[]; branchId: string | null; terminalId: string | null; locked: boolean;
};

export async function authenticate(req: NextRequest): Promise<Auth | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { role: true, branches: { select: { branchId: true } } } } },
  });
  if (!s || s.revokedAt || s.expiresAt < new Date() || !s.user.active) return null;
  const owner = s.user.role.name === "Owner";
  return {
    sessionId: s.id, userId: s.userId, name: s.user.name, role: s.user.role.name,
    permissions: new Set((owner ? ALL_PERMISSIONS : s.user.role.permissions) as Permission[]),
    allBranches: s.user.allBranches, branchIds: s.user.branches.map((b) => b.branchId),
    branchId: s.branchId, terminalId: s.terminalId, locked: s.locked,
  };
}

export async function createSession(userId: string, branchId: string | null, terminalId: string | null) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3_600_000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, branchId, terminalId, expiresAt } });
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null } });
  return { token, expiresAt };
}

export async function createDevice(createdById: string, branchId: string, terminalId: string | null) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + DEVICE_DAYS * 86_400_000);
  await db.trustedDevice.create({ data: { tokenHash: hashToken(token), createdById, branchId, terminalId, expiresAt } });
  return { token, expiresAt };
}

export async function trustedDevice(req: NextRequest) {
  const token = req.cookies.get(DEVICE_COOKIE)?.value;
  if (!token) return null;
  const d = await db.trustedDevice.findUnique({ where: { tokenHash: hashToken(token) } });
  return d && !d.revokedAt && d.expiresAt > new Date() ? d : null;
}

export const cookieOptions = (expires: Date) => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", expires,
});

/** Verifies a password or PIN with per-account lockout. Returns false on any failure. */
export async function verifyCredential(
  user: { id: string; active: boolean; lockedUntil: Date | null; failedLogins: number } | null,
  hash: string | null | undefined, secret: string, ip?: string | null,
) {
  if (!user || !hash || !user.active) { await bcrypt.compare(secret, DUMMY_HASH); return false; }
  if (user.lockedUntil && user.lockedUntil > new Date()) { await bcrypt.compare(secret, DUMMY_HASH); return false; }
  if (await bcrypt.compare(secret, hash)) {
    if (user.failedLogins) await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    return true;
  }
  const u = await db.user.update({ where: { id: user.id }, data: { failedLogins: { increment: 1 } } });
  if (u.failedLogins >= MAX_FAILS) {
    await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) } });
    await audit(db, { userId: user.id, ip }, "auth.locked", "User", user.id);
  }
  return false;
}

/** Manager approval at the till: confirms the approver's PIN and that their role holds the permission. */
export async function verifyApproval(approval: { userId: string; pin: string } | undefined, perm: Permission, branchId: string | null, ip?: string | null) {
  if (!approval) return null;
  const u = await db.user.findUnique({ where: { id: approval.userId }, include: { role: true, branches: true } });
  if (!(await verifyCredential(u, u?.pinHash, approval.pin, ip)) || !u) return null;
  const has = u.role.name === "Owner" || u.role.permissions.includes(perm);
  const inBranch = u.allBranches || u.branches.some((b) => b.branchId === branchId);
  return has && inBranch ? u : null;
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { cookieOptions, createDevice, createSession, DEVICE_COOKIE, hashSecret, hashToken, newToken, SESSION_COOKIE, trustedDevice, verifyCredential } from "../auth";
import { audit, db } from "../db";
import { ApiError, badRequest, forbidden, publicRoute, route, serialize, type Route } from "../http";
import { canAccessBranch, zId } from "../scope";

const invalid = () => new ApiError(401, "invalid_credentials", "Incorrect sign-in details, or the account is temporarily locked");
const zPassword = z.string().min(10, "Use at least 10 characters").max(128);
const zPin = z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits");

const userInclude = { role: true, branches: { include: { branch: { select: { id: true, name: true, code: true } } } } } as const;

async function branchesFor(u: { allBranches: boolean; id: string }) {
  return db.branch.findMany({ where: { active: true, ...(u.allBranches ? {} : { users: { some: { userId: u.id } } }) }, select: { id: true, name: true, code: true, address: true }, orderBy: { name: "asc" } });
}

export const authRoutes: Route[] = [
  publicRoute("POST", "/auth/login", async ({ body, ip }) => {
    const b = await body(z.object({ user: z.string().trim().min(1).max(160), password: z.string().min(1).max(128), remember: z.boolean().default(false), branchId: zId.optional(), terminalId: zId.optional() }));
    const id = b.user.toLowerCase();
    const u = await db.user.findFirst({ where: { OR: [{ email: id }, { username: id }] } });
    if (!(await verifyCredential(u, u?.passwordHash, b.password, ip)) || !u) {
      await audit(db, { userId: u?.id, ip }, "auth.login_failed", "User", u?.id);
      throw invalid();
    }
    const branches = await branchesFor(u);
    const branchId = b.branchId && branches.some((x) => x.id === b.branchId) ? b.branchId : branches.length === 1 ? branches[0].id : null;
    const s = await createSession(u.id, branchId, null);
    await audit(db, { userId: u.id, branchId, ip }, "auth.login", "User", u.id);
    const res = NextResponse.json(serialize({ data: { user: { id: u.id, name: u.name }, branches, branchId } }));
    res.cookies.set(SESSION_COOKIE, s.token, cookieOptions(s.expiresAt));
    if (b.remember && branchId) {
      const d = await createDevice(u.id, branchId, null);
      res.cookies.set(DEVICE_COOKIE, d.token, cookieOptions(d.expiresAt));
    }
    return res;
  }),

  // Only a terminal already trusted through a password sign-in sees staff or accepts a PIN.
  publicRoute("GET", "/auth/pin-users", async ({ req }) => {
    const d = await trustedDevice(req);
    if (!d) throw forbidden("This terminal is not registered. Sign in with email first");
    const users = await db.user.findMany({
      where: { active: true, pinHash: { not: null }, OR: [{ allBranches: true }, { branches: { some: { branchId: d.branchId } } }] },
      select: { id: true, name: true, color: true, role: { select: { name: true } } }, orderBy: { name: "asc" },
    });
    return users.map((u) => ({ id: u.id, name: u.name, color: u.color, role: u.role.name }));
  }),

  publicRoute("POST", "/auth/pin-login", async ({ req, body, ip }) => {
    const d = await trustedDevice(req);
    if (!d) throw forbidden("This terminal is not registered. Sign in with email first");
    const b = await body(z.object({ userId: zId, pin: zPin }));
    const u = await db.user.findUnique({ where: { id: b.userId }, include: { branches: true, role: true } });
    const inBranch = !!u && (u.allBranches || u.branches.some((x) => x.branchId === d.branchId));
    if (!(await verifyCredential(inBranch ? u : null, u?.pinHash, b.pin, ip)) || !u) {
      await audit(db, { userId: u?.id, branchId: d.branchId, ip }, "auth.pin_failed", "User", u?.id);
      throw invalid();
    }
    const s = await createSession(u.id, d.branchId, d.terminalId);
    await audit(db, { userId: u.id, branchId: d.branchId, ip }, "auth.pin_login", "User", u.id);
    const res = NextResponse.json(serialize({ data: { user: { id: u.id, name: u.name, role: u.role.name }, branchId: d.branchId } }));
    res.cookies.set(SESSION_COOKIE, s.token, cookieOptions(s.expiresAt));
    return res;
  }),

  route("POST", "/auth/logout", { allowLocked: true }, async ({ auth, ip }) => {
    await db.session.update({ where: { id: auth.sessionId }, data: { revokedAt: new Date() } });
    await audit(db, { userId: auth.userId, branchId: auth.branchId, ip }, "auth.logout", "User", auth.userId);
    const res = NextResponse.json({ data: { ok: true } });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }),

  route("GET", "/auth/me", { allowLocked: true }, async ({ auth }) => {
    const u = await db.user.findUniqueOrThrow({ where: { id: auth.userId }, include: userInclude });
    return {
      id: u.id, name: u.name, email: u.email, username: u.username, phone: u.phone, color: u.color, role: auth.role,
      permissions: [...auth.permissions], allBranches: u.allBranches, branchId: auth.branchId, terminalId: auth.terminalId, locked: auth.locked,
      branches: await branchesFor(u),
    };
  }),

  route("POST", "/auth/branch", {}, async ({ auth, body, ip }) => {
    const b = await body(z.object({ branchId: zId, terminalId: zId.optional() }));
    if (!canAccessBranch(auth, b.branchId)) throw forbidden("No access to this branch");
    if (b.terminalId && !(await db.terminal.findFirst({ where: { id: b.terminalId, branchId: b.branchId, active: true } }))) throw badRequest("Terminal is not in this branch");
    await db.session.update({ where: { id: auth.sessionId }, data: { branchId: b.branchId, terminalId: b.terminalId ?? null } });
    await audit(db, { userId: auth.userId, branchId: b.branchId, ip }, "auth.branch", "Branch", b.branchId);
    return { branchId: b.branchId, terminalId: b.terminalId ?? null };
  }),

  route("POST", "/auth/lock", {}, async ({ auth }) => { await db.session.update({ where: { id: auth.sessionId }, data: { locked: true } }); return { locked: true }; }),
  route("POST", "/auth/unlock", { allowLocked: true }, async ({ auth, body, ip }) => {
    const { pin } = await body(z.object({ pin: zPin }));
    const u = await db.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (!(await verifyCredential(u, u.pinHash, pin, ip))) throw invalid();
    await db.session.update({ where: { id: auth.sessionId }, data: { locked: false } });
    return { locked: false };
  }),

  route("POST", "/auth/change-password", {}, async ({ auth, body, ip }) => {
    const b = await body(z.object({ current: z.string().min(1).max(128), next: zPassword }));
    const u = await db.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (!(await verifyCredential(u, u.passwordHash, b.current, ip))) throw invalid();
    await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashSecret(b.next) } });
    await db.session.updateMany({ where: { userId: u.id, id: { not: auth.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(db, { userId: u.id, ip }, "auth.password_changed", "User", u.id);
    return { ok: true };
  }),
  route("POST", "/auth/change-pin", {}, async ({ auth, body, ip }) => {
    const b = await body(z.object({ password: z.string().min(1).max(128), pin: zPin }));
    const u = await db.user.findUniqueOrThrow({ where: { id: auth.userId } });
    if (!(await verifyCredential(u, u.passwordHash, b.password, ip))) throw invalid();
    await db.user.update({ where: { id: u.id }, data: { pinHash: await hashSecret(b.pin) } });
    await audit(db, { userId: u.id, ip }, "auth.pin_changed", "User", u.id);
    return { ok: true };
  }),

  // Always answers the same way, so it can't be used to discover accounts.
  publicRoute("POST", "/auth/forgot", async ({ body, ip }) => {
    const { email } = await body(z.object({ email: z.string().trim().email().max(160) }));
    const u = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (u?.active) {
      const token = newToken();
      await db.passwordReset.create({ data: { tokenHash: hashToken(token), userId: u.id, expiresAt: new Date(Date.now() + 30 * 60_000) } });
      await audit(db, { userId: u.id, ip }, "auth.reset_requested", "User", u.id);
      // No email provider is configured yet. Never expose the token outside local development.
      if (process.env.NODE_ENV === "development") console.info(`[dev] password reset token for ${u.id}: ${token}`);
    }
    return { ok: true };
  }),
  publicRoute("POST", "/auth/reset", async ({ body, ip }) => {
    const b = await body(z.object({ token: z.string().min(20).max(100), password: zPassword }));
    const r = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(b.token) } });
    if (!r || r.usedAt || r.expiresAt < new Date()) throw badRequest("This reset link is invalid or has expired");
    const passwordHash = await hashSecret(b.password);
    const claimed = await db.passwordReset.updateMany({ where: { id: r.id, usedAt: null }, data: { usedAt: new Date() } });
    if (!claimed.count) throw badRequest("This reset link is invalid or has expired");
    await db.user.update({ where: { id: r.userId }, data: { passwordHash, failedLogins: 0, lockedUntil: null } });
    await db.session.updateMany({ where: { userId: r.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(db, { userId: r.userId, ip }, "auth.password_reset", "User", r.userId);
    return { ok: true };
  }),
];

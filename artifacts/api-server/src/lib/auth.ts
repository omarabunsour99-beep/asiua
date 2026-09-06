import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, adminUsersTable, sessionsTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
export const SESSION_COOKIE = "asian_screen_session";
declare global { namespace Express { interface Request { adminUser?: { id: string; email: string; role: string } } } }
export async function currentUser(id?: string) {
  if (!id) return null;
  const [row] = await db.select({ id: adminUsersTable.id, email: adminUsersTable.email, role: adminUsersTable.role })
    .from(sessionsTable).innerJoin(adminUsersTable, eq(sessionsTable.adminUserId, adminUsersTable.id))
    .where(and(eq(sessionsTable.id, id), gt(sessionsTable.expiresAt, new Date()))).limit(1);
  return row ?? null;
}
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  req.adminUser = await currentUser(req.cookies?.[SESSION_COOKIE]) ?? undefined;
  next();
}
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.adminUser) { res.status(401).json({ error: "Authentication required" }); return; }
  next();
}
export async function createSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({ id, adminUserId: userId, expiresAt: new Date(Date.now() + 7 * 86400000) });
  return id;
}
export async function destroySession(id?: string) { if (id) await db.delete(sessionsTable).where(eq(sessionsTable.id, id)); }
export function setCookie(res: Response, id: string) { res.cookie(SESSION_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 86400000, path: "/" }); }
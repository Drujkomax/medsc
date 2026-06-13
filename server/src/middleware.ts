import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { q } from "./db";
import { hasLevel, Role } from "./roles";

const JWT_SECRET = process.env.JWT_SECRET as string;

export type AuthUser = { id: string; email: string; roles: string[] };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: AuthUser | null;
    }
  }
}

/** Attach req.user (with roles loaded from the DB) when a valid Bearer token is present. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  req.user = null;
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(h.slice(7), JWT_SECRET) as { sub: string; email: string };
      const { rows } = await q<{ role: string }>("select role from user_roles where user_id=$1", [
        payload.sub,
      ]);
      req.user = { id: payload.sub, email: payload.email, roles: rows.map((r) => r.role) };
    } catch {
      req.user = null;
    }
  }
  next();
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) =>
  req.user ? next() : res.status(401).json({ error: "unauthenticated" });

/** Guard: require any role at or above `min` (replaces the RLS has_role_level checks). */
export const requireLevel =
  (min: Role) => (req: Request, res: Response, next: NextFunction) =>
    req.user && hasLevel(req.user.roles, min) ? next() : res.status(403).json({ error: "forbidden" });

/** Wrap an async handler so thrown errors hit the error middleware. */
export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q } from "./db";
import { wrap } from "./middleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const sign = (u: { id: string; email: string }) =>
  jwt.sign({ sub: u.id, email: u.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

// POST /auth/register { email, password, full_name? } — always gets base role 'user'
router.post(
  "/register",
  wrap(async (req, res) => {
    const { email, password, full_name } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const exists = await q("select id from users where email=$1", [email]);
    if (exists.rowCount) return res.status(409).json({ error: "user already exists" });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await q<{ id: string; email: string }>(
      "insert into users (email, password_hash, full_name) values ($1,$2,$3) returning id, email",
      [email, hash, full_name ?? null]
    );
    await q("insert into user_roles (user_id, role) values ($1,'user') on conflict do nothing", [rows[0].id]);
    res.status(201).json({ token: sign(rows[0]), user: rows[0] });
  })
);

// POST /auth/login { email, password }  (bcrypt — Supabase hashes verify as-is after import)
router.post(
  "/login",
  wrap(async (req, res) => {
    const { email, password } = req.body ?? {};
    const { rows } = await q<{ id: string; email: string; password_hash: string }>(
      "select id, email, password_hash from users where email=$1",
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, rows[0].password_hash || "");
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    res.json({ token: sign(rows[0]), user: { id: rows[0].id, email: rows[0].email } });
  })
);

// GET /auth/me  — current user + roles (roles loaded by authenticate middleware)
router.get("/me", (req, res) =>
  req.user ? res.json({ user: req.user }) : res.status(401).json({ error: "unauthenticated" })
);

export default router;

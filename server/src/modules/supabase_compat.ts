import { Router, Request, Response } from "express";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { promises as fs } from "fs";
import { q } from "../db";

// ============================================================================
// Supabase-compatibility surface for the already-deployed msc-bot (supabase-py).
// The bot only needs to point SUPABASE_URL at this server and keep using its
// SUPABASE_SERVICE_ROLE_KEY (which must equal BOT_SERVICE_KEY here). It then talks
// PostgREST (/rest/v1), GoTrue (/auth/v1) and Storage (/storage/v1) as before.
// Scoped to the operations the bot actually performs; service key = full access.
// ============================================================================

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;
const SERVICE_KEY = process.env.BOT_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const STORAGE = path.resolve(process.env.STORAGE_DIR || "./_storage");
const isIdent = (s: string) => /^[a-z_][a-z0-9_]*$/i.test(s);

// ── auth gate: accept the shared service key (apikey or Bearer) ──────────────
function keyFrom(req: Request): string {
  const h = req.headers.authorization;
  const bearer = h?.startsWith("Bearer ") ? h.slice(7) : "";
  return (req.headers["apikey"] as string) || bearer || "";
}
function requireService(req: Request, res: Response, next: () => void) {
  if (SERVICE_KEY && keyFrom(req) === SERVICE_KEY) return next();
  // also accept one of our own user JWTs (defence in depth)
  try {
    const t = (req.headers.authorization || "").replace("Bearer ", "");
    if (t) { jwt.verify(t, JWT_SECRET); return next(); }
  } catch { /* fall through */ }
  return res.status(401).json({ message: "invalid api key" });
}

// ── PostgREST query parsing ─────────────────────────────────────────────────
const OPS: Record<string, string> = {
  eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike",
};
type Cond = { col: string; op: string; val: string };

function parseFilters(query: Record<string, any>): Cond[] {
  const reserved = new Set(["select", "order", "limit", "offset", "on_conflict"]);
  const out: Cond[] = [];
  for (const [key, raw] of Object.entries(query)) {
    if (reserved.has(key) || !isIdent(key)) continue;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const s = String(v);
    const dot = s.indexOf(".");
    if (dot < 0) continue;
    out.push({ col: key, op: s.slice(0, dot), val: s.slice(dot + 1) });
  }
  return out;
}

function buildWhere(conds: Cond[], start = 0): { sql: string; vals: unknown[]; next: number } {
  let i = start;
  const vals: unknown[] = [];
  const parts: string[] = [];
  for (const c of conds) {
    if (!isIdent(c.col)) continue;
    if (c.op === "is") {
      const v = c.val === "null" ? "null" : c.val === "true" ? "true" : "false";
      parts.push(`"${c.col}" is ${v}`);
    } else if (c.op === "in") {
      const inner = c.val.replace(/^\(|\)$/g, "");
      const items = inner.length ? inner.split(",") : [];
      if (!items.length) { parts.push("false"); continue; }
      const ph = items.map(() => `$${++i}`).join(",");
      vals.push(...items);
      parts.push(`"${c.col}" in (${ph})`);
    } else if (c.op === "like" || c.op === "ilike") {
      vals.push(c.val.replace(/\*/g, "%"));
      parts.push(`"${c.col}" ${OPS[c.op]} $${++i}`);
    } else if (OPS[c.op]) {
      vals.push(c.val);
      parts.push(`"${c.col}" ${OPS[c.op]} $${++i}`);
    }
  }
  return { sql: parts.join(" and "), vals, next: i };
}

function wantsSingle(req: Request): boolean {
  return String(req.headers["accept"] || "").includes("vnd.pgrst.object");
}

// ── /rest/v1/:table  (GET / POST / PATCH / DELETE) ──────────────────────────
const rest = Router();
rest.use(express.json({ limit: "10mb" }));
rest.use(requireService);

rest.get("/:table", async (req, res) => {
  const t = req.params.table;
  if (!isIdent(t)) return res.status(400).json({ message: "bad table" });
  try {
    const w = buildWhere(parseFilters(req.query as any));
    let sql = `select * from "${t}"`;
    if (w.sql) sql += " where " + w.sql;
    const order = req.query.order as string | undefined;
    if (order) {
      const [col, dir] = order.split(".");
      if (isIdent(col)) sql += ` order by "${col}" ${dir === "desc" ? "desc" : "asc"}`;
    }
    const limit = parseInt(String(req.query.limit ?? ""), 10);
    if (!Number.isNaN(limit)) sql += ` limit ${limit}`;
    const offset = parseInt(String(req.query.offset ?? ""), 10);
    if (!Number.isNaN(offset)) sql += ` offset ${offset}`;
    const { rows } = await q(sql, w.vals);
    return res.json(wantsSingle(req) ? rows[0] ?? null : rows);
  } catch (e: any) {
    return res.status(400).json({ message: e.message, code: e.code });
  }
});

rest.post("/:table", async (req, res) => {
  const t = req.params.table;
  if (!isIdent(t)) return res.status(400).json({ message: "bad table" });
  try {
    const arr = Array.isArray(req.body) ? req.body : [req.body];
    const prefer = String(req.headers["prefer"] || "");
    const upsert = prefer.includes("merge-duplicates");
    const conflict = String(req.query.on_conflict || "").split(",").filter(isIdent);
    const out: any[] = [];
    for (const v of arr) {
      const keys = Object.keys(v).filter(isIdent);
      const cols = keys.map((k) => `"${k}"`).join(",");
      const ph = keys.map((_, i) => `$${i + 1}`).join(",");
      let sql = `insert into "${t}" (${cols}) values (${ph})`;
      if (upsert && conflict.length) {
        const set = keys.filter((k) => !conflict.includes(k)).map((k) => `"${k}"=excluded."${k}"`).join(",");
        sql += ` on conflict (${conflict.map((c) => `"${c}"`).join(",")}) do update set ${set || `"${keys[0]}"=excluded."${keys[0]}"`}`;
      }
      sql += " returning *";
      const { rows } = await q(sql, keys.map((k) => v[k]));
      out.push(rows[0]);
    }
    return res.status(201).json(out);
  } catch (e: any) {
    return res.status(400).json({ message: e.message, code: e.code });
  }
});

rest.patch("/:table", async (req, res) => {
  const t = req.params.table;
  if (!isIdent(t)) return res.status(400).json({ message: "bad table" });
  try {
    const keys = Object.keys(req.body).filter(isIdent);
    const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(",");
    const w = buildWhere(parseFilters(req.query as any), keys.length);
    let sql = `update "${t}" set ${set}`;
    if (w.sql) sql += ` where ${w.sql}`;
    sql += " returning *";
    const { rows } = await q(sql, [...keys.map((k) => req.body[k]), ...w.vals]);
    return res.json(rows);
  } catch (e: any) {
    return res.status(400).json({ message: e.message, code: e.code });
  }
});

rest.delete("/:table", async (req, res) => {
  const t = req.params.table;
  if (!isIdent(t)) return res.status(400).json({ message: "bad table" });
  try {
    const w = buildWhere(parseFilters(req.query as any));
    const { rows } = await q(`delete from "${t}" ${w.sql ? "where " + w.sql : ""} returning *`, w.vals);
    return res.json(rows);
  } catch (e: any) {
    return res.status(400).json({ message: e.message, code: e.code });
  }
});

router.use("/rest/v1", rest);

// ── /auth/v1/token?grant_type=password  (GoTrue-compatible sign-in) ─────────
const sign = (u: { id: string; email: string }) =>
  jwt.sign({ sub: u.id, email: u.email }, JWT_SECRET, { expiresIn: "1h" });

router.post("/auth/v1/token", express.json(), async (req, res) => {
  const grant = req.query.grant_type;
  if (grant && grant !== "password")
    return res.status(400).json({ error: "unsupported_grant_type" });
  const { email, password } = req.body || {};
  const { rows } = await q<{ id: string; email: string; password_hash: string }>(
    "select id, email, password_hash from users where lower(email)=lower($1)", [email]
  );
  if (!rows.length || !(await bcrypt.compare(password || "", rows[0].password_hash || "")))
    return res.status(400).json({ error: "invalid_grant", error_description: "Invalid login credentials" });
  const u = { id: rows[0].id, email: rows[0].email };
  const token = sign(u);
  return res.json({
    access_token: token, token_type: "bearer", expires_in: 3600, refresh_token: token,
    user: { id: u.id, email: u.email, role: "authenticated", aud: "authenticated" },
  });
});

router.get("/auth/v1/user", requireService, async (_req, res) => res.json({}));
router.get("/auth/v1/settings", (_req, res) =>
  res.json({ external: {}, disable_signup: true, mailer_autoconfirm: true })
);

// ── /storage/v1/object/:bucket/*  (Storage-compatible upload/get/delete) ────
function safe(bucket: string, rest: string): string | null {
  if (!/^[a-z0-9_-]+$/i.test(bucket)) return null;
  const full = path.resolve(STORAGE, bucket, rest);
  const base = path.resolve(STORAGE, bucket);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  return full;
}
// storage3 (supabase-py) uploads as multipart/form-data; browsers send raw bytes.
// Return the actual file bytes for either case.
function fileBytes(req: Request): Buffer {
  const body = req.body as Buffer;
  const ct = String(req.headers["content-type"] || "");
  if (!ct.includes("multipart/form-data") || !Buffer.isBuffer(body)) return body;
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
  if (!m) return body;
  const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
  const start = body.indexOf(boundary);
  if (start < 0) return body;
  const headEnd = body.indexOf(Buffer.from("\r\n\r\n"), start);
  if (headEnd < 0) return body;
  const dataStart = headEnd + 4;
  let end = body.indexOf(boundary, dataStart);
  if (end < 0) return body;
  if (body[end - 2] === 0x0d && body[end - 1] === 0x0a) end -= 2; // strip trailing CRLF
  return body.subarray(dataStart, end);
}
router.post("/storage/v1/object/:bucket/*", requireService, express.raw({ type: () => true, limit: "30mb" }), async (req, res) => {
  const rest = (req.params as any)[0] as string;
  const dest = safe(req.params.bucket, rest);
  if (!dest) return res.status(400).json({ message: "bad path" });
  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, fileBytes(req));
    return res.json({ Key: `${req.params.bucket}/${rest}`, path: rest });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
});
router.get("/storage/v1/object/:scope/:bucket/*", async (req, res) => {
  // handles /object/public/<bucket>/.. and /object/authenticated/<bucket>/..
  const rest = (req.params as any)[0] as string;
  const dest = safe(req.params.bucket, rest);
  if (!dest) return res.status(400).end();
  res.sendFile(dest, (err) => { if (err) res.status(404).end(); });
});

export default router;

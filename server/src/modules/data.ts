import { Router } from "express";
import { q } from "../db";
import { hasLevel, hasRole } from "../roles";
import { emitChange } from "../realtime";

// Generic data endpoint that the frontend's supabase-compat shim talks to.
// Still our clean backend: our auth, our authz, clean DB (no RLS). One Express app.
const router = Router();

const isIdent = (s: string) => /^[a-z_][a-z0-9_]*$/.test(s);

// tables anon may read / insert (public site)
const PUBLIC_READ = new Set([
  "products", "product_categories", "categories", "manufacturers",
  "services", "service_categories", "site_contacts",
]);
const ANON_INSERT = new Set(["contact_inquiries", "leads"]);

const OPS: Record<string, string> = {
  eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike",
};

type P = { i: number; vals: unknown[] };

// build one condition; returns sql or null, mutates params
function cond(f: any, p: P): string | null {
  if (!f || !isIdent(f.col)) return null;
  if (f.op === "in" && Array.isArray(f.val)) {
    const ph = f.val.map(() => `$${++p.i}`).join(",");
    p.vals.push(...f.val);
    return `"${f.col}" in (${ph})`;
  }
  if (f.op === "is") {
    return `"${f.col}" is ${f.val === null ? "null" : f.val ? "true" : "false"}`;
  }
  if (typeof f.op === "string" && f.op.startsWith("not_")) {
    const base = f.op.slice(4);
    if (base === "is") return `"${f.col}" is not ${f.val === null ? "null" : f.val ? "true" : "false"}`;
    p.vals.push(f.val);
    return `not ("${f.col}" ${OPS[base] || "="} $${++p.i})`;
  }
  if (OPS[f.op]) {
    p.vals.push(f.val);
    return `"${f.col}" ${OPS[f.op]} $${++p.i}`;
  }
  return null;
}

function buildWhere(filters: any[], start = 0) {
  const p: P = { i: start, vals: [] };
  const parts: string[] = [];
  for (const f of filters || []) {
    if (f.op === "or" && Array.isArray(f.conditions)) {
      const sub = f.conditions.map((c: any) => cond(c, p)).filter(Boolean);
      if (sub.length) parts.push("(" + sub.join(" or ") + ")");
    } else {
      const s = cond(f, p);
      if (s) parts.push(s);
    }
  }
  return { sql: parts.join(" and "), vals: p.vals, next: p.i };
}

// extra row-scoping for sensitive tables (reproduces the key RLS rules in code)
function scope(table: string, user: any): string | null {
  if (!user) return null;
  if (table === "leads" && !hasLevel(user.roles, "sales_manager") && hasRole(user.roles, "salesperson"))
    return `assigned_to = '${user.id}'`;
  if (table === "clients" && !hasLevel(user.roles, "sales_manager"))
    return `created_by = '${user.id}'`;
  return null;
}

router.post("/:table", async (req, res) => {
  const t = req.params.table;
  if (!isIdent(t)) return res.status(400).json({ data: null, error: { message: "bad table" } });
  const { op, filters = [], order, limitN, range, values, single } = req.body || {};
  const user = req.user;

  try {
    if (op === "select") {
      if (!PUBLIC_READ.has(t) && !user) return res.json({ data: single ? null : [], error: null });
      const w = buildWhere(filters);
      const extra = scope(t, user);
      const clauses = [w.sql, extra].filter(Boolean);
      let sql = `select * from "${t}"`;
      if (clauses.length) sql += " where " + clauses.join(" and ");
      if (order?.col && isIdent(order.col)) sql += ` order by "${order.col}" ${order.ascending ? "asc" : "desc"}`;
      if (range) sql += ` limit ${Math.max(0, range.to - range.from + 1)} offset ${range.from}`;
      else if (limitN) sql += ` limit ${parseInt(String(limitN), 10) || 100}`;
      const { rows } = await q(sql, w.vals);
      return res.json({ data: single ? rows[0] ?? null : rows, error: null });
    }

    if (op === "insert") {
      if (!user && !ANON_INSERT.has(t)) return res.status(401).json({ data: null, error: { message: "unauthenticated" } });
      const arr = Array.isArray(values) ? values : [values];
      const out: any[] = [];
      for (const v of arr) {
        const keys = Object.keys(v).filter(isIdent);
        const cols = keys.map((k) => `"${k}"`).join(",");
        const ph = keys.map((_, i) => `$${i + 1}`).join(",");
        const { rows } = await q(`insert into "${t}" (${cols}) values (${ph}) returning *`, keys.map((k) => v[k]));
        out.push(rows[0]);
        emitChange(t, "INSERT", rows[0]);
      }
      return res.json({ data: single ? out[0] : out, error: null });
    }

    if (op === "update") {
      if (!user) return res.status(401).json({ data: null, error: { message: "unauthenticated" } });
      const keys = Object.keys(values).filter(isIdent);
      const set = keys.map((k, i) => `"${k}"=$${i + 1}`).join(",");
      const w = buildWhere(filters, keys.length);
      let sql = `update "${t}" set ${set}`;
      if (w.sql) sql += ` where ${w.sql}`;
      sql += " returning *";
      const { rows } = await q(sql, [...keys.map((k) => values[k]), ...w.vals]);
      rows.forEach((r) => emitChange(t, "UPDATE", r));
      return res.json({ data: single ? rows[0] ?? null : rows, error: null });
    }

    if (op === "delete") {
      if (!user) return res.status(401).json({ data: null, error: { message: "unauthenticated" } });
      const w = buildWhere(filters);
      const { rows } = await q(`delete from "${t}" ${w.sql ? "where " + w.sql : ""} returning *`, w.vals);
      rows.forEach((r) => emitChange(t, "DELETE", r));
      return res.json({ data: rows, error: null });
    }

    return res.status(400).json({ data: null, error: { message: "bad op" } });
  } catch (e: any) {
    return res.json({ data: null, error: { message: e.message, code: e.code } });
  }
});

export default router;

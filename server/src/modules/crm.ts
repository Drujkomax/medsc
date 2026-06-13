import { Router } from "express";
import { q } from "../db";
import { requireAuth, requireLevel, wrap } from "../middleware";
import { hasLevel } from "../roles";
import { insertInto, updateById, deleteById } from "../lib/crud";

// ── clients: own rows, or sales_manager+ sees the team's ─────────────────────
export const clients = Router();
clients.get(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const u = req.user!;
    const { rows } = hasLevel(u.roles, "sales_manager")
      ? await q("select * from clients order by created_at desc")
      : await q("select * from clients where created_by=$1 order by created_at desc", [u.id]);
    res.json(rows);
  })
);
clients.post(
  "/",
  requireLevel("salesperson"),
  wrap(async (req, res) => res.status(201).json(await insertInto("clients", req.body ?? {}, { created_by: req.user!.id })))
);
clients.patch(
  "/:id",
  requireAuth,
  wrap(async (req, res) => {
    const { rows } = await q<{ created_by: string }>("select created_by from clients where id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "not found" });
    if (!(hasLevel(req.user!.roles, "sales_manager") || rows[0].created_by === req.user!.id))
      return res.status(403).json({ error: "forbidden" });
    res.json(await updateById("clients", req.params.id, req.body ?? {}));
  })
);
clients.delete(
  "/:id",
  requireLevel("admin"),
  wrap(async (req, res) => res.json({ deleted: (await deleteById("clients", req.params.id))?.id ?? null }))
);

// ── deals: salesperson+ ──────────────────────────────────────────────────────
export const deals = Router();
deals.get("/", requireLevel("salesperson"), wrap(async (_req, res) => res.json((await q("select * from deals order by created_at desc")).rows)));
deals.post("/", requireLevel("salesperson"), wrap(async (req, res) => res.status(201).json(await insertInto("deals", req.body ?? {}, { created_by: req.user!.id }))));
deals.patch("/:id", requireLevel("salesperson"), wrap(async (req, res) => res.json(await updateById("deals", req.params.id, req.body ?? {}))));
deals.delete("/:id", requireLevel("admin"), wrap(async (req, res) => res.json({ deleted: (await deleteById("deals", req.params.id))?.id ?? null })));

// ── tasks: assignee sees own, managers see all; managers create ──────────────
export const tasks = Router();
tasks.get(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const u = req.user!;
    const { rows } = hasLevel(u.roles, "sales_manager")
      ? await q("select * from tasks order by created_at desc")
      : await q("select * from tasks where assignee_id=$1 order by created_at desc", [u.id]);
    res.json(rows);
  })
);
tasks.post("/", requireLevel("sales_manager"), wrap(async (req, res) => res.status(201).json(await insertInto("tasks", req.body ?? {}, { created_by: req.user!.id }))));
tasks.patch(
  "/:id",
  requireAuth,
  wrap(async (req, res) => {
    const u = req.user!;
    const { rows } = await q<{ assignee_id: string | null }>("select assignee_id from tasks where id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "not found" });
    if (!(hasLevel(u.roles, "sales_manager") || rows[0].assignee_id === u.id)) return res.status(403).json({ error: "forbidden" });
    res.json(await updateById("tasks", req.params.id, req.body ?? {}));
  })
);
tasks.delete("/:id", requireLevel("sales_manager"), wrap(async (req, res) => res.json({ deleted: (await deleteById("tasks", req.params.id))?.id ?? null })));

// ── product categories: public read, managers write ─────────────────────────
export const categories = Router();
categories.get("/", wrap(async (_req, res) => res.json((await q("select * from product_categories order by value")).rows)));
categories.post("/", requireLevel("sales_manager"), wrap(async (req, res) => res.status(201).json(await insertInto("product_categories", req.body ?? {}, { created_by: req.user!.id }))));
categories.patch("/:id", requireLevel("sales_manager"), wrap(async (req, res) => res.json(await updateById("product_categories", req.params.id, req.body ?? {}))));
categories.delete("/:id", requireLevel("admin"), wrap(async (req, res) => res.json({ deleted: (await deleteById("product_categories", req.params.id))?.id ?? null })));

// ── public site: contacts (read) + inquiries (submit) ────────────────────────
export const site = Router();
site.get("/contacts", wrap(async (_req, res) => res.json((await q("select * from site_contacts limit 1")).rows[0] ?? null)));
site.post("/inquiries", wrap(async (req, res) => {
  const b = req.body ?? {};
  res.status(201).json(await insertInto("contact_inquiries", { name: b.name, phone: b.phone, email: b.email, message: b.message }));
}));
site.get("/inquiries", requireLevel("admin"), wrap(async (_req, res) => res.json((await q("select * from contact_inquiries order by created_at desc")).rows)));

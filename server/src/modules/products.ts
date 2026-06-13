import { Router } from "express";
import { q } from "../db";
import { requireLevel, wrap } from "../middleware";
import { insertInto, updateById, deleteById } from "../lib/crud";

// Catalog. Public visibility rule (was the "Public catalog access" RLS policy) now in code:
// anon sees only active & non-archived; authenticated staff see everything.
const r = Router();

r.get(
  "/",
  wrap(async (req, res) => {
    const { rows } = req.user
      ? await q("select * from products order by created_at desc limit 200")
      : await q(
          "select * from products where status='active' and archived=false order by created_at desc limit 200"
        );
    res.json(rows);
  })
);

r.get(
  "/:id",
  wrap(async (req, res) => {
    const { rows } = await q("select * from products where id=$1", [req.params.id]);
    const p = rows[0];
    if (!p || (!req.user && (p.status !== "active" || p.archived)))
      return res.status(404).json({ error: "not found" });
    res.json(p);
  })
);

// "Managers can manage products" → sales_manager and above
r.post(
  "/",
  requireLevel("sales_manager"),
  wrap(async (req, res) => {
    res.status(201).json(await insertInto("products", req.body ?? {}, { created_by: req.user!.id }));
  })
);

r.patch(
  "/:id",
  requireLevel("sales_manager"),
  wrap(async (req, res) => {
    res.json(await updateById("products", req.params.id, { ...(req.body ?? {}), updated_by: req.user!.id }));
  })
);

r.delete(
  "/:id",
  requireLevel("sales_manager"),
  wrap(async (req, res) => {
    res.json({ deleted: (await deleteById("products", req.params.id))?.id ?? null });
  })
);

// public — was increment_product_views() RPC
r.post(
  "/:id/view",
  wrap(async (req, res) => {
    await q("update products set views_count = views_count + 1 where id=$1 and archived=false", [req.params.id]);
    res.json({ ok: true });
  })
);

export default r;

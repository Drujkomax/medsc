import { Router } from "express";
import { q } from "../db";
import { requireAuth, requireLevel, wrap } from "../middleware";
import { hasLevel, hasRole } from "../roles";
import { insertInto, updateById, deleteById } from "../lib/crud";

// Faithful copy of the lead RLS rules, now enforced in code:
//   sales_manager+        → all leads
//   salesperson           → only leads assigned to them
//   anon (website form)    → may submit a 'website_form' lead, cannot read
const r = Router();

r.get(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const u = req.user!;
    if (hasLevel(u.roles, "sales_manager")) {
      const { rows } = await q("select * from leads where archived=false order by created_at desc limit 500");
      return res.json(rows);
    }
    if (hasRole(u.roles, "salesperson")) {
      const { rows } = await q(
        "select * from leads where assigned_to=$1 and archived=false order by created_at desc limit 500",
        [u.id]
      );
      return res.json(rows);
    }
    return res.json([]);
  })
);

r.get(
  "/:id",
  requireAuth,
  wrap(async (req, res) => {
    const u = req.user!;
    const { rows } = await q<{ assigned_to: string | null }>("select * from leads where id=$1", [req.params.id]);
    const lead = rows[0];
    if (!lead) return res.status(404).json({ error: "not found" });
    const can = hasLevel(u.roles, "sales_manager") || (hasRole(u.roles, "salesperson") && lead.assigned_to === u.id);
    if (!can) return res.status(403).json({ error: "forbidden" });
    res.json(lead);
  })
);

r.post(
  "/",
  wrap(async (req, res) => {
    const b = req.body ?? {};
    if (!req.user) {
      // public website form only
      if (b.source !== "website_form") return res.status(401).json({ error: "unauthenticated" });
      const lead = await insertInto(
        "leads",
        { name: b.name, email: b.email, phone: b.phone, company: b.company, city: b.city, equipment_interest: b.equipment_interest },
        { source: "website_form", stage: "new" }
      );
      return res.status(201).json(lead);
    }
    const u = req.user;
    if (hasLevel(u.roles, "sales_manager")) return res.status(201).json(await insertInto("leads", b));
    if (hasRole(u.roles, "salesperson"))
      return res.status(201).json(await insertInto("leads", b, { assigned_to: u.id }));
    return res.status(403).json({ error: "forbidden" });
  })
);

r.patch(
  "/:id",
  requireAuth,
  wrap(async (req, res) => {
    const u = req.user!;
    const { rows } = await q<{ assigned_to: string | null }>("select assigned_to from leads where id=$1", [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "not found" });
    const can =
      hasLevel(u.roles, "sales_manager") || (hasRole(u.roles, "salesperson") && rows[0].assigned_to === u.id);
    if (!can) return res.status(403).json({ error: "forbidden" });
    res.json(await updateById("leads", req.params.id, req.body ?? {}));
  })
);

r.delete(
  "/:id",
  requireLevel("sales_manager"),
  wrap(async (req, res) => {
    res.json({ deleted: (await deleteById("leads", req.params.id))?.id ?? null });
  })
);

export default r;

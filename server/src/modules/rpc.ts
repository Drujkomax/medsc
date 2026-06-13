import { Router } from "express";
import bcrypt from "bcryptjs";
import { q } from "../db";
import { hasLevel } from "../roles";

const VALID_ROLES = [
  "user", "observer", "accountant", "engineer",
  "salesperson", "sales_manager", "admin", "director",
];

// Reimplements the Supabase RPCs the frontend calls — now plain JS over the clean DB.
const router = Router();

router.post("/:fn", async (req, res) => {
  const fn = req.params.fn;
  const a = req.body || {};
  const user = req.user;
  try {
    switch (fn) {
      case "get_public_products": {
        const { rows } = await q(
          "select * from products where status='active' and archived=false order by created_at desc"
        );
        return res.json({ data: rows, error: null });
      }
      case "increment_product_views":
        await q("update products set views_count = views_count + 1 where id=$1", [a.product_id]);
        return res.json({ data: null, error: null });
      case "increment_product_quote_requests":
        await q("update products set quote_requests_count = quote_requests_count + 1 where id=$1", [a.product_id]);
        return res.json({ data: null, error: null });
      case "has_role": {
        const { rows } = await q("select 1 from user_roles where user_id=$1 and role=$2", [
          a._user_id ?? user?.id,
          a._role,
        ]);
        return res.json({ data: rows.length > 0, error: null });
      }
      case "get_user_role": {
        const { rows } = await q("select role from user_roles where user_id=$1 limit 1", [a._user_id ?? user?.id]);
        return res.json({ data: rows[0]?.role ?? null, error: null });
      }
      case "get_employees_with_roles":
      case "get_employee_profiles": {
        const { rows } = await q(
          `select u.id, u.email, u.full_name, u.avatar_url, u.created_at,
                  coalesce(array_agg(r.role) filter (where r.role is not null),'{}') as roles
           from users u left join user_roles r on r.user_id=u.id group by u.id order by u.created_at`
        );
        return res.json({ data: rows, error: null });
      }

      // ── employee management (replaces Supabase invite RPCs + admin edge fns) ──
      // Admin/director creates an employee directly with email+password+role.
      case "create_employee": {
        if (!user || !hasLevel(user.roles, "admin"))
          return res.json({ data: null, error: { message: "forbidden: нужны права admin или director" } });
        const email = String(a.email ?? "").trim().toLowerCase();
        const password = String(a.password ?? "");
        const fullName =
          a.full_name != null && String(a.full_name).trim() !== "" ? String(a.full_name).trim() : null;
        const role = String(a.role ?? "user");
        if (!email || !password)
          return res.json({ data: null, error: { message: "email и пароль обязательны" } });
        if (password.length < 6)
          return res.json({ data: null, error: { message: "пароль слишком короткий (минимум 6 символов)" } });
        if (!VALID_ROLES.includes(role))
          return res.json({ data: null, error: { message: "неизвестная роль" } });
        if (role === "director" && !hasLevel(user.roles, "director"))
          return res.json({ data: null, error: { message: "только директор может создать директора" } });
        const dup = await q("select 1 from users where lower(email)=$1", [email]);
        if (dup.rowCount)
          return res.json({ data: null, error: { message: `пользователь с email ${email} уже существует` } });
        const hash = await bcrypt.hash(password, 10);
        const { rows } = await q<{ id: string; email: string; full_name: string | null; created_at: string }>(
          "insert into users (email, password_hash, full_name) values ($1,$2,$3) returning id, email, full_name, created_at",
          [email, hash, fullName]
        );
        await q("insert into user_roles (user_id, role) values ($1,$2)", [rows[0].id, role]);
        return res.json({ data: { ...rows[0], role }, error: null });
      }

      // Update an employee's email / name / password / role.
      case "update_employee": {
        if (!user || !hasLevel(user.roles, "admin"))
          return res.json({ data: null, error: { message: "forbidden: нужны права admin или director" } });
        const id = a.user_id ?? a.id;
        if (!id) return res.json({ data: null, error: { message: "user_id обязателен" } });
        if (a.email != null && String(a.email).trim() !== "") {
          const email = String(a.email).trim().toLowerCase();
          const dup = await q("select 1 from users where lower(email)=$1 and id<>$2", [email, id]);
          if (dup.rowCount) return res.json({ data: null, error: { message: `email ${email} уже занят` } });
          await q("update users set email=$1 where id=$2", [email, id]);
        }
        if (a.full_name !== undefined)
          await q("update users set full_name=$1 where id=$2", [
            a.full_name != null && String(a.full_name).trim() !== "" ? String(a.full_name).trim() : null,
            id,
          ]);
        if (a.password != null && String(a.password) !== "") {
          if (String(a.password).length < 6)
            return res.json({ data: null, error: { message: "пароль слишком короткий (минимум 6 символов)" } });
          await q("update users set password_hash=$1 where id=$2", [await bcrypt.hash(String(a.password), 10), id]);
        }
        if (a.role != null && String(a.role) !== "") {
          const role = String(a.role);
          if (!VALID_ROLES.includes(role))
            return res.json({ data: null, error: { message: "неизвестная роль" } });
          if (role === "director" && !hasLevel(user.roles, "director"))
            return res.json({ data: null, error: { message: "только директор может назначить директора" } });
          await q("delete from user_roles where user_id=$1", [id]);   // one role per user
          await q("insert into user_roles (user_id, role) values ($1,$2)", [id, role]);
        }
        return res.json({ data: { id }, error: null });
      }

      // Delete an employee (cascades user_roles). Guards self-delete + last director.
      case "delete_employee": {
        if (!user || !hasLevel(user.roles, "admin"))
          return res.json({ data: null, error: { message: "forbidden: нужны права admin или director" } });
        const id = a.user_id ?? a.id;
        if (!id) return res.json({ data: null, error: { message: "user_id обязателен" } });
        if (id === user.id) return res.json({ data: null, error: { message: "нельзя удалить самого себя" } });
        const isDir = await q("select 1 from user_roles where user_id=$1 and role='director'", [id]);
        if (isDir.rowCount) {
          const cnt = await q<{ c: number }>("select count(*)::int as c from user_roles where role='director'");
          if ((cnt.rows[0]?.c ?? 0) <= 1)
            return res.json({ data: null, error: { message: "нельзя удалить последнего директора" } });
        }
        await q("delete from users where id=$1", [id]);
        return res.json({ data: { id }, error: null });
      }

      // ── archiving (replaces archive_*/unarchive_* SQL functions) ──
      case "archive_lead": {
        if (!user) return res.json({ data: null, error: { message: "unauthenticated" } });
        await q("update leads set archived=true, archived_at=now(), archived_by=$2 where id=$1",
          [a.lead_id, a.user_id ?? user.id]);
        return res.json({ data: true, error: null });
      }
      case "archive_client": {
        if (!user) return res.json({ data: null, error: { message: "unauthenticated" } });
        await q("update clients set archived=true, archived_at=now(), archived_by=$2 where id=$1",
          [a.p_client_id ?? a.client_id, a.p_user_id ?? user.id]);
        return res.json({ data: true, error: null });
      }
      case "archive_warehouse_item": {
        if (!user) return res.json({ data: null, error: { message: "unauthenticated" } });
        await q("update warehouse_items set archived=true, archived_at=now(), archived_by=$2 where id=$1",
          [a.item_id, a.user_id ?? user.id]);
        return res.json({ data: true, error: null });
      }
      case "unarchive_product": {
        if (!user) return res.json({ data: null, error: { message: "unauthenticated" } });
        await q("update products set archived=false, archived_at=null, archived_by=null where id=$1", [a.product_id]);
        return res.json({ data: true, error: null });
      }

      // ── low stock (warehouse / client stock alerts) ──
      case "get_low_stock_items": {
        const { rows } = await q(
          `select cs.*, c.name as client_name, p.name as product_name
           from client_stock cs
           left join clients c on c.id = cs.client_id
           left join products p on p.id = cs.product_id
           where cs.minimum_stock is not null and cs.quantity <= cs.minimum_stock
           order by cs.quantity asc`
        );
        return res.json({ data: rows, error: null });
      }
      case "get_clients_with_low_stock": {
        const { rows } = await q(
          `select distinct c.*
           from clients c join client_stock cs on cs.client_id = c.id
           where cs.minimum_stock is not null and cs.quantity <= cs.minimum_stock`
        );
        return res.json({ data: rows, error: null });
      }

      // ── activity / system logging — fire-and-forget: NEVER throw, NEVER block the UI ──
      case "log_system_event": {
        try {
          await q(
            `insert into system_logs (level, category, message, details, user_id, url, stack_trace)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [a.p_level ?? a.level ?? "info", a.p_category ?? a.category ?? "app",
             a.p_message ?? a.message ?? "", a.p_details ?? a.details ?? {},
             user?.id ?? null, a.p_url ?? a.url ?? null, a.p_stack ?? a.stack_trace ?? null]
          );
        } catch { /* logging must never break the app */ }
        return res.json({ data: null, error: null });
      }
      case "log_employee_activity": {
        try {
          if (user) await q(
            `insert into employee_activity (user_id, action_type, entity_type, entity_id, details)
             values ($1,$2,$3,$4,$5)`,
            [user.id, a.p_action_type ?? "action", a.p_entity_type ?? null, a.p_entity_id ?? null, a.p_details ?? {}]
          );
        } catch {}
        return res.json({ data: null, error: null });
      }
      case "log_clinic_activity": {
        try {
          await q(
            `insert into clinic_activity_logs (client_id, action_type, action_description, changed_fields, user_id)
             values ($1,$2,$3,$4,$5)`,
            [a.p_client_id, a.p_action_type ?? "action", a.p_action_description ?? null, a.p_changed_fields ?? {}, user?.id ?? null]
          );
        } catch {}
        return res.json({ data: null, error: null });
      }
      case "cleanup_old_logs": {
        if (!user || !hasLevel(user.roles, "admin"))
          return res.json({ data: null, error: { message: "forbidden" } });
        const days = String(parseInt(String(a.days_to_keep ?? 30), 10) || 30);
        const { rowCount } = await q(
          `delete from system_logs where created_at < now() - ($1 || ' days')::interval`, [days]
        );
        return res.json({ data: rowCount, error: null });
      }
      case "get_log_statistics": {
        const { rows } = await q(
          `select level, count(*)::int as count from system_logs
           where ($1::date is null or created_at >= $1::date)
             and ($2::date is null or created_at < ($2::date + 1))
           group by level`,
          [a.p_start_date ?? null, a.p_end_date ?? null]
        );
        const by: Record<string, number> = {};
        let total = 0;
        for (const r of rows as any[]) { by[r.level] = r.count; total += r.count; }
        return res.json({
          data: { total_logs: total, by_level: by, errors: by.error ?? 0,
                  warnings: (by.warn ?? 0) + (by.warning ?? 0), info: by.info ?? 0 },
          error: null,
        });
      }
      case "get_employee_performance_metrics": {
        const { rows } = await q(
          `select action_type, count(*)::int as count from employee_activity
           where user_id = $1
             and ($2::date is null or created_at >= $2::date)
             and ($3::date is null or created_at < ($3::date + 1))
           group by action_type`,
          [a.p_user_id ?? user?.id, a.p_start_date ?? null, a.p_end_date ?? null]
        );
        const total = (rows as any[]).reduce((s, r) => s + r.count, 0);
        return res.json({ data: { total_actions: total, by_action: rows }, error: null });
      }
      case "update_conversion_analytics": {
        try {
          await q(
            `insert into conversion_analytics (product_id, date, views_count, quote_requests_count, conversion_rate)
             select p.id, $2::date, coalesce(p.views_count,0), coalesce(p.quote_requests_count,0),
                    case when coalesce(p.views_count,0) > 0
                         then round(coalesce(p.quote_requests_count,0)::numeric / p.views_count * 100, 2) else 0 end
             from products p where p.id = $1
             on conflict (product_id, date) do update
               set views_count = excluded.views_count,
                   quote_requests_count = excluded.quote_requests_count,
                   conversion_rate = excluded.conversion_rate,
                   updated_at = now()`,
            [a.p_product_id, a.p_date ?? new Date().toISOString().slice(0, 10)]
          );
        } catch {}
        return res.json({ data: null, error: null });
      }

      // ── invites / first director bootstrap ──
      case "validate_invite": {
        const { rows } = await q(
          `select email, role, id from user_invites where id=$1 and not used and expires_at > now()`,
          [a.p_invite_id]
        );
        return res.json({ data: rows, error: null });
      }
      case "assign_role_from_invite": {
        const { rows } = await q(
          `select * from user_invites where id=$1 and not used and expires_at > now()`, [a.p_invite_id]
        );
        if (!rows.length)
          return res.json({ data: null, error: { message: "Приглашение недействительно или истекло" } });
        const inv = rows[0] as any;
        await q("delete from user_roles where user_id=$1", [a.p_user_id]);
        await q("insert into user_roles (user_id, role) values ($1,$2)", [a.p_user_id, inv.role]);
        await q("update user_invites set used=true where id=$1", [a.p_invite_id]);
        return res.json({ data: { user_id: a.p_user_id, role: inv.role }, error: null });
      }
      case "apply_invite_permissions":
        return res.json({ data: null, error: null }); // custom permissions optional
      case "create_first_director": {
        const ex = await q("select 1 from user_roles where role='director' limit 1");
        if (ex.rowCount) return res.json({ data: null, error: { message: "Директор уже существует" } });
        const { rows } = await q(
          "insert into user_invites (email, role) values ($1,'director') returning id", [a.director_email]
        );
        return res.json({ data: { invite_id: rows[0].id, email: a.director_email }, error: null });
      }
      case "register_specific_director": {
        if (!a.user_id) return res.json({ data: null, error: { message: "user_id required" } });
        await q("delete from user_roles where user_id=$1", [a.user_id]);
        await q("insert into user_roles (user_id, role) values ($1,'director')", [a.user_id]);
        return res.json({ data: { user_id: a.user_id, role: "director" }, error: null });
      }

      default:
        // unknown RPC: return null rather than crashing the UI (to be implemented as needed)
        return res.json({ data: null, error: null });
    }
  } catch (e: any) {
    return res.json({ data: null, error: { message: e.message, code: e.code } });
  }
});

export default router;

# Supabase Backend Export Import Guide

This directory contains SQL exports and Edge Function sources required to bootstrap a new Supabase project with the MSC Heal Hub backend.

## 1. Apply database schema and functions

Run the SQL files in the following order (functions first so trigger references resolve), either with the Supabase CLI or any PostgreSQL client connected to your project:

```bash
# Using Supabase CLI
supabase db execute --file supabase/export/rpc.sql
supabase db execute --file supabase/export/schema.sql
supabase db execute --file supabase/export/storage.sql
```

If you prefer `psql`, run:

```bash
psql "$SUPABASE_DB_URL" -f supabase/export/rpc.sql
psql "$SUPABASE_DB_URL" -f supabase/export/schema.sql
psql "$SUPABASE_DB_URL" -f supabase/export/storage.sql
```

## 2. Deploy Edge Functions

Each function source lives under `supabase/edge/<function-name>`. Deploy them with the Supabase CLI after logging in and selecting the target project:

```bash
supabase functions deploy admin-user-management --project-ref <project-ref>
supabase functions deploy client-stock-update --project-ref <project-ref>
supabase functions deploy delete-user --project-ref <project-ref>
supabase functions deploy enqueue-notification --project-ref <project-ref>
supabase functions deploy lead-create --project-ref <project-ref>
supabase functions deploy link-telegram --project-ref <project-ref>
supabase functions deploy process-notifications --project-ref <project-ref>
supabase functions deploy user-role --project-ref <project-ref>
```

> Replace `<project-ref>` with your Supabase project reference.

## 3. Required environment variables for Edge Functions

Set the secrets before deploying using `supabase secrets set KEY=value` (or the Supabase dashboard). The matrix below lists which functions depend on each variable.

| Variable | Used by functions |
| --- | --- |
| `SUPABASE_URL` | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions |
| `SUPABASE_ANON_KEY` | `admin-user-management` |
| `BOT_BACKEND_JWT` | `client-stock-update`, `enqueue-notification`, `lead-create`, `link-telegram`, `user-role` |
| `TELEGRAM_BOT_TOKEN` | `process-notifications` |

Ensure the database contains any referenced secrets (e.g. Telegram bot token) before invoking the functions.

## 4. Storage buckets

After running `supabase/export/storage.sql`, the following buckets and policies are provisioned:

- `product-images` – public read, authenticated upload/update/delete.
- `deal-documents` – private bucket for accountants and sales managers.

No additional manual steps are required unless you need to adjust permissions.

## 5. Post-import verification

After completing the import, run the following sanity checks to confirm everything
is wired correctly:

1. **Confirm roles are seeded** – `select * from public.user_roles limit 5;`
   ensures the `handle_new_user` trigger populated default roles.
2. **Smoke-test Edge Functions** – invoke a lightweight request against each
   deployed function using `supabase functions invoke <name>` with the required
   headers to confirm secrets are loaded.
3. **Validate storage policies** – upload and fetch a file in both buckets to
   verify RLS behaviour for authenticated and unauthenticated users.


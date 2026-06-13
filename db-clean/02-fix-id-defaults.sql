-- Restore gen_random_uuid() defaults on uuid `id` columns.
--
-- The schema imported into the live `msc` DB lost the DEFAULT on several uuid id
-- columns (data was inserted with explicit ids during import, so the default was
-- never needed — until the app started inserting new rows). Without it, EVERY
-- insert that relies on the server-generated id fails with:
--   null value in column "id" of relation "users" violates not-null constraint (23502)
-- This broke /auth/register and employee creation. Idempotent + safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'id'
      AND data_type = 'uuid' AND column_default IS NULL
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', r.table_name);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'restored id default on % table(s)', n;
END $$;

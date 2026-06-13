-- Permanent, race-safe slug de-duplication for products.
--
-- Background: products.slug is `text UNIQUE` (20251212061851). The app generated
-- slugs from the English name with no de-duplication, so a new product whose name
-- normalized to an already-used slug failed the UNIQUE constraint with Postgres
-- 23505, surfaced by PostgREST as HTTP 409 Conflict ("ошибка при добавлении товара").
-- Migration 20251219122856 fixed the EXISTING data once (appending -2, -3, ...) but
-- left no permanent guard, so the write path kept colliding.
--
-- This trigger makes that numeric-suffix convention permanent and authoritative for
-- EVERY write path (both client hooks, the CSV bulk import, and any future direct
-- API call), and it closes the client-side check-then-insert race because the
-- de-duplication runs inside the same statement that performs the write.
--
-- Safe to apply to live data: existing slugs are already unique, and the trigger
-- only rewrites slugs that would otherwise collide. No backfill required.

CREATE OR REPLACE FUNCTION public.products_set_unique_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  n int := 1;
BEGIN
  -- Use the slug the client sent; fall back to the row id so slug is never blank.
  -- (Column defaults — including products.id's gen_random_uuid() — are populated
  --  before BEFORE-row triggers fire, so NEW.id is reliable here, even on INSERT.)
  base_slug := NULLIF(btrim(COALESCE(NEW.slug, '')), '');
  IF base_slug IS NULL THEN
    base_slug := NEW.id::text;
  END IF;

  candidate := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM public.products
    WHERE slug = candidate
      AND id <> NEW.id          -- exclude self so UPDATEs keep their own slug
  ) LOOP
    n := n + 1;
    candidate := base_slug || '-' || n;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

-- Fire only when slug or name actually change, so unrelated updates (status,
-- archive, price, view counters) skip the existence check entirely.
DROP TRIGGER IF EXISTS set_products_unique_slug ON public.products;
CREATE TRIGGER set_products_unique_slug
  BEFORE INSERT OR UPDATE OF slug, name ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_set_unique_slug();

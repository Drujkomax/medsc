-- Drop the redundant non-unique index on products.slug.
--
-- Migration 20251212061851 created slug as `text UNIQUE` (which already builds a
-- btree index, products_slug_key) AND a second plain index idx_products_slug on the
-- same column. The second index is fully redundant: every slug lookup (including the
-- public useProduct() `.eq('slug', ...)` query) is served by the unique index just
-- as well. Keeping both only adds write overhead and storage. Safe to drop.

DROP INDEX IF EXISTS public.idx_products_slug;

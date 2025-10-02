-- Remove duplicate observer policies that may conflict with the general policy
-- The general "Observers can view all products" policy already covers drafts and archived items

DROP POLICY IF EXISTS "Observers can view product drafts" ON public.products;
DROP POLICY IF EXISTS "Observers can view archived products" ON public.products;
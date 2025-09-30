-- Relax deals constraint to support line-item-based deals
ALTER TABLE public.deals
DROP CONSTRAINT IF EXISTS deals_product_or_service_check;
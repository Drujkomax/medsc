-- Fix security issues by setting search_path for new functions
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION public.increment_product_quote_requests(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products 
  SET quote_requests_count = COALESCE(quote_requests_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
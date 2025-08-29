-- Add view tracking and quote request counters to products
ALTER TABLE public.products 
ADD COLUMN views_count integer DEFAULT 0,
ADD COLUMN quote_requests_count integer DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_products_views_count ON public.products(views_count);
CREATE INDEX idx_products_quote_requests_count ON public.products(quote_requests_count);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment quote request count
CREATE OR REPLACE FUNCTION increment_product_quote_requests(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products 
  SET quote_requests_count = COALESCE(quote_requests_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Remove the check constraint on price
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_price_check;

-- Change price column from numeric to text to support price ranges
ALTER TABLE public.products 
ALTER COLUMN price TYPE text USING price::text;

-- Update the comment to reflect the new format
COMMENT ON COLUMN public.products.price IS 'Product price - can be a single value or range (e.g., "24.000-88.000 EURO", "5000 USD")';
-- Add price column to products table
ALTER TABLE public.products 
ADD COLUMN price DECIMAL(10,2) CHECK (price >= 0);

-- Add index for price queries
CREATE INDEX idx_products_price ON public.products(price);

-- Add comment for documentation
COMMENT ON COLUMN public.products.price IS 'Product price in USD';
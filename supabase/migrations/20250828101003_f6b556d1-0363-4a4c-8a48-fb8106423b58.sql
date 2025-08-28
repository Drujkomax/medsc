-- Add constraint to currency field to include UZS
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_currency_check;

-- Add check constraint for supported currencies
ALTER TABLE public.products 
ADD CONSTRAINT products_currency_check 
CHECK (currency IN ('USD', 'EUR', 'UZS'));

-- Update comment for currency field
COMMENT ON COLUMN public.products.currency IS 'Product price currency (USD, EUR, UZS)';
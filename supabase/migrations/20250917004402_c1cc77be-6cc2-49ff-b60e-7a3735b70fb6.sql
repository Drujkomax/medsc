-- Update RLS policy for product_categories to allow public access for reading
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON public.product_categories;

CREATE POLICY "Categories are publicly viewable" ON public.product_categories
FOR SELECT USING (true);

-- Also make sure products are publicly viewable
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;

CREATE POLICY "Products are publicly viewable" ON public.products
FOR SELECT USING (status = 'active' AND archived = false);
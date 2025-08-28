-- Update RLS policy to allow directors to manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;

CREATE POLICY "Admins and directors can manage categories" 
ON public.product_categories 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'director'::app_role)
);
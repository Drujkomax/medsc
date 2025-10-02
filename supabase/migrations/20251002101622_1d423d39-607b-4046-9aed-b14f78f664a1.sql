-- Allow Observers to view product drafts and archived products

-- Policy: Observers can view product drafts (not archived)
CREATE POLICY "Observers can view product drafts"
ON public.products
FOR SELECT
USING (
  public.has_role(auth.uid(), 'observer')
  AND status = 'draft'
);

-- Policy: Observers can view archived products (any status)
CREATE POLICY "Observers can view archived products"
ON public.products
FOR SELECT
USING (
  public.has_role(auth.uid(), 'observer')
  AND archived = true
);

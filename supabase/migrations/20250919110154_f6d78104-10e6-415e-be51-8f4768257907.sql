-- Allow salespersons to create leads assigned to themselves
CREATE POLICY IF NOT EXISTS "Salespersons can create their own leads"
ON public.leads
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'salesperson')
  AND assigned_to = auth.uid()
  AND source <> 'website_form'
);

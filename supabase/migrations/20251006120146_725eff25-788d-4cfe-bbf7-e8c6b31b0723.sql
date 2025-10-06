-- Update RLS policy for deals to allow accountants to create deals
DROP POLICY IF EXISTS "Users can create deals" ON public.deals;

CREATE POLICY "Users can create deals"
ON public.deals
FOR INSERT
WITH CHECK (
  (has_role_level(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
  AND auth.uid() = created_by
);
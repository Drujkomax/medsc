-- Allow accountants to view all employee profiles (needed for assigning roles in deals)
CREATE POLICY "Accountants can view all employee profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));
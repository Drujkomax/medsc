-- Allow accountants to view all leads (needed for creating deals with clients)
CREATE POLICY "Accountants can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));
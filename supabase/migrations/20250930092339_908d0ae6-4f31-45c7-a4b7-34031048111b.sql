-- Update RLS policy to allow accountants to view deals
DROP POLICY IF EXISTS "Users can view their team's deals" ON deals;

CREATE POLICY "Users can view their team's deals" 
ON deals 
FOR SELECT 
USING (
  has_role_level(auth.uid(), 'salesperson'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);
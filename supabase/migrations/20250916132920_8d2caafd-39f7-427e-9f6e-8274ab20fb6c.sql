-- Fix security issue: Remove public read access to leads table
-- Drop the problematic policy that allows public read access
DROP POLICY IF EXISTS "Allow website lead submissions with read access" ON public.leads;

-- Create a new policy that only allows INSERT for unauthenticated website form submissions
CREATE POLICY "Allow website form submissions only" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NULL) AND 
  (source = 'website_form') AND 
  (stage = 'new')
);

-- Ensure authenticated users can still read leads based on existing role-based policies
-- (The existing policies for authenticated users should remain unchanged)
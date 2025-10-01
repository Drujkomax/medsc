-- Add support for multiple assignees in tasks table
ALTER TABLE public.tasks 
ADD COLUMN assignee_ids uuid[] DEFAULT '{}';

-- Migrate existing single assignee data to array
UPDATE public.tasks 
SET assignee_ids = ARRAY[assignee_id]::uuid[]
WHERE assignee_id IS NOT NULL;

-- Keep assignee_id for backward compatibility but make it nullable
-- (we'll maintain it as the "primary" assignee for simpler queries)

-- Update RLS policies to check both assignee_id and assignee_ids
DROP POLICY IF EXISTS "Assignee can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "All employees can view tasks" ON public.tasks;

CREATE POLICY "All employees can view tasks" 
ON public.tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'salesperson'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role(auth.uid(), 'engineer'::app_role) OR 
  assignee_id = auth.uid() OR
  auth.uid() = ANY(assignee_ids)
);

CREATE POLICY "Assignee can update own tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'salesperson'::app_role) OR 
   has_role(auth.uid(), 'accountant'::app_role) OR 
   has_role(auth.uid(), 'engineer'::app_role)) AND 
  (assignee_id = auth.uid() OR auth.uid() = ANY(assignee_ids))
)
WITH CHECK (
  assignee_id = auth.uid() OR auth.uid() = ANY(assignee_ids)
);
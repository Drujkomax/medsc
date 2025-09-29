-- Adjust RLS policies on tasks to allow everyone to complete tasks,
-- and only directors/managers/admins to reopen or do broader updates.

-- Drop existing UPDATE policy to replace with clearer set
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tasks' 
      AND policyname = 'Task update permissions'
  ) THEN
    EXECUTE 'DROP POLICY "Task update permissions" ON public.tasks';
  END IF;
END $$;

-- Managers can update tasks (including reopening, editing fields, etc.)
CREATE POLICY "Managers can update tasks"
ON public.tasks
FOR UPDATE
USING (
  has_role(auth.uid(), 'director'::app_role)
  OR has_role(auth.uid(), 'sales_manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (true);

-- Assignee can update their own tasks (preserve previous capability)
CREATE POLICY "Assignee can update own tasks"
ON public.tasks
FOR UPDATE
USING (
  (
    has_role(auth.uid(), 'salesperson'::app_role)
    OR has_role(auth.uid(), 'accountant'::app_role)
    OR has_role(auth.uid(), 'engineer'::app_role)
  )
  AND (assignee_id = auth.uid())
)
WITH CHECK (assignee_id = auth.uid());

-- All employees can mark any task as completed
CREATE POLICY "Employees can mark tasks completed"
ON public.tasks
FOR UPDATE
USING (
  has_role(auth.uid(), 'salesperson'::app_role)
  OR has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'engineer'::app_role)
)
WITH CHECK (status = 'completed');
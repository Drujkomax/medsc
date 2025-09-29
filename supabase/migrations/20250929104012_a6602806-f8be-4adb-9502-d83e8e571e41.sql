-- Сначала посмотрим, какие политики существуют для tasks
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'tasks';

-- Удаляем все существующие политики для tasks
DROP POLICY IF EXISTS "Only directors and managers can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task update permissions" ON public.tasks;
DROP POLICY IF EXISTS "All employees can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.tasks;
-- Создаем новые политики для tasks с учетом иерархии ролей

-- Политика создания задач: только директор и руководитель могут создавать
CREATE POLICY "Only directors and managers can create tasks" ON public.tasks
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Политика обновления: директор и руководитель могут редактировать все, остальные только статус выполнения
CREATE POLICY "Task update permissions" ON public.tasks
FOR UPDATE USING (
  -- Директор, руководитель и админ могут редактировать все
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Остальные роли (включая бухгалтера и инженера) могут только выполнять свои задачи
  (
    (has_role(auth.uid(), 'salesperson'::app_role) OR 
     has_role(auth.uid(), 'accountant'::app_role) OR 
     has_role(auth.uid(), 'engineer'::app_role)) AND 
    assignee_id = auth.uid()
  )
);

-- Политика просмотра: все сотрудники могут видеть задачи
CREATE POLICY "All employees can view tasks" ON public.tasks
FOR SELECT USING (
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'salesperson'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role) OR
  has_role(auth.uid(), 'engineer'::app_role) OR
  -- Или если это их назначенная задача
  assignee_id = auth.uid()
);

-- Политика удаления: только директор, руководитель и админ могут удалять
CREATE POLICY "Admins can delete tasks" ON public.tasks
FOR DELETE USING (
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);
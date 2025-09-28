-- Исправление проблемы безопасности: ограничение доступа к клиентским данным
-- Удаляем текущие слишком разрешительные политики для таблицы clients
DROP POLICY IF EXISTS "Users can view their team's clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their team's clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

-- Создаем более строгие политики безопасности

-- 1. Только создатель клиента может видеть его данные (кроме менеджеров и администраторов)
CREATE POLICY "Users can view only their own clients"
ON public.clients FOR SELECT 
USING (
  created_by = auth.uid() OR 
  has_role_level(auth.uid(), 'sales_manager'::app_role)
);

-- 2. Пользователи могут создавать клиентов только для себя
CREATE POLICY "Users can create their own clients"
ON public.clients FOR INSERT 
WITH CHECK (
  has_role_level(auth.uid(), 'salesperson'::app_role) AND 
  created_by = auth.uid()
);

-- 3. Пользователи могут обновлять только своих клиентов (кроме менеджеров)
CREATE POLICY "Users can update only their own clients"
ON public.clients FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  has_role_level(auth.uid(), 'sales_manager'::app_role)
);

-- 4. Только администраторы и директора могут удалять клиентов
CREATE POLICY "Admins and directors can delete clients"
ON public.clients FOR DELETE 
USING (
  has_role_level(auth.uid(), 'admin'::app_role)
);

-- Добавляем функцию для получения клиентов пользователя с учетом роли
CREATE OR REPLACE FUNCTION public.get_user_accessible_clients(user_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  company text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_contact timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.email, c.phone, c.company, c.notes, 
         c.created_by, c.created_at, c.updated_at, c.last_contact
  FROM public.clients c
  WHERE 
    -- Если пользователь - менеджер или выше, видит всех клиентов
    has_role_level(user_id, 'sales_manager'::app_role) OR
    -- Иначе видит только своих клиентов
    c.created_by = user_id
  ORDER BY c.updated_at DESC;
$$;
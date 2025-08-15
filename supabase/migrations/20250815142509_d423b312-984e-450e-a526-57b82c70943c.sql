-- Удаляем небезопасную политику, которая позволяет всем читать лиды
DROP POLICY IF EXISTS "Allow users to view leads" ON public.leads;

-- Создаем новую безопасную политику: только админы могут читать все лиды
CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Создаем политику для пользователей: они могут видеть только назначенные им лиды
CREATE POLICY "Users can view assigned leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (assigned_to = auth.uid());
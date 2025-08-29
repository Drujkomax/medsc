-- Исправление функций с небезопасным search_path
-- Обновляем функцию create_user_invite
CREATE OR REPLACE FUNCTION public.create_user_invite(invite_email text, invite_role app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_id UUID;
  result JSON;
BEGIN
  -- Проверяем права
  IF NOT (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Недостаточно прав для создания приглашений';
  END IF;

  -- Создаем приглашение
  INSERT INTO public.user_invites (email, role, created_by)
  VALUES (invite_email, invite_role, auth.uid())
  RETURNING id INTO invite_id;
  
  result := json_build_object(
    'invite_id', invite_id,
    'email', invite_email,
    'role', invite_role,
    'invite_link', '/admin/register/' || invite_id
  );
  
  RETURN result;
END;
$function$;

-- Обновляем функцию accept_invite
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id uuid, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_record public.user_invites;
  result JSON;
BEGIN
  -- Получаем приглашение
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = invite_id
    AND NOT used
    AND expires_at > now();
    
  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Приглашение недействительно или истекло';
  END IF;
  
  -- Помечаем приглашение как использованное
  UPDATE public.user_invites 
  SET used = true 
  WHERE id = invite_id;
  
  result := json_build_object(
    'email', invite_record.email,
    'role', invite_record.role,
    'message', 'Приглашение принято. Теперь зарегистрируйтесь с этим email.'
  );
  
  RETURN result;
END;
$function$;

-- Обновляем функцию create_first_director
CREATE OR REPLACE FUNCTION public.create_first_director(director_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_id UUID;
  result JSON;
BEGIN
  -- Проверяем, нет ли уже директора в системе
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'director') THEN
    RAISE EXCEPTION 'Директор уже существует в системе';
  END IF;

  -- Создаем приглашение для директора
  INSERT INTO public.user_invites (email, role)
  VALUES (director_email, 'director')
  RETURNING id INTO invite_id;
  
  result := json_build_object(
    'invite_id', invite_id,
    'email', director_email,
    'role', 'director',
    'invite_link', '/admin/register/' || invite_id,
    'message', 'Создано приглашение для первого директора'
  );
  
  RETURN result;
END;
$function$;

-- Обновляем функцию get_pending_invites
CREATE OR REPLACE FUNCTION public.get_pending_invites()
RETURNS TABLE(id uuid, email text, role app_role, created_at timestamp with time zone, expires_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, email, role, created_at, expires_at
  FROM public.user_invites
  WHERE NOT used AND expires_at > now()
  ORDER BY created_at DESC;
$function$;

-- КРИТИЧНО: Ограничиваем доступ к таблице продуктов
-- Удаляем публичную политику "Products are viewable by everyone"
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Создаем более безопасную политику для просмотра продуктов
CREATE POLICY "Products viewable by authenticated users and website visitors"
ON public.products
FOR SELECT
USING (
  -- Аутентифицированные пользователи могут видеть все продукты
  auth.uid() IS NOT NULL
  OR
  -- Анонимные пользователи могут видеть только активные неархивированные продукты
  (auth.role() = 'anon' AND status = 'active' AND NOT archived)
);

-- Создаем политику для публичного API (только базовая информация)
CREATE POLICY "Public product catalog access"
ON public.products
FOR SELECT
USING (
  auth.role() = 'anon' 
  AND status = 'active' 
  AND NOT archived
);

-- Добавляем представление для публичного каталога (скрывает чувствительные данные)
CREATE OR REPLACE VIEW public.public_products AS
SELECT 
  id,
  name,
  description,
  category,
  images,
  features,
  in_stock,
  created_at,
  country
FROM public.products
WHERE status = 'active' AND NOT archived;

-- Настраиваем RLS для представления
ALTER VIEW public.public_products OWNER TO postgres;

-- Создаем политику для публичного представления
CREATE POLICY "Public products view access"
ON public.products
FOR SELECT
USING (
  auth.role() = 'anon' 
  AND status = 'active' 
  AND NOT archived
);
-- Phase 1: Исправляем безопасность базы данных
-- Исправляем функции безопасности с добавлением SET search_path

-- Заменяем функцию handle_new_user с правильным search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- По умолчанию новые пользователи получают роль 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Заменяем функцию archive_lead с правильным search_path
CREATE OR REPLACE FUNCTION public.archive_lead(lead_id uuid, user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.leads 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id
  WHERE id = lead_id;
END;
$function$;

-- Заменяем функцию register_specific_director с правильным search_path
CREATE OR REPLACE FUNCTION public.register_specific_director(user_id uuid, director_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  -- Обновляем или создаем роль для конкретного пользователя
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'director')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'director';
  
  result := json_build_object(
    'user_id', user_id,
    'email', director_email,
    'role', 'director',
    'message', 'Директор успешно зарегистрирован'
  );
  
  RETURN result;
END;
$function$;

-- Заменяем функцию increment_product_views с правильным search_path
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$function$;

-- Заменяем функцию increment_product_quote_requests с правильным search_path
CREATE OR REPLACE FUNCTION public.increment_product_quote_requests(product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET quote_requests_count = COALESCE(quote_requests_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$function$;

-- Заменяем функцию archive_product с правильным search_path
CREATE OR REPLACE FUNCTION public.archive_product(product_id uuid, user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id
  WHERE id = product_id;
END;
$function$;

-- Заменяем функцию unarchive_product с правильным search_path
CREATE OR REPLACE FUNCTION public.unarchive_product(product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET 
    archived = false,
    archived_at = null,
    archived_by = null
  WHERE id = product_id;
END;
$function$;

-- Заменяем функцию accept_invite с правильным search_path
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

-- Заменяем функцию update_conversion_analytics с правильным search_path
CREATE OR REPLACE FUNCTION public.update_conversion_analytics(p_product_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_views INTEGER;
  v_quotes INTEGER;
  v_conversion_rate DECIMAL(5,4);
BEGIN
  -- Получаем данные о товаре
  SELECT COALESCE(views_count, 0), COALESCE(quote_requests_count, 0)
  INTO v_views, v_quotes
  FROM public.products 
  WHERE id = p_product_id;
  
  -- Вычисляем конверсию
  v_conversion_rate := CASE 
    WHEN v_views > 0 THEN v_quotes::DECIMAL / v_views::DECIMAL
    ELSE 0.0000
  END;
  
  -- Обновляем или вставляем данные
  INSERT INTO public.conversion_analytics (product_id, date, views_count, quote_requests_count, conversion_rate)
  VALUES (p_product_id, p_date, v_views, v_quotes, v_conversion_rate)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET
    views_count = EXCLUDED.views_count,
    quote_requests_count = EXCLUDED.quote_requests_count,
    conversion_rate = EXCLUDED.conversion_rate,
    updated_at = now();
    
  -- Обновляем конверсию в таблице товаров
  UPDATE public.products 
  SET conversion_rate = v_conversion_rate
  WHERE id = p_product_id;
END;
$function$;

-- Заменяем функцию log_employee_activity с правильным search_path
CREATE OR REPLACE FUNCTION public.log_employee_activity(p_action_type text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb, p_session_duration integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.employee_activity (
    user_id, action_type, entity_type, entity_id, details, session_duration, date
  ) VALUES (
    auth.uid(), p_action_type, p_entity_type, p_entity_id, p_details, p_session_duration, CURRENT_DATE
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$;

-- Заменяем функцию get_employee_performance_metrics с правильным search_path
CREATE OR REPLACE FUNCTION public.get_employee_performance_metrics(p_user_id uuid, p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(total_actions integer, daily_average numeric, most_active_day date, activity_breakdown jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_actions,
    (COUNT(*)::DECIMAL / GREATEST(1, (p_end_date - p_start_date + 1)))::DECIMAL(10,2) as daily_average,
    (SELECT date FROM public.employee_activity 
     WHERE user_id = p_user_id AND date BETWEEN p_start_date AND p_end_date
     GROUP BY date ORDER BY COUNT(*) DESC LIMIT 1) as most_active_day,
    json_build_object(
      'login_count', COUNT(*) FILTER (WHERE action_type = 'login'),
      'product_edits', COUNT(*) FILTER (WHERE action_type = 'product_edit'),
      'lead_updates', COUNT(*) FILTER (WHERE action_type = 'lead_update'),
      'deal_actions', COUNT(*) FILTER (WHERE action_type = 'deal_action')
    )::JSONB as activity_breakdown
  FROM public.employee_activity
  WHERE user_id = p_user_id 
    AND date BETWEEN p_start_date AND p_end_date;
END;
$function$;

-- Заменяем функцию create_user_invite с правильным search_path
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

-- Заменяем функцию create_first_director с правильным search_path
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

-- Создаем безопасную функцию для создания токена настройки директора
CREATE OR REPLACE FUNCTION public.create_secure_director_setup()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  setup_token UUID;
  result JSON;
BEGIN
  -- Проверяем, нет ли уже директора в системе
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'director') THEN
    RAISE EXCEPTION 'Директор уже существует в системе';
  END IF;

  -- Генерируем токен настройки
  setup_token := gen_random_uuid();
  
  -- Создаем временный токен с истечением через 24 часа
  INSERT INTO public.director_setup_tokens (token, expires_at)
  VALUES (setup_token, now() + interval '24 hours');
  
  result := json_build_object(
    'setup_token', setup_token,
    'setup_link', '/setup/director/' || setup_token,
    'expires_at', now() + interval '24 hours',
    'message', 'Создан токен безопасной настройки директора'
  );
  
  RETURN result;
END;
$function$;

-- Создаем таблицу для безопасных токенов настройки директора
CREATE TABLE IF NOT EXISTS public.director_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone NULL
);

-- Включаем RLS для таблицы токенов
ALTER TABLE public.director_setup_tokens ENABLE ROW LEVEL SECURITY;

-- Политика: только система может управлять токенами
CREATE POLICY "System only access to setup tokens" 
ON public.director_setup_tokens 
FOR ALL 
USING (false);

-- Phase 2: Ограничиваем доступ к продуктам для анонимных пользователей
-- Создаем представление для публичного каталога с ограниченными данными
CREATE OR REPLACE VIEW public.public_products AS
SELECT 
  id,
  name,
  description,
  category,
  in_stock,
  images,
  views_count,
  created_at,
  updated_at,
  country,
  status
FROM public.products
WHERE status = 'active' AND NOT archived;

-- Включаем RLS для представления
ALTER VIEW public.public_products SET (security_barrier = true);

-- Создаем политику для публичного доступа к ограниченному каталогу
CREATE POLICY "Public catalog with limited data" 
ON public.public_products 
FOR SELECT 
USING (true);

-- Создаем функцию для валидации токена настройки директора
CREATE OR REPLACE FUNCTION public.validate_director_setup_token(token_value uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.director_setup_tokens 
    WHERE token = token_value 
      AND NOT used 
      AND expires_at > now()
  );
END;
$function$;

-- Создаем функцию для использования токена настройки
CREATE OR REPLACE FUNCTION public.use_director_setup_token(token_value uuid, director_email text, director_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  token_record public.director_setup_tokens;
  result JSON;
BEGIN
  -- Проверяем токен
  SELECT * INTO token_record
  FROM public.director_setup_tokens
  WHERE token = token_value
    AND NOT used
    AND expires_at > now();
    
  IF token_record IS NULL THEN
    RAISE EXCEPTION 'Токен недействителен или истёк';
  END IF;
  
  -- Помечаем токен как использованный
  UPDATE public.director_setup_tokens 
  SET used = true, used_at = now()
  WHERE token = token_value;
  
  result := json_build_object(
    'valid', true,
    'email', director_email,
    'message', 'Токен подтверждён. Можно создавать директора.'
  );
  
  RETURN result;
END;
$function$;
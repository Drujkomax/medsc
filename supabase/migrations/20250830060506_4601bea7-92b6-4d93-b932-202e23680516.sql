-- Phase 1: Исправляем безопасность функций базы данных
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
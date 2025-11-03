SET search_path TO public;
-- Ensure functions execute in the public schema context

-- Supabase export for MSC Heal Hub RPC functions and procedures
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- По умолчанию новые пользователи получают роль 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role_level(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        (_min_role = 'user' AND ur.role IN ('user', 'observer', 'accountant', 'engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'observer' AND ur.role IN ('observer', 'accountant', 'engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'accountant' AND ur.role IN ('accountant', 'engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'engineer' AND ur.role IN ('engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'salesperson' AND ur.role IN ('salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'sales_manager' AND ur.role IN ('sales_manager', 'admin', 'director')) OR
        (_min_role = 'admin' AND ur.role IN ('admin', 'director')) OR
        (_min_role = 'director' AND ur.role = 'director')
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_lead(_user_id uuid, _lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    LEFT JOIN public.leads l ON l.id = _lead_id
    WHERE ur.user_id = _user_id
      AND (
        ur.role IN ('director', 'admin') OR
        (ur.role = 'salesperson' AND l.assigned_to = _user_id)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.user_activity_logs (
      user_id,
      action,
      target_type,
      target_id,
      details
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE 
        WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.archive_lead(lead_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.leads 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id
  WHERE id = lead_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_specific_director(user_id uuid, director_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.archive_product(product_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Проверяем права пользователя
  IF NOT (has_role(user_id, 'director') OR has_role(user_id, 'admin') OR has_role(user_id, 'sales_manager')) THEN
    RAISE EXCEPTION 'У вас нет прав для архивирования товаров';
  END IF;

  -- Выполняем архивирование
  UPDATE public.products 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id,
    updated_at = now()
  WHERE id = product_id;
  
  -- Проверяем что обновление прошло успешно
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Товар не найден или уже архивирован';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.unarchive_product(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.products 
  SET 
    archived = false,
    archived_at = null,
    archived_by = null
  WHERE id = product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_product_views(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.products 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_product_quote_requests(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  UPDATE public.products 
  SET quote_requests_count = COALESCE(quote_requests_count, 0) + 1,
      updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversion_analytics(p_product_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_employee_activity(p_action_type text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb, p_session_duration integer DEFAULT NULL::integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_employee_performance_metrics(p_user_id uuid, p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval), p_end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (total_actions integer, daily_average numeric, most_active_day date, activity_breakdown jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_user_invite(invite_email text, invite_role app_role)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.accept_invite(invite_id uuid, user_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.create_first_director(director_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_pending_invites()
RETURNS TABLE(id uuid, email text, role app_role, created_at timestamptz, expires_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT id, email, role, created_at, expires_at
FROM public.user_invites
WHERE NOT used AND expires_at > now()
ORDER BY created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.assign_director_role(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'director')
  ON CONFLICT (user_id) DO UPDATE SET role = 'director';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_products()
RETURNS TABLE (
  id uuid,
  name jsonb,
  description jsonb,
  category text,
  images jsonb,
  features jsonb,
  in_stock boolean,
  created_at timestamp with time zone,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.images,
    p.features,
    p.in_stock,
    p.created_at,
    p.country
  FROM public.products p
  WHERE p.status = 'active' AND NOT p.archived;
$$;

CREATE OR REPLACE FUNCTION public.create_secure_director_setup()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_director_setup_token(token_value uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.director_setup_tokens 
    WHERE token = token_value 
      AND NOT used 
      AND expires_at > now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.use_director_setup_token(token_value uuid, director_email text, director_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_product_category(category_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.product_categories 
    WHERE value = category_value
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level TEXT,
  p_category TEXT,
  p_message TEXT,
  p_details JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  log_id UUID;
  should_alert BOOLEAN := false;
BEGIN
  -- Вставляем лог
  INSERT INTO public.system_logs (
    level, category, message, details, user_id, 
    ip_address, user_agent, url, stack_trace
  ) VALUES (
    p_level, p_category, p_message, p_details, COALESCE(p_user_id, auth.uid()),
    p_ip_address, p_user_agent, p_url, p_stack_trace
  ) RETURNING id INTO log_id;
  
  -- Проверяем нужно ли создать алерт
  should_alert := (
    p_level = 'error' OR 
    p_category = 'security' OR
    (p_category = 'performance' AND (p_details->>'duration')::NUMERIC > 5000)
  );
  
  -- Создаем алерт если нужно
  IF should_alert THEN
    INSERT INTO public.system_alerts (
      alert_type, title, description, severity, details, triggered_by_log_id
    ) VALUES (
      CASE 
        WHEN p_level = 'error' AND p_category = 'security' THEN 'security_breach'
        WHEN p_level = 'error' THEN 'critical_error'
        WHEN p_category = 'performance' THEN 'performance_issue'
        ELSE 'system_issue'
      END,
      CASE 
        WHEN p_level = 'error' THEN 'Системная ошибка: ' || p_message
        WHEN p_category = 'security' THEN 'Проблема безопасности: ' || p_message
        WHEN p_category = 'performance' THEN 'Проблема производительности: ' || p_message
        ELSE p_message
      END,
      p_message,
      CASE 
        WHEN p_level = 'error' AND p_category = 'security' THEN 'critical'
        WHEN p_level = 'error' THEN 'high'
        ELSE 'medium'
      END,
      p_details,
      log_id
    );
  END IF;
  
  RETURN log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_log_statistics(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  total_logs INTEGER,
  error_count INTEGER,
  warn_count INTEGER,
  info_count INTEGER,
  categories JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(sl.created_at) as date,
    COUNT(*)::INTEGER as total_logs,
    COUNT(*) FILTER (WHERE sl.level = 'error')::INTEGER as error_count,
    COUNT(*) FILTER (WHERE sl.level = 'warn')::INTEGER as warn_count,
    COUNT(*) FILTER (WHERE sl.level = 'info')::INTEGER as info_count,
    json_object_agg(sl.category, COUNT(*))::JSONB as categories
  FROM public.system_logs sl
  WHERE DATE(sl.created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(sl.created_at)
  ORDER BY DATE(sl.created_at) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_content TEXT;
  activity_type TEXT;
BEGIN
  -- Логируем изменение статуса
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    activity_content := 'Статус изменен с "' || 
      CASE OLD.stage 
        WHEN 'new' THEN 'Новый'
        WHEN 'contacted' THEN 'Связались'
        WHEN 'qualified' THEN 'Квалифицирован'
        WHEN 'proposal' THEN 'Предложение'
        WHEN 'negotiation' THEN 'Переговоры'
        WHEN 'closed' THEN 'Закрыт'
        WHEN 'lost' THEN 'Потерян'
        ELSE OLD.stage
      END || 
      '" на "' || 
      CASE NEW.stage 
        WHEN 'new' THEN 'Новый'
        WHEN 'contacted' THEN 'Связались'
        WHEN 'qualified' THEN 'Квалифицирован'
        WHEN 'proposal' THEN 'Предложение'
        WHEN 'negotiation' THEN 'Переговоры'
        WHEN 'closed' THEN 'Закрыт'
        WHEN 'lost' THEN 'Потерян'
        ELSE NEW.stage
      END || '"';
    
    INSERT INTO public.lead_activities (lead_id, type, content, old_value, new_value, created_by)
    VALUES (NEW.id, 'status_change', activity_content, OLD.stage, NEW.stage, auth.uid());
  END IF;
  
  -- Логируем изменение назначения
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    activity_content := CASE 
      WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
        'Лид назначен менеджеру'
      WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
        'Назначение лида снято'
      ELSE
        'Лид переназначен другому менеджеру'
    END;
    
    INSERT INTO public.lead_activities (lead_id, type, content, old_value, new_value, created_by)
    VALUES (NEW.id, 'assignment', activity_content, OLD.assigned_to::TEXT, NEW.assigned_to::TEXT, auth.uid());
  END IF;
  
  -- Логируем изменение основных полей
  IF OLD.name IS DISTINCT FROM NEW.name OR 
     OLD.phone IS DISTINCT FROM NEW.phone OR 
     OLD.company IS DISTINCT FROM NEW.company OR 
     OLD.email IS DISTINCT FROM NEW.email THEN
    
    INSERT INTO public.lead_activities (lead_id, type, content, created_by, metadata)
    VALUES (NEW.id, 'field_update', 'Информация о лиде обновлена', auth.uid(), 
      json_build_object(
        'updated_fields', json_build_object(
          'name', CASE WHEN OLD.name IS DISTINCT FROM NEW.name THEN json_build_object('old', OLD.name, 'new', NEW.name) ELSE NULL END,
          'phone', CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN json_build_object('old', OLD.phone, 'new', NEW.phone) ELSE NULL END,
          'company', CASE WHEN OLD.company IS DISTINCT FROM NEW.company THEN json_build_object('old', OLD.company, 'new', NEW.company) ELSE NULL END,
          'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN json_build_object('old', OLD.email, 'new', NEW.email) ELSE NULL END
        )
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_invite(p_invite_id uuid)
RETURNS TABLE (email text, role app_role, id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT ui.email, ui.role, ui.id
  FROM public.user_invites ui
  WHERE ui.id = p_invite_id
    AND NOT ui.used
    AND ui.expires_at > now();
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_user_registration(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Do not modify auth.users here. Supabase core handles email confirmations.
  -- This function exists for backward compatibility and observability only.
  result := json_build_object(
    'user_id', user_id,
    'message', 'Email confirmation managed by Supabase; no DB action performed.'
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_role_from_invite(p_invite_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  invite_record public.user_invites%ROWTYPE;
  result JSON;
BEGIN
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = p_invite_id AND NOT used AND expires_at > now();

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Приглашение недействительно или истекло';
  END IF;

  -- Назначаем роль пользователю (обходя RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, invite_record.role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Помечаем приглашение как использованное
  UPDATE public.user_invites SET used = true WHERE id = p_invite_id;

  -- Подтверждаем email пользователя (если требуется)
  PERFORM public.confirm_user_registration(p_user_id);

  result := json_build_object(
    'user_id', p_user_id,
    'email', invite_record.email,
    'role', invite_record.role,
    'message', 'Роль назначена и приглашение использовано'
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Upsert profile to avoid duplicate key errors if multiple triggers fire
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_accessible_clients(user_id uuid)
RETURNS TABLE (
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
SET search_path TO public
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

CREATE OR REPLACE FUNCTION public.get_employee_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT p.id, p.email, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE 
    -- Only return profiles if the requesting user has appropriate role
    has_role_level(auth.uid(), 'salesperson'::app_role)
  ORDER BY p.full_name, p.email;
$$;

CREATE OR REPLACE FUNCTION public.update_contact_inquiries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_custom_permission(
  _user_id UUID,
  _section TEXT,
  _required_level TEXT DEFAULT 'view_only'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_custom_permissions ecp
    LEFT JOIN public.temporary_employees te ON te.user_id = ecp.user_id
    WHERE ecp.user_id = _user_id
      AND ecp.section = _section
      AND (
        (_required_level = 'view_only' AND ecp.permission_level IN ('view_only', 'full_access')) OR
        (_required_level = 'full_access' AND ecp.permission_level = 'full_access')
      )
      AND (te.id IS NULL OR (te.expires_at > now() AND te.is_active = true))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_temporary_employee_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.temporary_employees
    WHERE user_id = _user_id
      AND expires_at > now()
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.apply_invite_permissions(
  p_invite_id uuid,
  p_user_id uuid,
  p_full_access text[],
  p_view_only text[],
  p_is_temporary boolean,
  p_expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  invite_record public.user_invites%ROWTYPE;
  profile_email text;
BEGIN
  -- Validate invite exists
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = p_invite_id;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invite id';
  END IF;

  -- Validate that the invite email matches the registering user's profile email
  SELECT email INTO profile_email FROM public.profiles WHERE id = p_user_id;
  IF profile_email IS NULL OR lower(profile_email) <> lower(invite_record.email) THEN
    RAISE EXCEPTION 'Invite email does not match user profile email';
  END IF;

  -- Reset existing custom permissions
  DELETE FROM public.employee_custom_permissions WHERE user_id = p_user_id;

  -- Insert full access permissions
  IF array_length(p_full_access, 1) IS NOT NULL THEN
    INSERT INTO public.employee_custom_permissions (user_id, section, permission_level, created_by)
    SELECT p_user_id, unnest(p_full_access), 'full_access', COALESCE(invite_record.created_by, auth.uid());
  END IF;

  -- Insert view-only permissions
  IF array_length(p_view_only, 1) IS NOT NULL THEN
    INSERT INTO public.employee_custom_permissions (user_id, section, permission_level, created_by)
    SELECT p_user_id, unnest(p_view_only), 'view_only', COALESCE(invite_record.created_by, auth.uid());
  END IF;

  -- Handle temporary employee status
  IF p_is_temporary AND p_expires_at IS NOT NULL THEN
    INSERT INTO public.temporary_employees (user_id, expires_at, is_active, created_by)
    VALUES (p_user_id, p_expires_at, true, COALESCE(invite_record.created_by, auth.uid()))
    ON CONFLICT (user_id) DO UPDATE
      SET expires_at = EXCLUDED.expires_at,
          is_active = EXCLUDED.is_active,
          created_by = EXCLUDED.created_by;
  ELSE
    DELETE FROM public.temporary_employees WHERE user_id = p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_employees_with_roles()
RETURNS TABLE (id uuid, email text, full_name text, role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT ur.user_id AS id,
         p.email,
         COALESCE(p.full_name, p.email) AS full_name,
         ur.role
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE has_role_level(auth.uid(), 'salesperson'::app_role)
     OR has_role(auth.uid(), 'accountant'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.log_deal_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  old_vals JSONB := '{}'::JSONB;
  new_vals JSONB := '{}'::JSONB;
  action TEXT;
BEGIN
  -- Получаем email и роль пользователя
  SELECT p.email INTO user_email
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  SELECT ur.role::TEXT INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    action := 'created';
    new_vals := to_jsonb(NEW);
    
    INSERT INTO public.deal_audit_log (
      deal_id, user_id, action_type, new_values, user_email, user_role
    ) VALUES (
      NEW.id, auth.uid(), action, new_vals, user_email, user_role
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    action := 'updated';
    
    -- Определяем какие поля изменились
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      changed_fields := array_append(changed_fields, 'title');
      old_vals := jsonb_set(old_vals, '{title}', to_jsonb(OLD.title));
      new_vals := jsonb_set(new_vals, '{title}', to_jsonb(NEW.title));
    END IF;
    
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      changed_fields := array_append(changed_fields, 'amount');
      old_vals := jsonb_set(old_vals, '{amount}', to_jsonb(OLD.amount));
      new_vals := jsonb_set(new_vals, '{amount}', to_jsonb(NEW.amount));
    END IF;
    
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      changed_fields := array_append(changed_fields, 'stage');
      old_vals := jsonb_set(old_vals, '{stage}', to_jsonb(OLD.stage));
      new_vals := jsonb_set(new_vals, '{stage}', to_jsonb(NEW.stage));
      action := 'stage_changed';
    END IF;
    
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      changed_fields := array_append(changed_fields, 'payment_status');
      old_vals := jsonb_set(old_vals, '{payment_status}', to_jsonb(OLD.payment_status));
      new_vals := jsonb_set(new_vals, '{payment_status}', to_jsonb(NEW.payment_status));
      IF action = 'updated' THEN
        action := 'payment_status_changed';
      END IF;
    END IF;
    
    IF OLD.assigned_salesperson IS DISTINCT FROM NEW.assigned_salesperson OR
       OLD.assigned_engineer IS DISTINCT FROM NEW.assigned_engineer OR
       OLD.assigned_accountant IS DISTINCT FROM NEW.assigned_accountant THEN
      changed_fields := array_append(changed_fields, 'assignments');
      old_vals := jsonb_set(old_vals, '{assignments}', jsonb_build_object(
        'salesperson', OLD.assigned_salesperson,
        'engineer', OLD.assigned_engineer,
        'accountant', OLD.assigned_accountant
      ));
      new_vals := jsonb_set(new_vals, '{assignments}', jsonb_build_object(
        'salesperson', NEW.assigned_salesperson,
        'engineer', NEW.assigned_engineer,
        'accountant', NEW.assigned_accountant
      ));
      IF action = 'updated' THEN
        action := 'assigned';
      END IF;
    END IF;
    
    IF OLD.debt_amount IS DISTINCT FROM NEW.debt_amount THEN
      changed_fields := array_append(changed_fields, 'debt_amount');
      old_vals := jsonb_set(old_vals, '{debt_amount}', to_jsonb(OLD.debt_amount));
      new_vals := jsonb_set(new_vals, '{debt_amount}', to_jsonb(NEW.debt_amount));
    END IF;
    
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      changed_fields := array_append(changed_fields, 'notes');
      old_vals := jsonb_set(old_vals, '{notes}', to_jsonb(OLD.notes));
      new_vals := jsonb_set(new_vals, '{notes}', to_jsonb(NEW.notes));
    END IF;
    
    -- Вставляем запись только если что-то изменилось
    IF array_length(changed_fields, 1) > 0 THEN
      INSERT INTO public.deal_audit_log (
        deal_id, user_id, action_type, old_values, new_values, 
        changed_fields, user_email, user_role
      ) VALUES (
        NEW.id, auth.uid(), action, old_vals, new_vals, 
        changed_fields, user_email, user_role
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    action := 'deleted';
    old_vals := to_jsonb(OLD);
    
    INSERT INTO public.deal_audit_log (
      deal_id, user_id, action_type, old_values, user_email, user_role
    ) VALUES (
      OLD.id, auth.uid(), action, old_vals, user_email, user_role
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_product_category_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Validate on INSERT
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_categories pc
      WHERE pc.value = NEW.category
    ) THEN
      RAISE EXCEPTION 'Invalid category value: "%" not found in product_categories', NEW.category
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  -- Validate on UPDATE only if category actually changed
  IF TG_OP = 'UPDATE' THEN
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.product_categories pc
        WHERE pc.value = NEW.category
      ) THEN
        RAISE EXCEPTION 'Invalid category value: "%" not found in product_categories', NEW.category
          USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_logs(days_to_keep integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.system_logs
  WHERE created_at < now() - (days_to_keep || ' days')::interval;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


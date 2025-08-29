-- Расширяем аналитику товаров
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS revenue_attributed DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitor_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 0;

-- Создаем таблицу для отслеживания активности сотрудников
CREATE TABLE IF NOT EXISTS public.employee_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'product_edit', 'lead_update', etc.
  entity_type TEXT, -- 'product', 'lead', 'deal', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  session_duration INTEGER, -- in minutes for logout events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Добавляем обычную колонку date
ALTER TABLE public.employee_activity 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_employee_activity_user_date ON public.employee_activity(user_id, date);
CREATE INDEX IF NOT EXISTS idx_employee_activity_action_date ON public.employee_activity(action_type, date);
CREATE INDEX IF NOT EXISTS idx_employee_activity_entity ON public.employee_activity(entity_type, entity_id);

-- Включаем RLS для employee_activity
ALTER TABLE public.employee_activity ENABLE ROW LEVEL SECURITY;

-- Политики доступа для employee_activity
CREATE POLICY "Users can create their own activity logs" ON public.employee_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Directors and admins can view all activity logs" ON public.employee_activity
  FOR SELECT USING (
    has_role(auth.uid(), 'director'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sales managers can view their team activity" ON public.employee_activity
  FOR SELECT USING (
    has_role(auth.uid(), 'sales_manager'::app_role) OR
    has_role(auth.uid(), 'director'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Создаем таблицу для аналитики конверсий
CREATE TABLE IF NOT EXISTS public.conversion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count INTEGER DEFAULT 0,
  quote_requests_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, date)
);

-- Включаем RLS для conversion_analytics
ALTER TABLE public.conversion_analytics ENABLE ROW LEVEL SECURITY;

-- Политики для conversion_analytics
CREATE POLICY "Conversion analytics viewable by managers" ON public.conversion_analytics
  FOR SELECT USING (
    has_role_level(auth.uid(), 'sales_manager'::app_role)
  );

CREATE POLICY "Conversion analytics manageable by managers" ON public.conversion_analytics
  FOR ALL USING (
    has_role_level(auth.uid(), 'sales_manager'::app_role)
  );

-- Функция для обновления аналитики конверсий
CREATE OR REPLACE FUNCTION public.update_conversion_analytics(
  p_product_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Функция для логирования активности сотрудников
CREATE OR REPLACE FUNCTION public.log_employee_activity(
  p_action_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_session_duration INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Функция для получения метрик производительности сотрудника
CREATE OR REPLACE FUNCTION public.get_employee_performance_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_actions INTEGER,
  daily_average DECIMAL(10,2),
  most_active_day DATE,
  activity_breakdown JSONB
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_conversion_analytics_updated_at
  BEFORE UPDATE ON public.conversion_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
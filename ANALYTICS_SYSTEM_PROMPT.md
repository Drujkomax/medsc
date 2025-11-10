# СИСТЕМА АНАЛИТИКИ - ПОЛНЫЙ ТЕХНИЧЕСКИЙ ПРОМПТ

## 📊 ОБЗОР СИСТЕМЫ

Комплексная система аналитики для CRM с тремя уровнями доступа:
- **Executive Overview** (только для директоров) - стратегическая аналитика
- **Product Analytics** - аналитика товаров и услуг с конверсиями
- **Employee Analytics** - мониторинг активности и производительности сотрудников

---

## 1. СТРУКТУРА БАЗЫ ДАННЫХ

### 1.1. Таблица: conversion_analytics

Хранит данные о конверсиях товаров (просмотры → запросы → сделки).

```sql
CREATE TABLE conversion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  quote_requests_count INTEGER DEFAULT 0 CHECK (quote_requests_count >= 0),
  conversions_count INTEGER DEFAULT 0 CHECK (conversions_count >= 0),
  conversion_rate NUMERIC(10,4) DEFAULT 0.0000 CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
  revenue NUMERIC(12,2) DEFAULT 0.00 CHECK (revenue >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, date)
);

-- Индексы для производительности
CREATE INDEX idx_conversion_analytics_product ON conversion_analytics(product_id);
CREATE INDEX idx_conversion_analytics_date ON conversion_analytics(date DESC);
CREATE INDEX idx_conversion_analytics_rate ON conversion_analytics(conversion_rate DESC);
CREATE INDEX idx_conversion_analytics_revenue ON conversion_analytics(revenue DESC);
CREATE INDEX idx_conversion_analytics_composite ON conversion_analytics(product_id, date DESC);
```

### 1.2. Таблица: employee_activity

Детальное логирование всех действий сотрудников.

```sql
CREATE TABLE employee_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- НЕ ССЫЛАЕТСЯ на auth.users
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login', 'logout', 'create', 'update', 'delete', 'view', 
    'export', 'import', 'assign', 'archive', 'restore',
    'send_email', 'send_notification', 'generate_report'
  )),
  entity_type TEXT CHECK (entity_type IN (
    'lead', 'deal', 'task', 'product', 'service', 'client',
    'category', 'manufacturer', 'user', 'contact_inquiry'
  )),
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  date DATE DEFAULT CURRENT_DATE,
  session_duration INTEGER CHECK (session_duration >= 0), -- в секундах
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_employee_activity_user ON employee_activity(user_id);
CREATE INDEX idx_employee_activity_date ON employee_activity(date DESC);
CREATE INDEX idx_employee_activity_action ON employee_activity(action_type);
CREATE INDEX idx_employee_activity_entity ON employee_activity(entity_type, entity_id);
CREATE INDEX idx_employee_activity_composite ON employee_activity(user_id, date DESC);
CREATE INDEX idx_employee_activity_details ON employee_activity USING gin(details);
```

### 1.3. Таблица: system_logs

Логи системных событий для мониторинга и отладки.

```sql
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');
CREATE TYPE log_category AS ENUM ('auth', 'api', 'business', 'performance', 'security', 'system');

CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level log_level NOT NULL DEFAULT 'info',
  category log_category NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  url TEXT,
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_category ON system_logs(category);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_composite ON system_logs(level, category, created_at DESC);
```

### 1.4. Таблица: employee_performance_metrics

Агрегированные метрики производительности сотрудников.

```sql
CREATE TABLE employee_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Метрики активности
  total_actions INTEGER DEFAULT 0,
  total_logins INTEGER DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- в секундах
  
  -- Метрики по лидам
  leads_created INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  
  -- Метрики по сделкам
  deals_created INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0.00,
  
  -- Метрики по задачам
  tasks_completed INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  avg_task_completion_time INTEGER DEFAULT 0, -- в часах
  
  -- Показатели эффективности
  win_rate NUMERIC(5,2) DEFAULT 0.00,
  conversion_rate NUMERIC(5,2) DEFAULT 0.00,
  productivity_score INTEGER DEFAULT 0 CHECK (productivity_score >= 0 AND productivity_score <= 100),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, period_start, period_end)
);

-- Индексы
CREATE INDEX idx_performance_user ON employee_performance_metrics(user_id);
CREATE INDEX idx_performance_period ON employee_performance_metrics(period_start, period_end);
CREATE INDEX idx_performance_score ON employee_performance_metrics(productivity_score DESC);
```

### 1.5. Таблица: system_alerts

Системные уведомления о критических событиях.

```sql
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved');

CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'low_conversion', 'high_error_rate', 'low_activity', 
    'security_threat', 'performance_issue', 'data_anomaly'
  )),
  severity alert_severity NOT NULL DEFAULT 'medium',
  status alert_status NOT NULL DEFAULT 'active',
  title TEXT NOT NULL,
  description TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  triggered_by_log_id UUID REFERENCES system_logs(id),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_alerts_status ON system_alerts(status);
CREATE INDEX idx_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_alerts_created ON system_alerts(created_at DESC);
```

---

## 2. RLS ПОЛИТИКИ

### 2.1. conversion_analytics

```sql
ALTER TABLE conversion_analytics ENABLE ROW LEVEL SECURITY;

-- Sales managers и выше могут просматривать
CREATE POLICY "Managers can view conversion analytics"
ON conversion_analytics FOR SELECT
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'));

-- Sales managers и выше могут управлять
CREATE POLICY "Managers can manage conversion analytics"
ON conversion_analytics FOR ALL
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'))
WITH CHECK (has_role_level(auth.uid(), 'sales_manager'));
```

### 2.2. employee_activity

```sql
ALTER TABLE employee_activity ENABLE ROW LEVEL SECURITY;

-- Пользователи могут создавать свои логи
CREATE POLICY "Users can create their own activity logs"
ON employee_activity FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Sales managers могут видеть активность своей команды
CREATE POLICY "Managers can view team activity"
ON employee_activity FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'sales_manager') OR
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
);

-- Директора и админы видят всё
CREATE POLICY "Directors and admins can view all activity"
ON employee_activity FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
);
```

### 2.3. system_logs

```sql
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Система может вставлять логи
CREATE POLICY "System can insert logs"
ON system_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Только директора и админы могут просматривать
CREATE POLICY "Directors and admins can view logs"
ON system_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
);
```

### 2.4. employee_performance_metrics

```sql
ALTER TABLE employee_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свои метрики
CREATE POLICY "Users can view own metrics"
ON employee_performance_metrics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Менеджеры видят метрики команды
CREATE POLICY "Managers can view team metrics"
ON employee_performance_metrics FOR SELECT
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'));

-- Менеджеры могут управлять метриками
CREATE POLICY "Managers can manage metrics"
ON employee_performance_metrics FOR ALL
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'))
WITH CHECK (has_role_level(auth.uid(), 'sales_manager'));
```

### 2.5. system_alerts

```sql
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Директора и админы могут управлять
CREATE POLICY "Directors and admins can manage alerts"
ON system_alerts FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
);
```

---

## 3. SQL ФУНКЦИИ И ТРИГГЕРЫ

### 3.1. Функция: log_employee_activity

```sql
CREATE OR REPLACE FUNCTION log_employee_activity(
  p_action_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_session_duration INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  INSERT INTO employee_activity (
    user_id,
    action_type,
    entity_type,
    entity_id,
    details,
    session_duration,
    ip_address,
    user_agent
  )
  VALUES (
    v_user_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_details,
    p_session_duration,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;
```

### 3.2. Функция: update_conversion_analytics

```sql
CREATE OR REPLACE FUNCTION update_conversion_analytics(
  p_product_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views INTEGER;
  v_quote_requests INTEGER;
  v_conversions INTEGER;
  v_revenue NUMERIC;
  v_conversion_rate NUMERIC;
BEGIN
  -- Получаем views_count из таблицы products
  SELECT views_count INTO v_views
  FROM products
  WHERE id = p_product_id;
  
  -- Получаем количество запросов цен
  SELECT quote_requests_count INTO v_quote_requests
  FROM products
  WHERE id = p_product_id;
  
  -- Получаем количество конверсий (завершенные сделки)
  SELECT COUNT(*) INTO v_conversions
  FROM deals
  WHERE product_id = p_product_id
    AND stage = 'closed'
    AND DATE(created_at) = p_date;
  
  -- Получаем выручку
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue
  FROM deals
  WHERE product_id = p_product_id
    AND stage = 'closed'
    AND DATE(created_at) = p_date;
  
  -- Вычисляем conversion rate
  IF v_views > 0 THEN
    v_conversion_rate := (v_conversions::NUMERIC / v_views::NUMERIC) * 100;
  ELSE
    v_conversion_rate := 0;
  END IF;
  
  -- Вставляем или обновляем запись
  INSERT INTO conversion_analytics (
    product_id,
    date,
    views_count,
    quote_requests_count,
    conversions_count,
    conversion_rate,
    revenue
  )
  VALUES (
    p_product_id,
    p_date,
    COALESCE(v_views, 0),
    COALESCE(v_quote_requests, 0),
    v_conversions,
    v_conversion_rate,
    v_revenue
  )
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    views_count = EXCLUDED.views_count,
    quote_requests_count = EXCLUDED.quote_requests_count,
    conversions_count = EXCLUDED.conversions_count,
    conversion_rate = EXCLUDED.conversion_rate,
    revenue = EXCLUDED.revenue,
    updated_at = now();
END;
$$;
```

### 3.3. Функция: calculate_employee_performance

```sql
CREATE OR REPLACE FUNCTION calculate_employee_performance(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS employee_performance_metrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics employee_performance_metrics;
BEGIN
  -- Проверка прав доступа
  IF NOT (
    auth.uid() = p_user_id OR
    has_role_level(auth.uid(), 'sales_manager')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Метрики активности
  SELECT
    COUNT(*) FILTER (WHERE action_type != 'login'),
    COUNT(*) FILTER (WHERE action_type = 'login'),
    COALESCE(AVG(session_duration), 0)::INTEGER
  INTO
    v_metrics.total_actions,
    v_metrics.total_logins,
    v_metrics.avg_session_duration
  FROM employee_activity
  WHERE user_id = p_user_id
    AND date BETWEEN p_start_date AND p_end_date;

  -- Метрики по лидам
  SELECT
    COUNT(*) FILTER (WHERE stage = 'new'),
    COUNT(*) FILTER (WHERE stage = 'qualified'),
    COUNT(*) FILTER (WHERE stage IN ('converted', 'deal_created'))
  INTO
    v_metrics.leads_created,
    v_metrics.leads_qualified,
    v_metrics.leads_converted
  FROM leads
  WHERE (assigned_to = p_user_id OR created_by = p_user_id)
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;

  -- Метрики по сделкам
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE stage = 'closed'),
    COUNT(*) FILTER (WHERE stage = 'lost'),
    COALESCE(SUM(amount) FILTER (WHERE stage = 'closed'), 0)
  INTO
    v_metrics.deals_created,
    v_metrics.deals_won,
    v_metrics.deals_lost,
    v_metrics.total_revenue
  FROM deals
  WHERE created_by = p_user_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;

  -- Метрики по задачам
  SELECT
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status != 'completed' AND due_date < NOW()),
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600), 0)::INTEGER
  INTO
    v_metrics.tasks_completed,
    v_metrics.tasks_overdue,
    v_metrics.avg_task_completion_time
  FROM tasks
  WHERE assignee_id = p_user_id
    AND created_at::DATE BETWEEN p_start_date AND p_end_date;

  -- Вычисление показателей эффективности
  IF v_metrics.deals_created > 0 THEN
    v_metrics.win_rate := (v_metrics.deals_won::NUMERIC / v_metrics.deals_created::NUMERIC) * 100;
  ELSE
    v_metrics.win_rate := 0;
  END IF;

  IF v_metrics.leads_created > 0 THEN
    v_metrics.conversion_rate := (v_metrics.leads_converted::NUMERIC / v_metrics.leads_created::NUMERIC) * 100;
  ELSE
    v_metrics.conversion_rate := 0;
  END IF;

  -- Productivity Score (0-100)
  v_metrics.productivity_score := LEAST(100, GREATEST(0,
    (v_metrics.total_actions / 100)::INTEGER +
    (v_metrics.win_rate)::INTEGER +
    (v_metrics.conversion_rate)::INTEGER +
    (v_metrics.tasks_completed * 2)
  ));

  -- Заполнение остальных полей
  v_metrics.id := gen_random_uuid();
  v_metrics.user_id := p_user_id;
  v_metrics.period_start := p_start_date;
  v_metrics.period_end := p_end_date;
  v_metrics.created_at := now();
  v_metrics.updated_at := now();

  -- Сохранение в базу
  INSERT INTO employee_performance_metrics
  SELECT v_metrics.*
  ON CONFLICT (user_id, period_start, period_end)
  DO UPDATE SET
    total_actions = EXCLUDED.total_actions,
    total_logins = EXCLUDED.total_logins,
    avg_session_duration = EXCLUDED.avg_session_duration,
    leads_created = EXCLUDED.leads_created,
    leads_qualified = EXCLUDED.leads_qualified,
    leads_converted = EXCLUDED.leads_converted,
    deals_created = EXCLUDED.deals_created,
    deals_won = EXCLUDED.deals_won,
    deals_lost = EXCLUDED.deals_lost,
    total_revenue = EXCLUDED.total_revenue,
    tasks_completed = EXCLUDED.tasks_completed,
    tasks_overdue = EXCLUDED.tasks_overdue,
    avg_task_completion_time = EXCLUDED.avg_task_completion_time,
    win_rate = EXCLUDED.win_rate,
    conversion_rate = EXCLUDED.conversion_rate,
    productivity_score = EXCLUDED.productivity_score,
    updated_at = now();

  RETURN v_metrics;
END;
$$;
```

### 3.4. Функция: log_system_event

```sql
CREATE OR REPLACE FUNCTION log_system_event(
  p_level log_level,
  p_category log_category,
  p_message TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO system_logs (
    level,
    category,
    message,
    details,
    user_id,
    ip_address,
    user_agent,
    url
  )
  VALUES (
    p_level,
    p_category,
    p_message,
    p_details,
    auth.uid(),
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    current_setting('request.headers', true)::json->>'referer'
  )
  RETURNING id INTO v_log_id;
  
  -- Создание алерта для критических событий
  IF p_level IN ('error', 'warn') THEN
    PERFORM create_system_alert(
      p_alert_type := CASE
        WHEN p_category = 'security' THEN 'security_threat'
        WHEN p_category = 'performance' THEN 'performance_issue'
        ELSE 'data_anomaly'
      END,
      p_severity := CASE p_level
        WHEN 'error' THEN 'high'::alert_severity
        ELSE 'medium'::alert_severity
      END,
      p_title := p_message,
      p_description := p_details->>'description',
      p_details := p_details,
      p_triggered_by_log_id := v_log_id
    );
  END IF;
  
  RETURN v_log_id;
END;
$$;
```

### 3.5. Функция: create_system_alert

```sql
CREATE OR REPLACE FUNCTION create_system_alert(
  p_alert_type TEXT,
  p_severity alert_severity,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_triggered_by_log_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO system_alerts (
    alert_type,
    severity,
    title,
    description,
    details,
    triggered_by_log_id
  )
  VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_description,
    p_details,
    p_triggered_by_log_id
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;
```

### 3.6. Функция: get_top_products_by_conversion

```sql
CREATE OR REPLACE FUNCTION get_top_products_by_conversion(
  p_limit INTEGER DEFAULT 10,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name JSONB,
  total_views BIGINT,
  total_requests BIGINT,
  total_conversions BIGINT,
  avg_conversion_rate NUMERIC,
  total_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.product_id,
    p.name as product_name,
    SUM(ca.views_count)::BIGINT as total_views,
    SUM(ca.quote_requests_count)::BIGINT as total_requests,
    SUM(ca.conversions_count)::BIGINT as total_conversions,
    AVG(ca.conversion_rate) as avg_conversion_rate,
    SUM(ca.revenue) as total_revenue
  FROM conversion_analytics ca
  JOIN products p ON p.id = ca.product_id
  WHERE (p_start_date IS NULL OR ca.date >= p_start_date)
    AND (p_end_date IS NULL OR ca.date <= p_end_date)
  GROUP BY ca.product_id, p.name
  ORDER BY avg_conversion_rate DESC, total_revenue DESC
  LIMIT p_limit;
END;
$$;
```

### 3.7. Триггер: auto_update_conversion_on_deal_close

```sql
CREATE OR REPLACE FUNCTION trigger_update_conversion_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stage = 'closed' AND OLD.stage != 'closed' THEN
    PERFORM update_conversion_analytics(NEW.product_id, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_update_conversion_on_deal_close
AFTER UPDATE ON deals
FOR EACH ROW
WHEN (NEW.product_id IS NOT NULL)
EXECUTE FUNCTION trigger_update_conversion_analytics();
```

---

## 4. TYPESCRIPT ТИПЫ

### 4.1. Analytics Types

```typescript
// Аналитика конверсий
export interface ConversionAnalytics {
  id: string;
  product_id: string;
  date: string;
  views_count: number;
  quote_requests_count: number;
  conversions_count: number;
  conversion_rate: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

// Активность сотрудников
export type ActionType =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'assign'
  | 'archive'
  | 'restore'
  | 'send_email'
  | 'send_notification'
  | 'generate_report';

export type EntityType =
  | 'lead'
  | 'deal'
  | 'task'
  | 'product'
  | 'service'
  | 'client'
  | 'category'
  | 'manufacturer'
  | 'user'
  | 'contact_inquiry';

export interface EmployeeActivity {
  id: string;
  user_id: string;
  action_type: ActionType;
  entity_type?: EntityType;
  entity_id?: string;
  details: Record<string, any>;
  date: string;
  session_duration?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Метрики производительности
export interface EmployeePerformanceMetrics {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_actions: number;
  total_logins: number;
  avg_session_duration: number;
  leads_created: number;
  leads_qualified: number;
  leads_converted: number;
  deals_created: number;
  deals_won: number;
  deals_lost: number;
  total_revenue: number;
  tasks_completed: number;
  tasks_overdue: number;
  avg_task_completion_time: number;
  win_rate: number;
  conversion_rate: number;
  productivity_score: number;
  created_at: string;
  updated_at: string;
}

// Системные логи
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'auth' | 'api' | 'business' | 'performance' | 'security' | 'system';

export interface SystemLog {
  id: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  url?: string;
  stack_trace?: string;
  created_at: string;
}

// Системные алерты
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface SystemAlert {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description?: string;
  details: Record<string, any>;
  triggered_by_log_id?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
}

// Фильтры для аналитики
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  userId?: string;
  category?: string;
}

// Топ продукты
export interface TopProduct {
  product_id: string;
  product_name: Record<string, string>;
  total_views: number;
  total_requests: number;
  total_conversions: number;
  avg_conversion_rate: number;
  total_revenue: number;
}

// Executive метрики
export interface ExecutiveMetrics {
  totalRevenue: number;
  avgConversionRate: number;
  totalLeads: number;
  qualifiedLeads: number;
  leadConversionRate: number;
  activeDeals: number;
  dealsWon: number;
  avgDealSize: number;
  topProducts: TopProduct[];
  teamActivity: {
    totalActions: number;
    activeEmployees: number;
    avgActionsPerUser: number;
  };
}

// Алерты критичности
export interface CriticalAlert {
  type: 'conversion' | 'leads' | 'activity';
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
}
```

---

## 5. REACT HOOKS

### 5.1. useAnalytics Hook

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type {
  ConversionAnalytics,
  EmployeeActivity,
  EmployeePerformanceMetrics,
  TopProduct,
} from '@/types/analytics';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить аналитику конверсий
  const getConversionAnalytics = async (
    startDate?: string,
    endDate?: string,
    productId?: string
  ): Promise<ConversionAnalytics[]> => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('conversion_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки аналитики конверсий');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Получить активность сотрудников
  const getEmployeeActivity = async (
    startDate?: string,
    endDate?: string,
    userId?: string
  ): Promise<EmployeeActivity[]> => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('employee_activity')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки активности сотрудников');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Получить метрики производительности
  const getEmployeePerformanceMetrics = async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<EmployeePerformanceMetrics | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'calculate_employee_performance',
        {
          p_user_id: userId,
          p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: endDate || new Date().toISOString().split('T')[0],
        }
      );

      if (rpcError) throw rpcError;

      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки метрик производительности');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Логировать активность
  const logActivity = async (
    actionType: string,
    entityType?: string,
    entityId?: string,
    details?: any,
    sessionDuration?: number
  ): Promise<string | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('log_employee_activity', {
        p_action_type: actionType,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_details: details || {},
        p_session_duration: sessionDuration || null,
      });

      if (rpcError) throw rpcError;

      return data;
    } catch (err: any) {
      console.error('Error logging activity:', err);
      return null;
    }
  };

  // Обновить аналитику конверсий
  const updateConversionAnalytics = async (
    productId: string,
    date?: string
  ): Promise<void> => {
    try {
      const { error: rpcError } = await supabase.rpc('update_conversion_analytics', {
        p_product_id: productId,
        p_date: date || new Date().toISOString().split('T')[0],
      });

      if (rpcError) throw rpcError;
    } catch (err: any) {
      console.error('Error updating conversion analytics:', err);
    }
  };

  // Получить топ продукты по конверсии
  const getTopProductsByConversion = async (
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<TopProduct[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'get_top_products_by_conversion',
        {
          p_limit: limit,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
        }
      );

      if (rpcError) throw rpcError;

      return data || [];
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки топ продуктов');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getConversionAnalytics,
    getEmployeeActivity,
    getEmployeePerformanceMetrics,
    logActivity,
    updateConversionAnalytics,
    getTopProductsByConversion,
  };
};
```

### 5.2. useSystemLogger Hook

```typescript
import { supabase } from '@/integrations/supabase/client';
import type { LogLevel, LogCategory } from '@/types/analytics';

export const useSystemLogger = () => {
  const logEvent = async (event: {
    level: LogLevel;
    category: LogCategory;
    message: string;
    details?: any;
  }) => {
    try {
      await supabase.rpc('log_system_event', {
        p_level: event.level,
        p_category: event.category,
        p_message: event.message,
        p_details: event.details || {},
      });

      // Дублируем в console в dev режиме
      if (import.meta.env.DEV) {
        console[event.level === 'error' ? 'error' : 'log'](
          `[${event.category}] ${event.message}`,
          event.details
        );
      }
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  };

  const logError = (category: LogCategory, message: string, details?: any) =>
    logEvent({ level: 'error', category, message, details });

  const logWarning = (category: LogCategory, message: string, details?: any) =>
    logEvent({ level: 'warn', category, message, details });

  const logInfo = (category: LogCategory, message: string, details?: any) =>
    logEvent({ level: 'info', category, message, details });

  const logPerformance = (action: string, duration: number, details?: any) =>
    logEvent({
      level: 'info',
      category: 'performance',
      message: `${action} completed in ${duration}ms`,
      details: { ...details, duration },
    });

  const logBusinessEvent = (message: string, details?: any) =>
    logEvent({ level: 'info', category: 'business', message, details });

  const logSecurityEvent = (message: string, details?: any) =>
    logEvent({ level: 'warn', category: 'security', message, details });

  return {
    logEvent,
    logError,
    logWarning,
    logInfo,
    logPerformance,
    logBusinessEvent,
    logSecurityEvent,
  };
};
```

### 5.3. useActivityLogger Hook

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = async (
    actionType: string,
    entityType?: string,
    entityId?: string,
    details?: any
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('log_employee_activity', {
        p_action_type: actionType,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_details: details || {},
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Автоматическое логирование входа
  useEffect(() => {
    if (user) {
      logActivity('login', 'system', user.id, {
        user_email: user.email,
        login_time: new Date().toISOString(),
      });
    }
  }, [user]);

  return { logActivity };
};
```

---

## 6. КОМПОНЕНТЫ

### 6.1. Analytics.tsx (Главная страница)

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Users } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ProductAnalyticsDashboard from '../components/Analytics/ProductAnalyticsDashboard';
import EmployeeActivityDashboard from '../components/Analytics/EmployeeActivityDashboard';
import ExecutiveOverview from '../components/Analytics/ExecutiveOverview';

const Analytics = () => {
  const { hasPermission, role } = useUserPermissions();

  if (!hasPermission('view_analytics')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Нет доступа</h3>
          <p className="text-muted-foreground">
            У вас нет прав для просмотра аналитики
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground">
            Комплексный анализ эффективности и производительности
          </p>
        </div>
        <Badge variant="secondary">
          {role === 'director' ? 'Полный доступ' : 'Ограниченный доступ'}
        </Badge>
      </div>

      <Tabs defaultValue={role === 'director' ? 'executive' : 'products'}>
        <TabsList className="grid w-full grid-cols-3">
          {role === 'director' && (
            <TabsTrigger value="executive">
              <TrendingUp className="h-4 w-4 mr-2" />
              Executive
            </TabsTrigger>
          )}
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Товары
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Сотрудники
          </TabsTrigger>
        </TabsList>

        {role === 'director' && (
          <TabsContent value="executive">
            <ExecutiveOverview />
          </TabsContent>
        )}

        <TabsContent value="products">
          <ProductAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="employees">
          {hasPermission('view_activity_logs') ? (
            <EmployeeActivityDashboard />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">
                У вас нет прав для просмотра активности сотрудников
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
```

### 6.2. ProductAnalyticsDashboard.tsx

Дашборд с метриками товаров, топ продуктами по конверсиям, графиками.

**Основные элементы:**
- Карточки с общими метриками (просмотры, запросы, конверсия, выручка)
- Список топ продуктов с сортировкой
- Фильтры по дате и категории
- Графики трендов (recharts)

### 6.3. EmployeeActivityDashboard.tsx

Дашборд активности сотрудников с метриками и логами.

**Основные элементы:**
- Карточки с метриками (общие действия, активные сотрудники, средняя активность)
- Список топ сотрудников по производительности
- Временная шкала активности
- Фильтры по дате и типу действий

### 6.4. ExecutiveOverview.tsx

Стратегический дашборд для директоров.

**Основные элементы:**
- KPI метрики (выручка, конверсия, лиды, сделки)
- Критические алерты
- Сводка по продуктам, лидам, команде
- Рекомендации на основе данных

---

## 7. БИЗНЕС-ЛОГИКА

### 7.1. Расчет Конверсий

**Формула:** `Conversion Rate = (Conversions / Views) * 100`

**Триггеры обновления:**
- При просмотре продукта → increment `views_count`
- При запросе цены → increment `quote_requests_count`
- При закрытии сделки → increment `conversions_count`, пересчитать `conversion_rate`

### 7.2. Productivity Score

**Формула (0-100):**
```
score = min(100, max(0,
  (total_actions / 100) +
  win_rate +
  conversion_rate +
  (tasks_completed * 2)
))
```

### 7.3. Критические Алерты

**Пороги:**
- Low Conversion: < 2%
- Low Lead Conversion: < 10%
- Low Activity: < 50 actions/month
- High Error Rate: > 5%

### 7.4. Агрегация Данных

- **Real-time:** Employee activity (при каждом действии)
- **Daily:** Conversion analytics (триггер при закрытии сделки)
- **Weekly:** Performance metrics (крон-джоб или manual refresh)
- **Monthly:** Executive reports (агрегация за период)

---

## 8. МАТРИЦА ДОСТУПА

| Роль | View Analytics | View Products | View Employees | View Executive | Manage Alerts |
|------|---------------|---------------|----------------|----------------|---------------|
| **Public** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Observer** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Accountant** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Engineer** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Salesperson** | ✅ (Own) | ✅ (Own) | ❌ | ❌ | ❌ |
| **Sales Manager** | ✅ | ✅ | ✅ (Team) | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Director** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 9. UI/UX ТРЕБОВАНИЯ

### 9.1. Design Tokens (index.css)

```css
:root {
  /* Analytics Colors */
  --analytics-success: 142 76% 36%;
  --analytics-warning: 38 92% 50%;
  --analytics-danger: 0 84% 60%;
  --analytics-info: 221 83% 53%;
  
  /* Chart Colors */
  --chart-1: 142 76% 36%;
  --chart-2: 221 83% 53%;
  --chart-3: 38 92% 50%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
  
  /* Metric Colors */
  --metric-positive: 142 76% 36%;
  --metric-negative: 0 84% 60%;
  --metric-neutral: 210 40% 96%;
  
  /* Status Colors */
  --status-active: 142 76% 36%;
  --status-warning: 38 92% 50%;
  --status-critical: 0 84% 60%;
}
```

### 9.2. Компоненты UI

**Метрические карточки:**
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium">
        {metric.title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{metric.value}</div>
    <p className="text-xs text-muted-foreground">
      {metric.change > 0 ? '+' : ''}{metric.change}% от прошлого периода
    </p>
  </CardContent>
</Card>
```

**Badges для статусов:**
- `success` → зеленый (conversion > 5%)
- `warning` → желтый (conversion 2-5%)
- `destructive` → красный (conversion < 2%)

**Графики (Recharts):**
- Area Chart для трендов
- Bar Chart для сравнений
- Pie Chart для распределений
- Line Chart для динамики

### 9.3. Адаптивность

- Desktop: 3-column grid для метрик
- Tablet: 2-column grid
- Mobile: 1-column stack

### 9.4. Состояния загрузки

```typescript
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {loading ? (
    Array(4).fill(0).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    ))
  ) : (
    // ... metric cards
  )}
</div>
```

### 9.5. Empty States

```typescript
<div className="text-center p-8">
  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
  <h3 className="text-lg font-medium mb-2">Нет данных</h3>
  <p className="text-muted-foreground">
    Данные аналитики будут доступны после первых действий
  </p>
</div>
```

---

## 10. ВАЛИДАЦИЯ И БЕЗОПАСНОСТЬ

### 10.1. Клиентская валидация

```typescript
import { z } from 'zod';

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "End date must be after start date" }
);
```

### 10.2. Серверная валидация

- RLS политики для каждой роли
- `SECURITY DEFINER` функции с проверкой `auth.uid()`
- Валидация входных параметров в SQL функциях

### 10.3. Защита от инъекций

- Параметризованные запросы через Supabase SDK
- JSONB для хранения динамических данных
- Экранирование HTML в выводе логов

### 10.4. Rate Limiting

- Ограничение частоты логирования (не более 100 действий/мин на пользователя)
- Дедупликация идентичных логов за короткий период

---

## 11. ПРОИЗВОДИТЕЛЬНОСТЬ

### 11.1. Индексирование

Все критичные поля индексированы (см. раздел 1).

### 11.2. Материализованные представления

```sql
CREATE MATERIALIZED VIEW analytics_summary AS
SELECT
  date_trunc('day', date) as day,
  COUNT(DISTINCT product_id) as products_count,
  SUM(views_count) as total_views,
  SUM(conversions_count) as total_conversions,
  AVG(conversion_rate) as avg_conversion_rate,
  SUM(revenue) as total_revenue
FROM conversion_analytics
GROUP BY day
ORDER BY day DESC;

CREATE UNIQUE INDEX ON analytics_summary (day);

-- Обновление каждые 15 минут
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary;
END;
$$;
```

### 11.3. React Query кэширование

```typescript
import { useQuery } from '@tanstack/react-query';

export const useConversionAnalyticsQuery = (filters: AnalyticsFilters) => {
  const { getConversionAnalytics } = useAnalytics();
  
  return useQuery({
    queryKey: ['conversion-analytics', filters],
    queryFn: () => getConversionAnalytics(
      filters.startDate,
      filters.endDate,
      filters.productId
    ),
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  });
};
```

### 11.4. Debouncing

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setSearchTerm(value);
  },
  300
);
```

---

## 12. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ

### 12.1. Export Analytics to CSV

```typescript
export const exportAnalyticsToCSV = (data: ConversionAnalytics[]) => {
  const headers = [
    'Дата',
    'ID Продукта',
    'Просмотры',
    'Запросы',
    'Конверсии',
    'Конверсия %',
    'Выручка'
  ];
  
  const rows = data.map(row => [
    row.date,
    row.product_id,
    row.views_count,
    row.quote_requests_count,
    row.conversions_count,
    row.conversion_rate.toFixed(2),
    row.revenue.toFixed(2)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

### 12.2. Real-time Updates

```typescript
useEffect(() => {
  const channel = supabase
    .channel('analytics-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversion_analytics'
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['conversion-analytics'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 12.3. Schedule Reports

```typescript
// Edge Function для отправки еженедельных отчетов
export const scheduleWeeklyReport = async (userId: string, email: string) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const metrics = await calculateEmployeePerformance(
    userId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
  
  // Send email with metrics
  await sendEmail({
    to: email,
    subject: 'Еженедельный отчет производительности',
    html: generateReportHTML(metrics)
  });
};
```

---

## 13. ТЕСТИРОВАНИЕ

### 13.1. Unit Tests

```typescript
describe('useAnalytics', () => {
  it('should fetch conversion analytics', async () => {
    const { result } = renderHook(() => useAnalytics());
    
    const data = await result.current.getConversionAnalytics();
    
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });
  
  it('should calculate productivity score correctly', () => {
    const metrics = {
      total_actions: 500,
      win_rate: 25,
      conversion_rate: 15,
      tasks_completed: 10
    };
    
    const score = calculateProductivityScore(metrics);
    
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

### 13.2. E2E Tests

```typescript
test('Director can view executive overview', async ({ page }) => {
  await page.goto('/admin/analytics');
  
  // Check for Executive tab
  await expect(page.getByRole('tab', { name: /executive/i })).toBeVisible();
  
  // Click Executive tab
  await page.getByRole('tab', { name: /executive/i }).click();
  
  // Check for KPI cards
  await expect(page.getByText(/Общая выручка/i)).toBeVisible();
  await expect(page.getByText(/Средняя конверсия/i)).toBeVisible();
});
```

---

## 14. КРАТКИЙ ПРОМПТ ДЛЯ AI

```
Создай систему аналитики для CRM с:

DATABASE:
- conversion_analytics: product_id, date, views, requests, conversions, rate, revenue
- employee_activity: user_id, action_type, entity_type/id, details JSONB, date
- employee_performance_metrics: агрегированные метрики за период
- system_logs: level, category, message, details, user_id
- system_alerts: alert_type, severity, status, title

RLS:
- Sales managers видят conversion_analytics
- Managers видят team employee_activity
- Directors видят всё + executive overview
- Admins управляют alerts

ФУНКЦИИ:
- log_employee_activity(action, entity, details)
- update_conversion_analytics(product_id, date)
- calculate_employee_performance(user_id, start, end) → метрики
- log_system_event(level, category, message)
- get_top_products_by_conversion(limit)

КОМПОНЕНТЫ:
- Analytics.tsx: табы Executive/Products/Employees с проверкой прав
- ProductAnalyticsDashboard: топ товары, графики, метрики
- EmployeeActivityDashboard: активность, производительность
- ExecutiveOverview: KPI, alerts, рекомендации

HOOKS:
- useAnalytics: CRUD для всех таблиц
- useSystemLogger: logError/Warning/Info/Performance
- useActivityLogger: авто-лог входа

UI: 
- Recharts графики, metric cards, badges по порогам
- Date range filters, real-time updates
- HSL semantic tokens, responsive grid

БЕЗОПАСНОСТЬ:
- RLS на всех таблицах
- SECURITY DEFINER с auth.uid() проверкой
- Параметризованные запросы
```

---

## 15. ПРИМЕР ДАННЫХ

### conversion_analytics
```json
{
  "id": "uuid",
  "product_id": "uuid",
  "date": "2024-01-15",
  "views_count": 150,
  "quote_requests_count": 25,
  "conversions_count": 5,
  "conversion_rate": 3.33,
  "revenue": 15000.00
}
```

### employee_activity
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "action_type": "create",
  "entity_type": "deal",
  "entity_id": "uuid",
  "details": {
    "deal_title": "New Equipment Sale",
    "amount": 5000
  },
  "date": "2024-01-15",
  "session_duration": 3600
}
```

### employee_performance_metrics
```json
{
  "user_id": "uuid",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "total_actions": 450,
  "leads_created": 20,
  "leads_converted": 8,
  "deals_won": 6,
  "total_revenue": 30000,
  "win_rate": 75.00,
  "conversion_rate": 40.00,
  "productivity_score": 85
}
```

---

**Конец документа**

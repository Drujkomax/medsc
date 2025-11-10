# СИСТЕМА ДАШБОРДА - ПОЛНЫЙ ТЕХНИЧЕСКИЙ ПРОМПТ

## ОБЗОР СИСТЕМЫ

Система дашборда представляет собой ролевую панель управления с динамическим отображением метрик, аналитики и мониторинга в зависимости от роли пользователя. Включает интерактивные виджеты, графики, алерты и системный мониторинг.

---

## 1. СТРУКТУРА БАЗЫ ДАННЫХ

### 1.1 Таблицы для Дашборда

Дашборд **не создает отдельные таблицы**, а агрегирует данные из существующих:

```sql
-- Используемые таблицы:
-- leads (лиды и их статусы)
-- deals (сделки и суммы)
-- tasks (задачи)
-- products (товары и конверсии)
-- services (услуги)
-- employee_activity (активность сотрудников)
-- conversion_analytics (аналитика конверсий)
-- system_logs (системные логи)
-- system_alerts (системные алерты)
-- profiles (профили пользователей)
-- user_roles (роли пользователей)
```

### 1.2 Материализованные представления (для производительности)

```sql
-- Материализованное представление для быстрого доступа к метрикам дашборда
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT
  -- Метрики по лидам
  (SELECT COUNT(*) FROM leads WHERE archived = false) as total_leads,
  (SELECT COUNT(*) FROM leads WHERE stage = 'new' AND archived = false) as new_leads,
  (SELECT COUNT(*) FROM leads WHERE stage = 'qualified' AND archived = false) as qualified_leads,
  (SELECT COUNT(*) FROM leads WHERE stage = 'closed' AND archived = false) as closed_leads,
  (SELECT COUNT(*) FROM leads WHERE stage = 'lost' AND archived = false) as lost_leads,
  
  -- Метрики по сделкам
  (SELECT COUNT(*) FROM deals WHERE stage != 'lost') as active_deals,
  (SELECT COUNT(*) FROM deals WHERE stage = 'closed') as closed_deals,
  (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE stage = 'closed') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM deals WHERE stage != 'lost' AND stage != 'closed') as pipeline_value,
  
  -- Метрики по задачам
  (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as in_progress_tasks,
  (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM tasks WHERE due_date < NOW() AND status != 'completed') as overdue_tasks,
  
  -- Метрики по продуктам
  (SELECT COUNT(*) FROM products WHERE archived = false) as total_products,
  (SELECT COUNT(*) FROM products WHERE in_stock = false AND archived = false) as out_of_stock_products,
  
  -- Системные метрики
  (SELECT COUNT(*) FROM system_alerts WHERE status = 'active') as active_alerts,
  (SELECT COUNT(*) FROM system_logs WHERE level = 'error' AND created_at > NOW() - INTERVAL '24 hours') as errors_24h,
  
  -- Временная метка обновления
  NOW() as last_updated;

-- Индекс для быстрого чтения
CREATE UNIQUE INDEX idx_dashboard_summary ON dashboard_summary (last_updated);

-- Функция для обновления материализованного представления
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
END;
$$;
```

### 1.3 Функции для получения метрик дашборда

```sql
-- Получение персональных метрик продавца
CREATE OR REPLACE FUNCTION get_salesperson_metrics(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_leads BIGINT,
  new_leads BIGINT,
  qualified_leads BIGINT,
  closed_leads BIGINT,
  conversion_rate NUMERIC,
  total_deals BIGINT,
  active_deals BIGINT,
  closed_deals BIGINT,
  total_revenue NUMERIC,
  avg_deal_size NUMERIC,
  pending_tasks BIGINT,
  completed_tasks BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH lead_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE stage != 'lost') as total,
      COUNT(*) FILTER (WHERE stage = 'new') as new,
      COUNT(*) FILTER (WHERE stage = 'qualified') as qualified,
      COUNT(*) FILTER (WHERE stage = 'closed') as closed
    FROM leads
    WHERE assigned_to = p_user_id
      AND archived = false
      AND created_at::date BETWEEN v_start_date AND v_end_date
  ),
  deal_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE stage != 'lost' AND stage != 'closed') as active,
      COUNT(*) FILTER (WHERE stage = 'closed') as closed,
      COALESCE(SUM(amount) FILTER (WHERE stage = 'closed'), 0) as revenue,
      COALESCE(AVG(amount) FILTER (WHERE stage = 'closed'), 0) as avg_size
    FROM deals
    WHERE assigned_salesperson = p_user_id
      AND created_at::date BETWEEN v_start_date AND v_end_date
  ),
  task_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM tasks
    WHERE assignee_id = p_user_id
      AND created_at::date BETWEEN v_start_date AND v_end_date
  )
  SELECT
    ls.total,
    ls.new,
    ls.qualified,
    ls.closed,
    CASE WHEN ls.total > 0 THEN ROUND((ls.closed::numeric / ls.total::numeric) * 100, 2) ELSE 0 END,
    ds.total,
    ds.active,
    ds.closed,
    ds.revenue,
    ds.avg_size,
    ts.pending,
    ts.completed
  FROM lead_stats ls, deal_stats ds, task_stats ts;
END;
$$;

-- Получение метрик команды для менеджера
CREATE OR REPLACE FUNCTION get_team_metrics(
  p_manager_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  team_members BIGINT,
  total_leads BIGINT,
  team_conversion_rate NUMERIC,
  total_deals BIGINT,
  total_revenue NUMERIC,
  avg_revenue_per_member NUMERIC,
  top_performer JSON,
  bottom_performer JSON
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  WITH team_members AS (
    SELECT ur.user_id, p.full_name
    FROM user_roles ur
    JOIN profiles p ON p.id = ur.user_id
    WHERE ur.role = 'salesperson'
  ),
  team_lead_stats AS (
    SELECT
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE stage = 'closed') as closed_leads
    FROM leads l
    JOIN team_members tm ON tm.user_id = l.assigned_to
    WHERE l.archived = false
      AND l.created_at::date BETWEEN v_start_date AND v_end_date
  ),
  team_deal_stats AS (
    SELECT
      COUNT(*) as total_deals,
      COALESCE(SUM(amount), 0) as total_revenue
    FROM deals d
    JOIN team_members tm ON tm.user_id = d.assigned_salesperson
    WHERE d.stage = 'closed'
      AND d.created_at::date BETWEEN v_start_date AND v_end_date
  ),
  member_performance AS (
    SELECT
      tm.user_id,
      tm.full_name,
      COALESCE(SUM(d.amount), 0) as revenue
    FROM team_members tm
    LEFT JOIN deals d ON d.assigned_salesperson = tm.user_id
      AND d.stage = 'closed'
      AND d.created_at::date BETWEEN v_start_date AND v_end_date
    GROUP BY tm.user_id, tm.full_name
  ),
  top_perf AS (
    SELECT json_build_object('name', full_name, 'revenue', revenue) as performer
    FROM member_performance
    ORDER BY revenue DESC
    LIMIT 1
  ),
  bottom_perf AS (
    SELECT json_build_object('name', full_name, 'revenue', revenue) as performer
    FROM member_performance
    ORDER BY revenue ASC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*) FROM team_members)::BIGINT,
    tls.total_leads,
    CASE WHEN tls.total_leads > 0 
      THEN ROUND((tls.closed_leads::numeric / tls.total_leads::numeric) * 100, 2) 
      ELSE 0 
    END,
    tds.total_deals,
    tds.total_revenue,
    CASE WHEN (SELECT COUNT(*) FROM team_members) > 0 
      THEN ROUND(tds.total_revenue / (SELECT COUNT(*) FROM team_members), 2)
      ELSE 0 
    END,
    (SELECT performer FROM top_perf),
    (SELECT performer FROM bottom_perf)
  FROM team_lead_stats tls, team_deal_stats tds;
END;
$$;

-- Получение executive метрик для директора
CREATE OR REPLACE FUNCTION get_executive_metrics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_revenue NUMERIC,
  revenue_growth NUMERIC,
  total_leads BIGINT,
  conversion_rate NUMERIC,
  avg_deal_size NUMERIC,
  active_deals BIGINT,
  pipeline_value NUMERIC,
  team_size BIGINT,
  avg_revenue_per_employee NUMERIC,
  top_product JSON,
  critical_alerts BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_prev_start_date DATE := v_start_date - (v_end_date - v_start_date);
  v_prev_end_date DATE := v_start_date - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT
      COALESCE(SUM(d.amount), 0) as revenue,
      COUNT(DISTINCT l.id) as leads,
      COUNT(DISTINCT l.id) FILTER (WHERE l.stage = 'closed') as closed_leads,
      COUNT(DISTINCT d.id) FILTER (WHERE d.stage = 'closed') as closed_deals,
      COALESCE(AVG(d.amount) FILTER (WHERE d.stage = 'closed'), 0) as avg_deal,
      COUNT(DISTINCT d.id) FILTER (WHERE d.stage NOT IN ('closed', 'lost')) as active,
      COALESCE(SUM(d.amount) FILTER (WHERE d.stage NOT IN ('closed', 'lost')), 0) as pipeline
    FROM deals d
    FULL OUTER JOIN leads l ON l.id = d.lead_id
    WHERE d.created_at::date BETWEEN v_start_date AND v_end_date
       OR l.created_at::date BETWEEN v_start_date AND v_end_date
  ),
  previous_period AS (
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM deals
    WHERE stage = 'closed'
      AND created_at::date BETWEEN v_prev_start_date AND v_prev_end_date
  ),
  team_stats AS (
    SELECT COUNT(*) as size
    FROM user_roles
    WHERE role IN ('salesperson', 'sales_manager')
  ),
  top_prod AS (
    SELECT json_build_object(
      'name', p.name->>'en',
      'revenue', COALESCE(SUM(dp.total_price), 0)
    ) as product
    FROM products p
    LEFT JOIN deal_products dp ON dp.product_id = p.id
    LEFT JOIN deals d ON d.id = dp.deal_id AND d.stage = 'closed'
    WHERE d.created_at::date BETWEEN v_start_date AND v_end_date
    GROUP BY p.id, p.name
    ORDER BY COALESCE(SUM(dp.total_price), 0) DESC
    LIMIT 1
  ),
  alerts AS (
    SELECT COUNT(*) as critical
    FROM system_alerts
    WHERE status = 'active' AND severity IN ('high', 'critical')
  )
  SELECT
    cp.revenue,
    CASE WHEN pp.revenue > 0 
      THEN ROUND(((cp.revenue - pp.revenue) / pp.revenue) * 100, 2)
      ELSE 100
    END,
    cp.leads,
    CASE WHEN cp.leads > 0 
      THEN ROUND((cp.closed_leads::numeric / cp.leads::numeric) * 100, 2)
      ELSE 0
    END,
    cp.avg_deal,
    cp.active,
    cp.pipeline,
    ts.size,
    CASE WHEN ts.size > 0 
      THEN ROUND(cp.revenue / ts.size, 2)
      ELSE 0
    END,
    (SELECT product FROM top_prod),
    a.critical
  FROM current_period cp, previous_period pp, team_stats ts, alerts a;
END;
$$;

-- Получение метрик активности по времени (для графиков)
CREATE OR REPLACE FUNCTION get_activity_timeline(
  p_user_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  date DATE,
  leads_created BIGINT,
  deals_created BIGINT,
  tasks_completed BIGINT,
  revenue NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (p_days || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as date
  )
  SELECT
    ds.date,
    COALESCE(COUNT(DISTINCT l.id), 0)::BIGINT as leads_created,
    COALESCE(COUNT(DISTINCT d.id), 0)::BIGINT as deals_created,
    COALESCE(COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed'), 0)::BIGINT as tasks_completed,
    COALESCE(SUM(d.amount) FILTER (WHERE d.stage = 'closed'), 0) as revenue
  FROM date_series ds
  LEFT JOIN leads l ON l.created_at::date = ds.date
    AND (p_user_id IS NULL OR l.assigned_to = p_user_id)
  LEFT JOIN deals d ON d.created_at::date = ds.date
    AND (p_user_id IS NULL OR d.assigned_salesperson = p_user_id)
  LEFT JOIN tasks t ON t.created_at::date = ds.date
    AND (p_user_id IS NULL OR t.assignee_id = p_user_id)
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$;
```

---

## 2. RLS ПОЛИТИКИ

```sql
-- Политики для материализованного представления
ALTER MATERIALIZED VIEW dashboard_summary OWNER TO authenticated;

CREATE POLICY "Managers can view dashboard summary"
  ON dashboard_summary
  FOR SELECT
  TO authenticated
  USING (has_role_level(auth.uid(), 'sales_manager'));

-- Примечание: Основные политики уже существуют на базовых таблицах
-- (leads, deals, tasks, employee_activity и т.д.)
-- Дашборд использует эти существующие политики
```

---

## 3. TYPESCRIPT ТИПЫ

```typescript
// src/types/dashboard.ts

export type DashboardRole = 
  | 'admin' 
  | 'director' 
  | 'sales_manager' 
  | 'salesperson' 
  | 'accountant'
  | 'engineer'
  | 'observer';

export interface DashboardMetric {
  label: string;
  value: number | string;
  change?: number; // % изменение
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType;
  color?: string;
}

export interface SalespersonMetrics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  closedLeads: number;
  conversionRate: number;
  totalDeals: number;
  activeDeals: number;
  closedDeals: number;
  totalRevenue: number;
  avgDealSize: number;
  pendingTasks: number;
  completedTasks: number;
}

export interface TeamMetrics {
  teamMembers: number;
  totalLeads: number;
  teamConversionRate: number;
  totalDeals: number;
  totalRevenue: number;
  avgRevenuePerMember: number;
  topPerformer: {
    name: string;
    revenue: number;
  };
  bottomPerformer: {
    name: string;
    revenue: number;
  };
}

export interface ExecutiveMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalLeads: number;
  conversionRate: number;
  avgDealSize: number;
  activeDeals: number;
  pipelineValue: number;
  teamSize: number;
  avgRevenuePerEmployee: number;
  topProduct: {
    name: string;
    revenue: number;
  };
  criticalAlerts: number;
}

export interface ActivityDataPoint {
  date: string;
  leadsCreated: number;
  dealsCreated: number;
  tasksCompleted: number;
  revenue: number;
}

export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  closedLeads: number;
  lostLeads: number;
  activeDeals: number;
  closedDeals: number;
  totalRevenue: number;
  pipelineValue: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalProducts: number;
  outOfStockProducts: number;
  activeAlerts: number;
  errors24h: number;
  lastUpdated: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  href: string;
  color?: string;
  permission?: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  size: 'small' | 'medium' | 'large' | 'full';
  minRole?: DashboardRole;
  permission?: string;
}
```

---

## 4. REACT ХУКИ

### 4.1 useDashboard

```typescript
// src/hooks/useDashboard.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  DashboardSummary, 
  SalespersonMetrics, 
  TeamMetrics, 
  ExecutiveMetrics,
  ActivityDataPoint 
} from '@/types/dashboard';

export const useDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение общей сводки дашборда
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async (): Promise<DashboardSummary | null> => {
      const { data, error } = await supabase
        .from('dashboard_summary')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as DashboardSummary;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 5 * 60 * 1000, // Автообновление каждые 5 минут
  });

  // Получение метрик продавца
  const getSalespersonMetrics = async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<SalespersonMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_salesperson_metrics', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: err.message || 'Не удалось загрузить метрики',
      });
      return null;
    }
  };

  // Получение метрик команды
  const getTeamMetrics = async (
    managerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TeamMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_team_metrics', {
        p_manager_id: managerId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: err.message || 'Не удалось загрузить метрики команды',
      });
      return null;
    }
  };

  // Получение executive метрик
  const getExecutiveMetrics = async (
    startDate?: string,
    endDate?: string
  ): Promise<ExecutiveMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_executive_metrics', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: err.message || 'Не удалось загрузить executive метрики',
      });
      return null;
    }
  };

  // Получение timeline активности
  const getActivityTimeline = async (
    userId?: string,
    days: number = 30
  ): Promise<ActivityDataPoint[]> => {
    try {
      const { data, error } = await supabase.rpc('get_activity_timeline', {
        p_user_id: userId,
        p_days: days,
      });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: err.message || 'Не удалось загрузить timeline',
      });
      return [];
    }
  };

  // Обновление материализованного представления
  const refreshDashboard = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_dashboard_summary');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast({
        title: 'Обновлено',
        description: 'Данные дашборда обновлены',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: err.message || 'Не удалось обновить дашборд',
      });
    },
  });

  return {
    summary,
    summaryLoading,
    getSalespersonMetrics,
    getTeamMetrics,
    getExecutiveMetrics,
    getActivityTimeline,
    refreshDashboard: refreshDashboard.mutate,
    isRefreshing: refreshDashboard.isPending,
  };
};
```

### 4.2 useDashboardRealtime

```typescript
// src/hooks/useDashboardRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardRealtime = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Подписка на изменения в leads
    const leadsSubscription = supabase
      .channel('dashboard-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: userId ? `assigned_to=eq.${userId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        }
      )
      .subscribe();

    // Подписка на изменения в deals
    const dealsSubscription = supabase
      .channel('dashboard-deals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: userId ? `assigned_salesperson=eq.${userId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        }
      )
      .subscribe();

    // Подписка на изменения в tasks
    const tasksSubscription = supabase
      .channel('dashboard-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: userId ? `assignee_id=eq.${userId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        }
      )
      .subscribe();

    // Подписка на системные алерты
    const alertsSubscription = supabase
      .channel('dashboard-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_alerts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        }
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      dealsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    };
  }, [userId, queryClient]);
};
```

---

## 5. КЛЮЧЕВЫЕ КОМПОНЕНТЫ

### 5.1 Dashboard.tsx (Главная страница)

```typescript
// src/features/admin/pages/Dashboard.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import RoleBasedDashboard from '../components/Dashboard/RoleBasedDashboard';
import MonitoringDashboard from '@/components/admin/MonitoringDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';

const Dashboard = () => {
  const { hasPermission } = useUserPermissions();
  const { refreshDashboard, isRefreshing } = useDashboard();
  
  const canViewMonitoring = hasPermission('view_analytics');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Дашборд</h1>
        {canViewMonitoring && (
          <Button 
            onClick={() => refreshDashboard()} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        )}
      </div>

      {canViewMonitoring ? (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Основная панель</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг системы</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <RoleBasedDashboard />
          </TabsContent>
          
          <TabsContent value="monitoring">
            <MonitoringDashboard />
          </TabsContent>
        </Tabs>
      ) : (
        <RoleBasedDashboard />
      )}
    </div>
  );
};

export default Dashboard;
```

### 5.2 RoleBasedDashboard.tsx

```typescript
// src/features/admin/components/Dashboard/RoleBasedDashboard.tsx
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import SalespersonDashboard from './SalespersonDashboard';
import SalesManagerDashboard from './SalesManagerDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';
import AdminDashboard from './AdminDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const RoleBasedDashboard = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { summary, summaryLoading } = useDashboard();
  
  // Real-time updates
  useDashboardRealtime(user?.id);

  if (roleLoading || summaryLoading) {
    return <DashboardSkeleton />;
  }

  switch (role) {
    case 'director':
    case 'admin':
      return <ExecutiveDashboard summary={summary} />;
    
    case 'sales_manager':
      return <SalesManagerDashboard userId={user?.id} summary={summary} />;
    
    case 'salesperson':
      return <SalespersonDashboard userId={user?.id} summary={summary} />;
    
    case 'accountant':
    case 'engineer':
      return <AdminDashboard summary={summary} />;
    
    default:
      return <div>У вас нет доступа к дашборду</div>;
  }
};

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <Skeleton key={i} className="h-32" />
    ))}
  </div>
);

export default RoleBasedDashboard;
```

### 5.3 MetricCard.tsx (Переиспользуемый компонент)

```typescript
// src/features/admin/components/Dashboard/MetricCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { DashboardMetric } from '@/types/dashboard';

interface MetricCardProps {
  metric: DashboardMetric;
}

export const MetricCard = ({ metric }: MetricCardProps) => {
  const { label, value, change, trend, icon: Icon, color } = metric;

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp className="h-4 w-4 text-success" />;
    if (trend === 'down') return <ArrowDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && (
          <Icon 
            className="h-4 w-4" 
            style={{ color: color || 'hsl(var(--primary))' }} 
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon()}
            <span>{change > 0 ? '+' : ''}{change}% с предыдущего периода</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 5.4 ActivityChart.tsx

```typescript
// src/features/admin/components/Dashboard/ActivityChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import type { ActivityDataPoint } from '@/types/dashboard';

interface ActivityChartProps {
  data: ActivityDataPoint[];
  title: string;
}

export const ActivityChart = ({ data, title }: ActivityChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="leadsCreated" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1} 
              fill="url(#colorLeads)" 
              name="Лиды"
            />
            <Area 
              type="monotone" 
              dataKey="dealsCreated" 
              stroke="hsl(var(--success))" 
              fillOpacity={1} 
              fill="url(#colorDeals)"
              name="Сделки"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

---

## 6. РОЛИ И МАТРИЦА ДОСТУПА

### Уровни доступа к дашборду:

| Роль | Основной дашборд | Мониторинг | Executive метрики | Team метрики | Personal метрики |
|------|------------------|------------|-------------------|--------------|------------------|
| **Public** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Observer** | ✅ (read-only) | ❌ | ❌ | ❌ | ❌ |
| **Engineer** | ✅ (tasks only) | ❌ | ❌ | ❌ | ✅ (tasks) |
| **Accountant** | ✅ (deals only) | ❌ | ❌ | ❌ | ✅ (deals) |
| **Salesperson** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Sales Manager** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Director** | ✅ | ✅ | ✅ | ✅ | ✅ |

### Виджеты по ролям:

**Salesperson:**
- Мои лиды (статусы, конверсия)
- Мои сделки (активные, закрытые, сумма)
- Мои задачи (просроченные, в работе)
- График активности (последние 30 дней)
- Быстрые действия (создать лид, создать сделку)

**Sales Manager:**
- Все виджеты Salesperson +
- Метрики команды (размер, конверсия, общая выручка)
- Топ/худший исполнитель
- Распределение лидов по команде
- Pipeline команды
- Быстрые действия (назначить задачу, просмотреть команду)

**Director/Admin:**
- Executive метрики (общая выручка, рост, pipeline)
- Системные алерты
- Конверсия по продуктам
- График выручки по месяцам
- Производительность сотрудников
- Критические метрики (ошибки, просроченные задачи)
- Быстрые действия (аналитика, управление пользователями, настройки)

---

## 7. БИЗНЕС-ЛОГИКА

### 7.1 Расчет метрик

**Conversion Rate (Коэффициент конверсии):**
```
conversion_rate = (closed_leads / total_leads) * 100
```

**Revenue Growth (Рост выручки):**
```
revenue_growth = ((current_period_revenue - previous_period_revenue) / previous_period_revenue) * 100
```

**Average Deal Size (Средний размер сделки):**
```
avg_deal_size = total_revenue / closed_deals_count
```

**Pipeline Value (Стоимость pipeline):**
```
pipeline_value = SUM(amount) WHERE stage NOT IN ('closed', 'lost')
```

**Team Productivity Score:**
```
productivity_score = (
  (closed_deals * 10) +
  (qualified_leads * 5) +
  (completed_tasks * 2)
) / team_size
```

### 7.2 Цветовая индикация метрик

```typescript
// Правила для тренда метрик
const getMetricTrend = (change: number, metricType: string): 'up' | 'down' | 'neutral' => {
  if (Math.abs(change) < 5) return 'neutral'; // ±5% считается нейтральным
  
  // Для выручки, конверсии, сделок - рост позитивен
  if (['revenue', 'conversion', 'deals'].includes(metricType)) {
    return change > 0 ? 'up' : 'down';
  }
  
  // Для ошибок, алертов - рост негативен
  if (['errors', 'alerts', 'overdue'].includes(metricType)) {
    return change > 0 ? 'down' : 'up';
  }
  
  return 'neutral';
};
```

### 7.3 Обновление данных

- **Real-time обновления:** Подписки Supabase на изменения в leads, deals, tasks
- **Материализованное представление:** Обновляется раз в 5 минут автоматически или по запросу
- **Кеширование:** React Query с staleTime 5 минут
- **Ручное обновление:** Кнопка "Обновить" для принудительного рефетча

---

## 8. UI/UX ТРЕБОВАНИЯ

### 8.1 Цветовая схема (HSL - semantic tokens)

```css
/* index.css - Dashboard colors */
:root {
  /* Метрики */
  --metric-positive: 142 76% 36%; /* зеленый для роста */
  --metric-negative: 0 84% 60%; /* красный для падения */
  --metric-neutral: 45 93% 47%; /* желтый для нейтрального */
  
  /* Тренды */
  --trend-up: var(--success);
  --trend-down: var(--destructive);
  --trend-neutral: var(--muted-foreground);
  
  /* Виджеты */
  --widget-bg: var(--card);
  --widget-border: var(--border);
  --widget-hover: var(--accent);
  
  /* Графики */
  --chart-primary: var(--primary);
  --chart-secondary: var(--secondary);
  --chart-success: var(--success);
  --chart-warning: var(--warning);
  --chart-danger: var(--destructive);
}
```

### 8.2 Адаптивная сетка

```typescript
// Responsive grid layout
const gridLayouts = {
  desktop: 'grid-cols-4', // 4 колонки на больших экранах
  tablet: 'md:grid-cols-2', // 2 колонки на планшетах
  mobile: 'grid-cols-1', // 1 колонка на мобильных
};

// Размеры виджетов
const widgetSizes = {
  small: 'col-span-1', // 1/4 ширины
  medium: 'col-span-2', // 1/2 ширины
  large: 'col-span-3', // 3/4 ширины
  full: 'col-span-4', // Полная ширина
};
```

### 8.3 Состояния загрузки

- **Skeleton screens** для начальной загрузки
- **Shimmer effect** для метрик
- **Spinner** для обновления данных
- **Progressive loading** - сначала загружаются ключевые метрики, затем графики

### 8.4 Пустые состояния

```typescript
const EmptyDashboard = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">Нет данных для отображения</h3>
    <p className="text-muted-foreground mb-4">
      Начните работу, создав первый лид или сделку
    </p>
    <Button>Создать лид</Button>
  </div>
);
```

---

## 9. БЕЗОПАСНОСТЬ

### 9.1 RLS на уровне БД

```sql
-- Все функции используют SECURITY DEFINER
-- Проверки роли внутри функций через has_role() и has_role_level()
-- Материализованное представление доступно только для менеджеров+
```

### 9.2 Валидация на клиенте

```typescript
// Проверка прав доступа перед рендером
const { hasPermission } = useUserPermissions();

if (!hasPermission('view_dashboard')) {
  return <AccessDenied />;
}
```

### 9.3 Защита от SQL Injection

- Все запросы через Supabase RPC
- Параметризованные запросы
- Типизация через TypeScript

### 9.4 Rate Limiting

```typescript
// Ограничение частоты обновления дашборда
const REFRESH_COOLDOWN = 60000; // 1 минута

const canRefresh = useCallback(() => {
  const lastRefresh = localStorage.getItem('dashboard_last_refresh');
  if (!lastRefresh) return true;
  
  const timeSinceRefresh = Date.now() - parseInt(lastRefresh);
  return timeSinceRefresh > REFRESH_COOLDOWN;
}, []);
```

---

## 10. ПРОИЗВОДИТЕЛЬНОСТЬ

### 10.1 Оптимизация запросов

- **Индексы на таблицах:** created_at, assigned_to, stage, status
- **Материализованное представление:** Предварительный расчет агрегатов
- **Лимиты на выборку:** Только необходимые данные за период

### 10.2 Кеширование

```typescript
// React Query конфигурация
const queryConfig = {
  staleTime: 5 * 60 * 1000, // 5 минут
  cacheTime: 10 * 60 * 1000, // 10 минут
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};
```

### 10.3 Lazy Loading компонентов

```typescript
// Динамический импорт тяжелых компонентов
const ExecutiveDashboard = lazy(() => import('./ExecutiveDashboard'));
const MonitoringDashboard = lazy(() => import('./MonitoringDashboard'));

// Suspense boundary
<Suspense fallback={<DashboardSkeleton />}>
  <ExecutiveDashboard />
</Suspense>
```

### 10.4 Debouncing для фильтров

```typescript
// Задержка обновления при изменении фильтров
const debouncedFilters = useDebouncedValue(filters, 500);
```

---

## 11. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ

### 11.1 Экспорт данных

```typescript
const exportDashboardData = async (format: 'csv' | 'json' | 'pdf') => {
  const data = await getDashboardData();
  
  if (format === 'csv') {
    return convertToCSV(data);
  } else if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else {
    return generatePDF(data);
  }
};
```

### 11.2 Кастомизация виджетов

```typescript
// Пользователь может выбирать видимость виджетов
interface UserDashboardPreferences {
  userId: string;
  visibleWidgets: string[];
  widgetOrder: string[];
  defaultPeriod: '7d' | '30d' | '90d' | '1y';
}
```

### 11.3 Уведомления

```typescript
// Уведомления о критических изменениях
const checkCriticalMetrics = (metrics: ExecutiveMetrics) => {
  if (metrics.criticalAlerts > 5) {
    toast({
      variant: 'destructive',
      title: 'Критические алерты',
      description: `У вас ${metrics.criticalAlerts} активных критических алертов!`,
    });
  }
  
  if (metrics.conversionRate < 2) {
    toast({
      variant: 'warning',
      title: 'Низкая конверсия',
      description: 'Коэффициент конверсии упал ниже 2%',
    });
  }
};
```

---

## 12. ТЕСТИРОВАНИЕ

### 12.1 Unit тесты

```typescript
// Тестирование расчета метрик
describe('Dashboard Metrics Calculation', () => {
  it('should calculate conversion rate correctly', () => {
    const metrics = {
      totalLeads: 100,
      closedLeads: 25,
    };
    
    const conversionRate = (metrics.closedLeads / metrics.totalLeads) * 100;
    expect(conversionRate).toBe(25);
  });
  
  it('should handle zero division', () => {
    const metrics = {
      totalLeads: 0,
      closedLeads: 0,
    };
    
    const conversionRate = metrics.totalLeads > 0 
      ? (metrics.closedLeads / metrics.totalLeads) * 100 
      : 0;
    expect(conversionRate).toBe(0);
  });
});
```

### 12.2 Integration тесты

```typescript
// Тестирование загрузки данных
describe('Dashboard Data Loading', () => {
  it('should load salesperson metrics', async () => {
    const { result, waitFor } = renderHook(() => useDashboard());
    
    await waitFor(() => {
      expect(result.current.summaryLoading).toBe(false);
    });
    
    expect(result.current.summary).toBeDefined();
  });
});
```

### 12.3 E2E тесты

```typescript
// Тестирование доступа по ролям
describe('Dashboard Access Control', () => {
  it('should show executive dashboard for directors', async () => {
    await loginAs('director');
    await page.goto('/admin/dashboard');
    
    await expect(page.getByText('Executive метрики')).toBeVisible();
    await expect(page.getByText('Мониторинг системы')).toBeVisible();
  });
  
  it('should show personal dashboard for salespeople', async () => {
    await loginAs('salesperson');
    await page.goto('/admin/dashboard');
    
    await expect(page.getByText('Мои лиды')).toBeVisible();
    await expect(page.getByText('Мониторинг системы')).not.toBeVisible();
  });
});
```

---

## 13. КРАТКИЙ ПРОМПТ ДЛЯ AI

```
Создай систему дашборда для CRM с ролевым доступом:

БД:
- Материализованное представление dashboard_summary для быстрых метрик
- Функции: get_salesperson_metrics, get_team_metrics, get_executive_metrics, get_activity_timeline
- RLS: роли определяют доступ к метрикам

Роли и виджеты:
- Salesperson: личные лиды, сделки, задачи, график активности
- Sales Manager: + метрики команды, топ исполнители, pipeline команды
- Director/Admin: + executive метрики, системные алерты, конверсия продуктов, графики выручки

Компоненты:
- Dashboard.tsx с табами (основная панель, мониторинг)
- RoleBasedDashboard.tsx - роутинг по ролям
- MetricCard.tsx - карточки с метриками (значение, изменение, тренд)
- ActivityChart.tsx - графики Recharts (Area, Bar)
- Real-time обновления через Supabase channels

Хуки:
- useDashboard: summary, getSalespersonMetrics, getTeamMetrics, getExecutiveMetrics, getActivityTimeline, refreshDashboard
- useDashboardRealtime: подписки на leads, deals, tasks, alerts

Метрики:
- Conversion rate = (closed_leads / total_leads) * 100
- Revenue growth = ((current - previous) / previous) * 100
- Pipeline value = SUM(amount WHERE stage NOT IN ('closed', 'lost'))

UI/UX:
- HSL semantic tokens для цветов (--metric-positive, --trend-up, --chart-primary)
- Адаптивная сетка: desktop 4 колонки, tablet 2, mobile 1
- Skeleton screens при загрузке
- Пустые состояния с призывом к действию
- Кнопка "Обновить" с индикацией загрузки

Производительность:
- React Query кеширование (staleTime 5 мин)
- Материализованное представление обновляется каждые 5 мин
- Lazy loading тяжелых компонентов
- Debouncing фильтров

Безопасность:
- RLS на уровне БД
- SECURITY DEFINER функции с проверкой ролей
- Rate limiting на обновление (1 раз в минуту)
- Параметризованные запросы через Supabase RPC

Дополнительно:
- Экспорт данных (CSV, JSON, PDF)
- Кастомизация виджетов (видимость, порядок)
- Уведомления о критических метриках
```

---

## 14. ПРИМЕРЫ ДАННЫХ

### Dashboard Summary
```json
{
  "totalLeads": 145,
  "newLeads": 23,
  "qualifiedLeads": 48,
  "closedLeads": 52,
  "lostLeads": 22,
  "activeDeals": 34,
  "closedDeals": 28,
  "totalRevenue": 485000.00,
  "pipelineValue": 720000.00,
  "pendingTasks": 12,
  "inProgressTasks": 8,
  "completedTasks": 145,
  "overdueTasks": 3,
  "totalProducts": 67,
  "outOfStockProducts": 5,
  "activeAlerts": 2,
  "errors24h": 14,
  "lastUpdated": "2024-01-15T14:30:00Z"
}
```

### Salesperson Metrics
```json
{
  "totalLeads": 32,
  "newLeads": 5,
  "qualifiedLeads": 12,
  "closedLeads": 10,
  "conversionRate": 31.25,
  "totalDeals": 15,
  "activeDeals": 8,
  "closedDeals": 7,
  "totalRevenue": 95000.00,
  "avgDealSize": 13571.43,
  "pendingTasks": 4,
  "completedTasks": 28
}
```

### Executive Metrics
```json
{
  "totalRevenue": 485000.00,
  "revenueGrowth": 15.5,
  "totalLeads": 145,
  "conversionRate": 35.86,
  "avgDealSize": 17321.43,
  "activeDeals": 34,
  "pipelineValue": 720000.00,
  "teamSize": 8,
  "avgRevenuePerEmployee": 60625.00,
  "topProduct": {
    "name": "Ultrasound Machine Pro",
    "revenue": 145000.00
  },
  "criticalAlerts": 2
}
```

---

## ЗАВЕРШЕНИЕ

Эта система дашборда обеспечивает:
✅ Ролевой доступ к метрикам
✅ Real-time обновления данных
✅ Производительные запросы через материализованные представления
✅ Интерактивные графики и виджеты
✅ Адаптивный дизайн
✅ Безопасность на уровне БД
✅ Расширяемую архитектуру

Используй этот промпт для создания аналогичного дашборда в других проектах.

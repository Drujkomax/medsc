import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConversionAnalytics {
  id: string;
  product_id: string;
  date: string;
  views_count: number;
  quote_requests_count: number;
  conversions_count: number;
  revenue: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeActivity {
  id: string;
  user_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  details: any;
  ip_address?: string | null;
  user_agent?: string | null;
  session_duration?: number | null;
  created_at: string;
  date: string;
}

export interface EmployeePerformanceMetrics {
  total_actions: number;
  daily_average: number;
  most_active_day: string;
  activity_breakdown: any;
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Получение аналитики конверсий
  const getConversionAnalytics = async (
    startDate?: string,
    endDate?: string,
    productId?: string
  ): Promise<ConversionAnalytics[]> => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('conversion_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка получения аналитики конверсий';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: errorMessage
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Получение активности сотрудников
  const getEmployeeActivity = async (
    startDate?: string,
    endDate?: string,
    userId?: string
  ): Promise<EmployeeActivity[]> => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('employee_activity')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as EmployeeActivity[];
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка получения активности сотрудников';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: errorMessage
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Получение метрик производительности сотрудника
  const getEmployeePerformanceMetrics = async (
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<EmployeePerformanceMetrics | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_employee_performance_metrics', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      return (data?.[0] || null) as EmployeePerformanceMetrics | null;
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка получения метрик производительности';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Логирование активности
  const logActivity = async (
    actionType: string,
    entityType?: string,
    entityId?: string,
    details?: any,
    sessionDuration?: number
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('log_employee_activity', {
        p_action_type: actionType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_details: details || {},
        p_session_duration: sessionDuration
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Ошибка логирования активности:', err);
      return null;
    }
  };

  // Обновление аналитики конверсий для товара
  const updateConversionAnalytics = async (
    productId: string,
    date?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase.rpc('update_conversion_analytics', {
        p_product_id: productId,
        p_date: date
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Ошибка обновления аналитики конверсий:', err);
    }
  };

  // Получение топ товаров по конверсии
  const getTopProductsByConversion = async (limit = 10): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          views_count,
          quote_requests_count,
          conversion_rate,
          performance_score
        `)
        .not('archived', 'eq', true)
        .order('conversion_rate', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка получения топ товаров';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: errorMessage
      });
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
    getTopProductsByConversion,
    logActivity,
    updateConversionAnalytics
  };
};
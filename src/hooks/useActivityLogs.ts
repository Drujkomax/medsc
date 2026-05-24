import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogRow {
  id: string;
  user_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  target_type: string | null;
  target_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
  user_full_name?: string;
  user_role?: string;
}

export interface ActivityLogFilters {
  userId?: string;
  targetType?: string;
  action?: string;
  from?: string;
  to?: string;
}

const PAGE_SIZE = 50;

export const useActivityLogs = (filters: ActivityLogFilters, page: number) => {
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.targetType) query = query.eq('target_type', filters.targetType);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.from) query = query.gte('created_at', filters.from);
      if (filters.to) query = query.lte('created_at', filters.to);

      const fromIdx = page * PAGE_SIZE;
      const toIdx = fromIdx + PAGE_SIZE - 1;
      const { data, count, error: qErr } = await query.range(fromIdx, toIdx);
      if (qErr) throw qErr;

      const logs = (data || []) as ActivityLogRow[];
      const userIds = Array.from(new Set(logs.map((l) => l.user_id).filter(Boolean)));

      if (userIds.length > 0) {
        const [{ data: profiles }, { data: roles }] = await Promise.all([
          supabase.from('profiles').select('id, email, full_name').in('id', userIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        ]);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));

        for (const row of logs) {
          const profile = profileMap.get(row.user_id) as any;
          row.user_email = profile?.email;
          row.user_full_name = profile?.full_name;
          row.user_role = roleMap.get(row.user_id) as any;
        }
      }

      setRows(logs);
      setTotal(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки логов');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.userId, filters.targetType, filters.action, filters.from, filters.to, page]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return {
    rows,
    total,
    pageSize: PAGE_SIZE,
    loading,
    error,
    refetch: fetchPage,
  };
};

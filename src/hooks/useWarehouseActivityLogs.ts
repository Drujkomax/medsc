import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WarehouseActivityLog {
  id: string;
  warehouse_item_id: string | null;
  item_name: { ru: string; en?: string; uz?: string };
  action_type: 'added' | 'updated' | 'deleted' | 'archived';
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  changes: Record<string, any>;
  created_at: string;
}

export const useWarehouseActivityLogs = () => {
  const [logs, setLogs] = useState<WarehouseActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (limit = 50) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('warehouse_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data as WarehouseActivityLog[]);
    } catch (error) {
      console.error('Error fetching warehouse logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logActivity = useCallback(async (
    itemId: string | null,
    itemName: { ru: string; en?: string; uz?: string },
    actionType: 'added' | 'updated' | 'deleted' | 'archived',
    changes: Record<string, any> = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      await supabase.from('warehouse_activity_logs').insert({
        warehouse_item_id: itemId,
        item_name: itemName,
        action_type: actionType,
        user_id: user.id,
        user_email: profile?.email || user.email,
        user_name: profile?.full_name || user.email,
        changes
      });
    } catch (error) {
      console.error('Error logging warehouse activity:', error);
    }
  }, []);

  return { logs, loading, fetchLogs, logActivity };
};

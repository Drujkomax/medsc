import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface ClinicActivityLog {
  id: string;
  client_id: string;
  action_type: string;
  action_description: string;
  changed_fields: Record<string, any>;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
}

const parseJsonFields = (fields: Json | null): Record<string, any> => {
  if (!fields) return {};
  if (typeof fields === 'object' && !Array.isArray(fields)) {
    return fields as Record<string, any>;
  }
  return {};
};

export const useClinicActivityLogs = (clientId: string) => {
  const [logs, setLogs] = useState<ClinicActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clinic_activity_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedLogs: ClinicActivityLog[] = (data || []).map(log => ({
        ...log,
        changed_fields: parseJsonFields(log.changed_fields)
      }));
      
      setLogs(parsedLogs);
    } catch (error) {
      console.error('Error fetching clinic activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchLogs();
    }
  }, [clientId]);

  return { logs, loading, refetch: fetchLogs };
};

export const logClinicActivity = async (
  clientId: string,
  actionType: string,
  actionDescription: string,
  changedFields: Record<string, any> = {}
) => {
  try {
    const { error } = await supabase.rpc('log_clinic_activity', {
      p_client_id: clientId,
      p_action_type: actionType,
      p_action_description: actionDescription,
      p_changed_fields: changedFields
    });

    if (error) {
      console.error('Error logging clinic activity:', error);
    }
  } catch (error) {
    console.error('Error logging clinic activity:', error);
  }
};

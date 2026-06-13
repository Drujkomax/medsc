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

  // Автоматическое логирование входа в систему
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
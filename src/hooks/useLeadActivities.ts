import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: 'note' | 'status_change' | 'contact' | 'system' | 'field_update' | 'assignment';
  content: string;
  old_value?: string;
  new_value?: string;
  created_by?: string;
  created_at: string;
  metadata?: any;
}

export const useLeadActivities = (leadId?: string) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Полноэкранный спиннер «Загрузка активности...» — только при первой загрузке.
  // Иначе каждый realtime-INSERT (или ручной refetch после добавления заметки)
  // на миг размонтировал бы весь список активностей.
  const hasLoadedRef = useRef(false);

  const fetchActivities = async () => {
    if (!leadId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      if (!hasLoadedRef.current) setLoading(true);
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities((data || []).map(item => ({
        ...item,
        type: item.type as LeadActivity['type'],
        old_value: item.old_value || undefined,
        new_value: item.new_value || undefined,
        created_by: item.created_by || undefined
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке активности');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  };

  const addNote = async (content: string) => {
    if (!leadId || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .insert([{
          lead_id: leadId,
          type: 'note',
          content: content.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchActivities(); // Refresh activities
      
      toast({
        title: 'Успешно',
        description: 'Заметка добавлена',
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при добавлении заметки';
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  };

  const addContactRecord = async (content: string, contactType: string = 'call') => {
    if (!leadId || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .insert([{
          lead_id: leadId,
          type: 'contact',
          content: content.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: { contact_type: contactType }
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchActivities(); // Refresh activities
      
      toast({
        title: 'Успешно',
        description: 'Запись о контакте добавлена',
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при добавлении записи';
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    // при смене лида снова показываем спиннер один раз
    hasLoadedRef.current = false;
    fetchActivities();
  }, [leadId]);

  // Real-time subscription for new activities
  useEffect(() => {
    if (!leadId) return;

    // Имя канала уникально для каждого лида — иначе несколько экземпляров
    // LeadActivityChat на одном (singleton) клиенте Supabase конфликтовали бы.
    const channel = supabase
      .channel(`lead-activities-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_activities',
          filter: `lead_id=eq.${leadId}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  return {
    activities,
    loading,
    error,
    addNote,
    addContactRecord,
    refetch: fetchActivities
  };
};
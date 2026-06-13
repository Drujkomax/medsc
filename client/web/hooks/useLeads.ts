import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  city?: string;
  stage: string;
  source?: string;
  notes?: string;
  value?: number;
  assigned_to?: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  // Поля квалификации
  budget_range?: string;
  equipment_interest?: string;
  timeline?: string;
  qualification_date?: string;
  qualified_by?: string;
  lead_quality?: 'A' | 'B' | 'C';
  lead_created_date?: string;
}

export const useLeads = (options?: { autoFetch?: boolean }) => {
  // autoFetch=false — для потребителей, которым нужны только мутации
  // (AddLeadDialog, EditLeadModal, StatusDropdown). Они НЕ должны грузить весь
  // список лидов на маунт и рефетчить его после мутации: за обновление страницы
  // отвечает её собственный инстанс useLeads через onSuccess/refetch.
  const autoFetch = options?.autoFetch ?? true;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  // Полноэкранный спиннер показываем ТОЛЬКО при первой загрузке. Любой
  // последующий refetch (после смены статуса, добавления, назначения и т.д.)
  // выполняется «тихо», не размонтируя таблицу. Иначе размонтирование таблицы
  // в момент закрытия Radix-оверлея (dropdown/select/dialog) оставляет
  // document.body со стилем pointer-events:none и весь интерфейс перестаёт
  // реагировать на клики («кнопки больше не работают»).
  const hasLoadedRef = useRef(false);

  const fetchLeads = async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        // PostgREST режет по умолчанию до 1000 — поднимаем явно.
        .range(0, 4999);

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  };

  const addLead = async (leadData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    position?: string;
    city?: string;
    stage?: string;
    notes?: string;
    source?: string;
    value?: number;
    equipment_interest?: string;
    budget_range?: string;
    timeline?: string;
    assigned_to?: string;
    lead_quality?: 'A' | 'B' | 'C';
    lead_created_date?: string;
  }) => {
    try {
      // Получаем текущего пользователя для автоназначения лида
      const { data: { user } } = await supabase.auth.getUser();
      
      const leadToInsert = {
        ...leadData,
        stage: leadData.stage || 'new',
        source: leadData.source || 'website_form'
      };

      // Если пользователь - специалист по продажам, автоматически назначаем лид на него
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (userRole?.role === 'salesperson') {
          leadToInsert.assigned_to = user.id;
        }
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([leadToInsert])
        .select()
        .single();

      if (error) throw error;
      if (autoFetch) await fetchLeads(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при добавлении лида');
    }
  };

  const updateLead = async (id: string, leadData: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      console.log('Updating lead:', { id, leadData });
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Update lead error:', error);
        throw error;
      }
      
      console.log('Lead updated successfully:', data);
      if (autoFetch) await fetchLeads(); // Refresh the list
      return data;
    } catch (err) {
      console.error('updateLead error:', err);
      throw new Error(err instanceof Error ? err.message : 'Ошибка при обновлении лида');
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (autoFetch) await fetchLeads(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при удалении лида');
    }
  };

  const archiveLead = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase
        .rpc('archive_lead', { lead_id: id, user_id: user.id });

      if (error) throw error;
      if (autoFetch) await fetchLeads(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при архивировании лида');
    }
  };

  const changeLeadStage = async (id: string, stage: string) => {
    const updateData: any = { 
      stage,
      closed_at: ['closed', 'lost'].includes(stage) ? new Date().toISOString() : null
    };
    
    // Автоматически проставляем дату квалификации при переходе в статус "qualified"
    if (stage === 'qualified') {
      const { data: { user } } = await supabase.auth.getUser();
      updateData.qualification_date = new Date().toISOString();
      if (user) {
        updateData.qualified_by = user.id;
      }
    }
    
    return updateLead(id, updateData);
  };

  useEffect(() => {
    if (autoFetch) fetchLeads();
  }, [autoFetch]);

  return {
    leads,
    loading,
    error,
    addLead,
    updateLead,
    deleteLead,
    archiveLead,
    changeLeadStage,
    refetch: fetchLeads
  };
};
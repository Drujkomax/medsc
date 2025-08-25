import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  company?: string;
  stage: string;
  notes?: string;
  assigned_to?: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  archived?: boolean;
  archived_at?: string;
  archived_by?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const addLead = async (leadData: {
    name: string;
    phone?: string;
    company?: string;
    stage?: string;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          stage: leadData.stage || 'new'
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchLeads(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при добавлении лида');
    }
  };

  const updateLead = async (id: string, leadData: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchLeads(); // Refresh the list
      return data;
    } catch (err) {
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
      await fetchLeads(); // Refresh the list
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
      await fetchLeads(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при архивировании лида');
    }
  };

  const changeLeadStage = async (id: string, stage: string) => {
    return updateLead(id, { 
      stage,
      closed_at: ['closed', 'lost'].includes(stage) ? new Date().toISOString() : null
    });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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
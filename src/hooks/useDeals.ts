import { useState, useEffect } from 'react';
import { Deal } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDeals(data as Deal[] || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const addDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([{
          title: dealData.title,
          client_id: dealData.client_id,
          amount: dealData.amount,
          stage: dealData.stage,
          probability: dealData.probability,
          close_date: dealData.close_date,
          notes: dealData.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      setDeals(prev => [...prev, data as Deal]);
      return data;
    } catch (error) {
      console.error('Error adding deal:', error);
      throw error;
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({
          title: updates.title,
          client_id: updates.client_id,
          amount: updates.amount,
          stage: updates.stage,
          probability: updates.probability,
          close_date: updates.close_date,
          notes: updates.notes
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setDeals(prev => 
        prev.map(deal => deal.id === id ? data as Deal : deal)
      );
      return data;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setDeals(prev => prev.filter(deal => deal.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  };

  const getDealById = (id: string) => {
    return deals.find(deal => deal.id === id);
  };

  const getDealsByClientId = (clientId: string) => {
    return deals.filter(deal => deal.client_id === clientId);
  };

  return {
    deals,
    loading,
    addDeal,
    updateDeal,
    deleteDeal,
    getDealById,
    getDealsByClientId,
    refreshDeals: loadDeals,
  };
};
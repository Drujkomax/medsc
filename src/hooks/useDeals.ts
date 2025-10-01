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
          lead_id: dealData.lead_id,
          amount: dealData.amount,
          stage: dealData.stage,
          probability: dealData.probability,
          close_date: dealData.close_date,
          notes: dealData.notes,
          deal_type: dealData.deal_type,
          product_id: dealData.product_id,
          service_id: dealData.service_id,
          payment_status: dealData.payment_status,
          debt_amount: dealData.debt_amount,
          assigned_engineer: dealData.assigned_engineer,
          assigned_accountant: dealData.assigned_accountant,
          assigned_salesperson: dealData.assigned_salesperson,
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
          lead_id: updates.lead_id,
          amount: updates.amount,
          stage: updates.stage,
          probability: updates.probability,
          close_date: updates.close_date,
          notes: updates.notes,
          deal_type: updates.deal_type,
          product_id: updates.product_id,
          service_id: updates.service_id,
          payment_status: updates.payment_status,
          debt_amount: updates.debt_amount,
          assigned_engineer: updates.assigned_engineer,
          assigned_accountant: updates.assigned_accountant,
          assigned_salesperson: updates.assigned_salesperson
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

  const getDealsByLeadId = (leadId: string) => {
    return deals.filter(deal => deal.lead_id === leadId);
  };

  return {
    deals,
    loading,
    addDeal,
    updateDeal,
    deleteDeal,
    getDealById,
    getDealsByLeadId,
    refreshDeals: loadDeals,
  };
};
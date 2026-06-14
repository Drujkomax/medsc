import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from './useProducts';

interface ArchivedLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: string;
  value?: number;
  source?: string;
  notes?: string;
  archived_at?: string;
  archived_by?: string;
  created_at: string;
  updated_at: string;
}

export const useArchivedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchArchivedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch (error) {
      console.error('Error fetching archived products:', error);
      setError('Не удалось загрузить архивированные товары');
    } finally {
      setLoading(false);
    }
  }, []);

  const unarchiveProduct = useCallback(async (productId: string) => {
    try {
      const { error } = await supabase.rpc('unarchive_product', {
        product_id: productId
      });

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));
      toast({
        title: "Товар восстановлен",
        description: "Товар был успешно восстановлен из архива.",
      });
    } catch (error) {
      console.error('Error unarchiving product:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить товар из архива.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteProductPermanently = useCallback(async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));
      toast({
        title: "Товар удален",
        description: "Товар был окончательно удален.",
      });
    } catch (error) {
      console.error('Error deleting product permanently:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchArchivedProducts();
  }, [fetchArchivedProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchArchivedProducts,
    unarchiveProduct,
    deleteProductPermanently
  };
};

export const useArchivedLeads = () => {
  const [leads, setLeads] = useState<ArchivedLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchArchivedLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching archived leads:', error);
      setError('Не удалось загрузить архивированные лиды');
    } finally {
      setLoading(false);
    }
  }, []);

  const unarchiveLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          archived: false,
          archived_at: null,
          archived_by: null
        })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      toast({
        title: "Лид восстановлен",
        description: "Лид был успешно восстановлен из архива.",
      });
    } catch (error) {
      console.error('Error unarchiving lead:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить лид из архива.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteLeadPermanently = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      toast({
        title: "Лид удален",
        description: "Лид был окончательно удален.",
      });
    } catch (error) {
      console.error('Error deleting lead permanently:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить лид.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchArchivedLeads();
  }, [fetchArchivedLeads]);

  return {
    leads,
    loading,
    error,
    refetch: fetchArchivedLeads,
    unarchiveLead,
    deleteLeadPermanently
  };
};
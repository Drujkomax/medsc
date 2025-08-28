import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  value: string;
  name: {
    ru: string;
    en: string;
    uz: string;
  };
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name->ru', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as unknown as Category[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryData: { 
    value: string; 
    name: { ru: string; en: string; uz: string } 
  }) => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      await fetchCategories(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при добавлении категории');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    addCategory,
    refetch: fetchCategories
  };
};
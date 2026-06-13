import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Manufacturer {
  id: string;
  name: string;
  legal_name?: string;
  country_code: string;
  logo_url?: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export const useManufacturers = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setManufacturers((data || []) as unknown as Manufacturer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const addManufacturer = async (manufacturerData: { 
    name: string;
    legal_name?: string;
    country_code: string;
    logo_url?: string;
    slug: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .insert([manufacturerData])
        .select()
        .single();

      if (error) throw error;
      await fetchManufacturers();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при добавлении производителя');
    }
  };

  const updateManufacturer = async (id: string, manufacturerData: { 
    name: string;
    legal_name?: string;
    country_code: string;
    logo_url?: string;
    slug: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .update(manufacturerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchManufacturers();
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при обновлении производителя');
    }
  };

  const deleteManufacturer = async (id: string) => {
    try {
      // Проверяем, есть ли товары с этим производителем
      const { data: products, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('manufacturer_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        throw new Error('Нельзя удалить производителя, который используется в товарах');
      }

      const { error } = await supabase
        .from('manufacturers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchManufacturers();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при удалении производителя');
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  return {
    manufacturers,
    loading,
    error,
    addManufacturer,
    updateManufacturer,
    deleteManufacturer,
    refetch: fetchManufacturers
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  title: any;
  description: any;
  category: string;
  price?: string;
  currency: string;
  status: 'active' | 'inactive';
  features?: any[];
  images?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ServiceCategory {
  id: string;
  name: any;
  value: string;
  created_at: string;
  updated_at: string;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Загрузка услуг
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices((data || []) as Service[]);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить услуги',
      });
    }
  };

  // Загрузка категорий услуг
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching service categories:', error);
    }
  };

  // Создание услуги
  const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          ...serviceData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => [data as Service, ...prev]);
      return data as Service;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  };

  // Обновление услуги
  const updateService = async (id: string, serviceData: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => prev.map(service => 
        service.id === id ? data as Service : service
      ));
      return data as Service;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  };

  // Удаление услуги
  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setServices(prev => prev.filter(service => service.id !== id));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchServices(), fetchCategories()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    services,
    categories,
    loading,
    createService,
    updateService,
    deleteService,
    refetch: () => {
      fetchServices();
      fetchCategories();
    }
  };
};
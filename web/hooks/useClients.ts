import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  legal_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  inn?: string;
  notes?: string;
  company?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  archived_at?: string;
  archived_by?: string;
  last_contact?: string;
  // New fields
  contract_start_date?: string;
  contract_end_date?: string;
  contract_status?: 'active' | 'onboarding' | 'suspended' | 'expired';
  cooperation_type?: string[];
  assigned_manager?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ClientWithStockInfo {
  client_id: string;
  client_name: string;
  low_stock_count: number;
  critical_count: number;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients((data || []) as Client[]);
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientById = async (id: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Client;
    } catch (err: any) {
      console.error('Error fetching client:', err);
      return null;
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'archived' | 'created_by' | 'updated_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, created_by: user.id, updated_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setClients([data as Client, ...clients]);
      toast.success('Клиент успешно добавлен');
      return data as Client;
    } catch (err: any) {
      toast.error('Ошибка добавления клиента');
      throw err;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('clients')
        .update({ ...clientData, updated_by: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setClients(clients.map(client => client.id === id ? data as Client : client));
      toast.success('Клиент обновлен');
      return data as Client;
    } catch (err: any) {
      toast.error('Ошибка обновления клиента');
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(clients.filter(client => client.id !== id));
      toast.success('Клиент удален');
    } catch (err: any) {
      toast.error('Ошибка удаления клиента');
      throw err;
    }
  };

  const archiveClient = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase.rpc('archive_client', {
        p_client_id: id,
        p_user_id: user.id
      });

      if (error) throw error;

      setClients(clients.filter(client => client.id !== id));
      toast.success('Клиент архивирован');
    } catch (err: any) {
      toast.error('Ошибка архивирования клиента');
      throw err;
    }
  };

  const getClientsWithLowStock = async (): Promise<ClientWithStockInfo[]> => {
    try {
      const { data, error } = await supabase.rpc('get_clients_with_low_stock');
      if (error) throw error;
      return (data || []);
    } catch (err: any) {
      console.error('Error fetching clients with low stock:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    archiveClient,
    getClientsWithLowStock,
    fetchClientById,
    refetch: fetchClients
  };
};

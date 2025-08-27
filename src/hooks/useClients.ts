import { useState, useEffect } from 'react';
import { Client } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClients(data as Client[] || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          company: clientData.company,
          notes: clientData.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      setClients(prev => [...prev, data as Client]);
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          company: updates.company,
          notes: updates.notes,
          last_contact: updates.last_contact
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setClients(prev => 
        prev.map(client => client.id === id ? data as Client : client)
      );
      return data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setClients(prev => prev.filter(client => client.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  const getClientById = (id: string) => {
    return clients.find(client => client.id === id);
  };

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    refreshClients: loadClients,
  };
};
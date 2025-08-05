import { useState, useEffect } from 'react';
import { Client } from '@/types/crm';
import { clientStorage } from '@/lib/storage';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = () => {
    try {
      const data = clientStorage.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const newClient = clientStorage.create(clientData);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    try {
      const updatedClient = clientStorage.update(id, updates);
      if (updatedClient) {
        setClients(prev => 
          prev.map(client => client.id === id ? updatedClient : client)
        );
        return updatedClient;
      }
      return null;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = (id: string) => {
    try {
      const success = clientStorage.delete(id);
      if (success) {
        setClients(prev => prev.filter(client => client.id !== id));
      }
      return success;
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
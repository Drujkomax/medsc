import { useState, useEffect } from 'react';
import { Deal } from '@/types/crm';
import { dealStorage } from '@/lib/storage';

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeals = () => {
    try {
      const data = dealStorage.getAll();
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const addDeal = (dealData: Omit<Deal, 'id' | 'createdAt'>) => {
    try {
      const newDeal = dealStorage.create(dealData);
      setDeals(prev => [...prev, newDeal]);
      return newDeal;
    } catch (error) {
      console.error('Error adding deal:', error);
      throw error;
    }
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    try {
      const updatedDeal = dealStorage.update(id, updates);
      if (updatedDeal) {
        setDeals(prev => 
          prev.map(deal => deal.id === id ? updatedDeal : deal)
        );
        return updatedDeal;
      }
      return null;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  };

  const deleteDeal = (id: string) => {
    try {
      const success = dealStorage.delete(id);
      if (success) {
        setDeals(prev => prev.filter(deal => deal.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  };

  const getDealById = (id: string) => {
    return deals.find(deal => deal.id === id);
  };

  const getDealsByClientId = (clientId: string) => {
    return deals.filter(deal => deal.clientId === clientId);
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
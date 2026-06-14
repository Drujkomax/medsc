import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientStockItem {
  id: string;
  client_id: string;
  product_id?: string;
  warehouse_item_id?: string;
  custom_item_name?: {
    ru: string;
    en: string;
    uz: string;
  };
  custom_item_description?: string;
  quantity: number;
  unit: string;
  minimum_stock: number;
  notify_low_stock: boolean;
  notification_threshold_days: number;
  average_monthly_consumption?: number;
  last_refill_date?: string;
  estimated_depletion_date?: string;
  location?: string;
  serial_numbers?: string[];
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  client_stock_id: string;
  client_id: string;
  transaction_type: 'initial' | 'incoming' | 'outgoing' | 'adjustment' | 'transfer';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  notes?: string;
  deal_id?: string;
  document_url?: string;
  performed_by?: string;
  created_at: string;
}

export interface StockAlert {
  id: string;
  client_stock_id: string;
  client_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  telegram_sent: boolean;
  telegram_sent_at?: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export const useClientStock = (clientId?: string) => {
  const [items, setItems] = useState<ClientStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_stock')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as ClientStockItem[]);
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки инвентаря');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData: Omit<ClientStockItem, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('client_stock')
        .insert([{ ...itemData, created_by: user.id, updated_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setItems([data as ClientStockItem, ...items]);
      toast.success('Товар успешно добавлен');
      return data as ClientStockItem;
    } catch (err: any) {
      toast.error('Ошибка добавления товара');
      throw err;
    }
  };

  const updateItem = async (id: string, itemData: Partial<Omit<ClientStockItem, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('client_stock')
        .update({ ...itemData, updated_by: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map(item => item.id === id ? data as ClientStockItem : item));
      toast.success('Товар обновлен');
      return data as ClientStockItem;
    } catch (err: any) {
      toast.error('Ошибка обновления товара');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('client_stock')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast.success('Товар удален');
    } catch (err: any) {
      toast.error('Ошибка удаления товара');
      throw err;
    }
  };

  const getTransactions = async (clientStockId?: string): Promise<StockTransaction[]> => {
    try {
      let query = supabase
        .from('client_stock_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientStockId) {
        query = query.eq('client_stock_id', clientStockId);
      } else if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StockTransaction[];
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  };

  const getAlerts = async (resolvedOnly = false): Promise<StockAlert[]> => {
    try {
      let query = supabase
        .from('client_stock_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (!resolvedOnly) {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StockAlert[];
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      return [];
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase
        .from('client_stock_alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Уведомление подтверждено');
    } catch (err: any) {
      toast.error('Ошибка подтверждения уведомления');
      throw err;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('client_stock_alerts')
        .update({ 
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Уведомление решено');
    } catch (err: any) {
      toast.error('Ошибка решения уведомления');
      throw err;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [clientId]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    getTransactions,
    getAlerts,
    acknowledgeAlert,
    resolveAlert,
    refetch: fetchItems
  };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WarehouseItemStatus = 'in_stock' | 'reserved' | 'in_transit' | 'sold' | 'written_off' | 'defective';

export interface WarehouseItem {
  id: string;
  product_id?: string;
  name: {
    ru: string;
    en: string;
    uz: string;
  };
  description?: {
    ru: string;
    en: string;
    uz: string;
  };
  images: {
    cover: string | null;
    gallery: string[];
  };
  quantity: number;
  unit: string;
  location?: string;
  condition: 'new' | 'used' | 'refurbished';
  status: WarehouseItemStatus;
  purchase_price?: number;
  selling_price?: number;
  notes?: string;
  minimum_stock?: number;
  notify_low_stock?: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  archived_at?: string;
  archived_by?: string;
}

export interface LowStockItem {
  id: string;
  name: {
    ru: string;
    en: string;
    uz: string;
  };
  quantity: number;
  minimum_stock: number;
  location?: string;
  product_id?: string;
}

export const useWarehouse = () => {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as WarehouseItem[]);
    } catch (err: any) {
      setError(err.message);
      toast.error('Ошибка загрузки складских товаров');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData: Omit<WarehouseItem, 'id' | 'created_at' | 'updated_at' | 'archived' | 'created_by' | 'updated_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('warehouse_items')
        .insert([{ ...itemData, created_by: user.id, updated_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setItems([data as WarehouseItem, ...items]);
      toast.success('Товар успешно добавлен на склад');
      return data as WarehouseItem;
    } catch (err: any) {
      toast.error('Ошибка добавления товара');
      throw err;
    }
  };

  const updateItem = async (id: string, itemData: Partial<Omit<WarehouseItem, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('warehouse_items')
        .update({ ...itemData, updated_by: user.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setItems(items.map(item => item.id === id ? data as WarehouseItem : item));
      toast.success('Товар обновлен');
      return data as WarehouseItem;
    } catch (err: any) {
      toast.error('Ошибка обновления товара');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('warehouse_items')
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

  const archiveItem = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase.rpc('archive_warehouse_item', {
        item_id: id,
        user_id: user.id
      });

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast.success('Товар архивирован');
    } catch (err: any) {
      toast.error('Ошибка архивирования товара');
      throw err;
    }
  };

  const getLowStockItems = async (): Promise<LowStockItem[]> => {
    try {
      const { data, error } = await supabase.rpc('get_low_stock_items');
      if (error) throw error;
      return (data || []) as LowStockItem[];
    } catch (err: any) {
      console.error('Error fetching low stock items:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    archiveItem,
    getLowStockItems,
    refetch: fetchItems
  };
};
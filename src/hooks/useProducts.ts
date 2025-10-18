import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: {
    ru: string;
    en: string;
    uz: string;
  };
  description: {
    ru: string;
    en: string;
    uz: string;
  };
  category: string;
  country: string | null;
  price: string | null;
  currency: 'USD' | 'EUR' | 'UZS';
  images: {
    cover: string | null;
    gallery: string[];
  };
  features: {
    ru: string[];
    en: string[];
    uz: string[];
  } | null;
  status: 'active' | 'draft';
  archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  views_count?: number;
  quote_requests_count?: number;
  manufacturer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Clean up empty features
      const cleanedFeatures = {
        ru: productData.features?.ru?.filter(f => f.trim()) || [],
        en: productData.features?.en?.filter(f => f.trim()) || [],
        uz: productData.features?.uz?.filter(f => f.trim()) || []
      };

      const cleanedData = {
        ...productData,
        features: cleanedFeatures
      };

      const { data, error } = await supabase
        .from('products')
        .insert([cleanedData])
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding product:', err);
      throw new Error(err instanceof Error ? err.message : 'Ошибка при добавлении товара');
    }
  };

  const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при обновлении товара');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при удалении товара');
    }
  };

  const archiveProduct = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('archive_product', {
        product_id: id,
        user_id: user.id
      });

      if (error) throw error;
      await fetchProducts(); // Refresh the list
      
      toast({
        title: "Товар архивирован",
        description: "Товар был успешно архивирован.",
      });
    } catch (err) {
      console.error('Error archiving product:', err);
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать товар.",
        variant: "destructive",
      });
    }
  }, [toast, fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    refetch: fetchProducts
  };
};

export const useAdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при удалении товара');
    }
  };

  const archiveProduct = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('archive_product', {
        product_id: id,
        user_id: user.id
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      console.log('Archive result:', data);
      
      // Обновляем список товаров
      await fetchProducts();
      
      toast({
        title: "Товар архивирован",
        description: "Товар был успешно архивирован.",
      });
    } catch (err) {
      console.error('Error archiving product:', err);
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось архивировать товар.",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast, fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Ошибка при обновлении товара');
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('useProducts.addProduct called with:', productData);
      
      // Clean up empty features
      const cleanedFeatures = {
        ru: productData.features?.ru?.filter(f => f.trim()) || [],
        en: productData.features?.en?.filter(f => f.trim()) || [],
        uz: productData.features?.uz?.filter(f => f.trim()) || []
      };
      console.log('Cleaned features:', cleanedFeatures);

      const cleanedData = {
        ...productData,
        features: cleanedFeatures
      };

      console.log('Adding product with data:', cleanedData);

      const { data, error } = await supabase
        .from('products')
        .insert([cleanedData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Product added successfully:', data);
      await fetchProducts(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error adding product:', err);
      throw new Error(err instanceof Error ? err.message : 'Ошибка при добавлении товара');
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    deleteProduct,
    archiveProduct,
    updateProduct,
    refetch: fetchProducts
  };
};

export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .eq('archived', false)
        .maybeSingle();

      if (error) throw error;
      setProduct(data as unknown as Product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  };
};

// Хук для административного доступа к товарам (все статусы)
export const useAdminProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProduct(data as unknown as Product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  };
};
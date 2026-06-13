import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/slugify';

export interface Product {
  id: string;
  slug?: string | null;
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

// Resolve a collision-free product slug by appending -2, -3, ... when the desired
// slug is already taken. Mirrors the numeric-suffix convention from migration
// 20251219122856 and prevents the 409 (Postgres 23505 unique_violation) that the
// products.slug UNIQUE constraint raises on duplicate slugs. The constraint — and
// the BEFORE INSERT/UPDATE trigger added in 20260613120000 — remain the final guard
// against races; this just resolves the common collision up front.
const ensureUniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
  const safeBase = base && base.trim() ? base.trim() : 'product';
  // Pull every slug sharing this prefix (drafts/archived included — the UNIQUE
  // constraint spans all rows regardless of status) and resolve the suffix in JS.
  const { data, error } = await supabase
    .from('products')
    .select('id, slug')
    .like('slug', `${safeBase}%`);
  if (error || !data) return safeBase; // DB constraint/trigger is the final guard
  const taken = new Set(
    data.filter((r) => r.id !== excludeId && r.slug).map((r) => r.slug as string)
  );
  if (!taken.has(safeBase)) return safeBase;
  let n = 2;
  while (taken.has(`${safeBase}-${n}`)) n += 1;
  return `${safeBase}-${n}`;
};

// Surface the slug UNIQUE violation (Postgres 23505) as a clear, actionable message
// instead of a raw "duplicate key" error, in case a concurrent insert still collides.
const describeProductWriteError = (err: unknown, fallback: string): string => {
  const e = err as { code?: string; message?: string } | null;
  const isSlugConflict =
    e?.code === '23505' ||
    (typeof e?.message === 'string' && /duplicate key|products_slug_key/i.test(e.message));
  if (isSlugConflict) {
    return 'Товар с таким URL (slug) уже существует. Измените английское название товара.';
  }
  return (e && typeof e.message === 'string' && e.message) || fallback;
};

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
        .order('created_at', { ascending: false })
        // Override PostgREST default cap of 1000 rows so the deal-create
        // dropdown actually lists the full active catalog.
        .range(0, 4999);

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

      // Generate a collision-free slug from the English name (append -2/-3 if taken)
      const slug = await ensureUniqueSlug(productData.slug || generateSlug(productData.name.en));

      const cleanedData = {
        ...productData,
        slug,
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
      throw new Error(describeProductWriteError(err, 'Ошибка при добавлении товара'));
    }
  };

  const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      // If name.en is being updated, regenerate a collision-free slug
      const dataToUpdate = { ...productData };
      if (productData.name?.en && !productData.slug) {
        dataToUpdate.slug = await ensureUniqueSlug(generateSlug(productData.name.en), id);
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(describeProductWriteError(err, 'Ошибка при обновлении товара'));
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
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('products')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq('id', id)
        .eq('archived', false)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Товар не найден или уже архивирован');

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
        .or('archived.eq.false,archived.is.null')
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
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('products')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq('id', id)
        .eq('archived', false)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Товар не найден или уже архивирован');

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
      // If name.en is being updated, regenerate a collision-free slug
      const dataToUpdate = { ...productData };
      if (productData.name?.en && !productData.slug) {
        dataToUpdate.slug = await ensureUniqueSlug(generateSlug(productData.name.en), id);
      }
      
      const { data, error } = await supabase
        .from('products')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts(); // Refresh the list
      return data;
    } catch (err) {
      throw new Error(describeProductWriteError(err, 'Ошибка при обновлении товара'));
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('useProducts.addProduct called with:', productData);
      
      // Ensure required fields have defaults
      const safeData = {
        ...productData,
        currency: productData.currency || 'USD',
        features: productData.features || { ru: [], en: [], uz: [] },
        images: productData.images || { cover: null, gallery: [] },
        country: productData.country || null,
        price: productData.price || null,
        manufacturer_id: productData.manufacturer_id || null,
      };
      
      // Clean up empty features
      const cleanedFeatures = {
        ru: safeData.features?.ru?.filter(f => f.trim()) || [],
        en: safeData.features?.en?.filter(f => f.trim()) || [],
        uz: safeData.features?.uz?.filter(f => f.trim()) || []
      };
      console.log('Cleaned features:', cleanedFeatures);

      // Generate a collision-free slug from the English name (append -2/-3 if taken)
      const slug = await ensureUniqueSlug(productData.slug || generateSlug(productData.name.en));

      const cleanedData = {
        ...safeData,
        slug,
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
      console.error('Full error details:', err);
      throw new Error(describeProductWriteError(err, 'Ошибка при добавлении товара'));
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

// Hook to fetch product by slug or ID (for public pages)
export const useProduct = (slugOrId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      // Try to fetch by slug first, then by ID
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .eq('archived', false);

      // Check if it's a UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      
      if (isUUID) {
        query = query.eq('id', slugOrId);
      } else {
        query = query.eq('slug', slugOrId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      setProduct(data as unknown as Product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slugOrId) {
      fetchProduct();
    }
  }, [slugOrId]);

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
# Техническое задание: Система управления услугами (Services Management System)

## 1. Структура базы данных

### 1.1 Таблица services

```sql
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основная информация (многоязычная)
  title JSONB NOT NULL, -- {ru: "...", en: "...", uz: "..."}
  description JSONB NOT NULL, -- {ru: "...", en: "...", uz: "..."}
  
  -- Категория и статус
  category TEXT NOT NULL, -- FK к service_categories.value
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'draft'
  
  -- Цена
  price TEXT, -- "от 5000", "по запросу", "договорная"
  currency TEXT DEFAULT 'USD', -- 'USD', 'UZS', 'RUB'
  
  -- Характеристики и медиа
  features JSONB DEFAULT '[]'::jsonb, -- [{ru: "...", en: "...", uz: "..."}]
  images JSONB DEFAULT '{"cover": null, "gallery": []}'::jsonb,
  
  -- Метаданные
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Архивирование
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by UUID REFERENCES auth.users(id),
  
  -- Аналитика
  views_count INTEGER DEFAULT 0,
  quote_requests_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0.0000,
  revenue_attributed NUMERIC(12,2) DEFAULT 0.00,
  
  -- Дополнительные поля
  duration TEXT, -- "1-2 часа", "1 день", "от 3 дней"
  availability TEXT DEFAULT 'available', -- 'available', 'limited', 'unavailable'
  service_type TEXT, -- 'installation', 'maintenance', 'consultation', 'training', 'repair'
  min_booking_notice TEXT, -- "24 часа", "3 дня"
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'draft')),
  CONSTRAINT valid_currency CHECK (currency IN ('USD', 'UZS', 'RUB')),
  CONSTRAINT valid_availability CHECK (availability IN ('available', 'limited', 'unavailable'))
);

-- Индексы для производительности
CREATE INDEX idx_services_category ON public.services(category) WHERE archived = false;
CREATE INDEX idx_services_status ON public.services(status) WHERE archived = false;
CREATE INDEX idx_services_created_by ON public.services(created_by);
CREATE INDEX idx_services_title_ru ON public.services((title->>'ru'));
CREATE INDEX idx_services_service_type ON public.services(service_type) WHERE archived = false;
CREATE INDEX idx_services_archived ON public.services(archived, archived_at);
CREATE INDEX idx_services_views_count ON public.services(views_count DESC) WHERE archived = false;

-- Полнотекстовый поиск
CREATE INDEX idx_services_title_search ON public.services 
  USING gin(to_tsvector('russian', title->>'ru'));
CREATE INDEX idx_services_description_search ON public.services 
  USING gin(to_tsvector('russian', description->>'ru'));

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Триггер для валидации категории
CREATE TRIGGER validate_service_category_insert
  BEFORE INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_category();

CREATE TRIGGER validate_service_category_update
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  WHEN (OLD.category IS DISTINCT FROM NEW.category)
  EXECUTE FUNCTION public.validate_service_category();
```

### 1.2 Таблица service_categories

```sql
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT name_has_required_languages CHECK (
    name ? 'ru' AND name ? 'en' AND name ? 'uz'
  )
);

CREATE INDEX idx_service_categories_value ON public.service_categories(value);
CREATE INDEX idx_service_categories_name_ru ON public.service_categories((name->>'ru'));
```

### 1.3 Таблица deal_services (связь с deals)

```sql
CREATE TABLE public.deal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2),
  total_price NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_unit_price CHECK (unit_price >= 0),
  CONSTRAINT positive_total_price CHECK (total_price >= 0)
);

CREATE INDEX idx_deal_services_deal_id ON public.deal_services(deal_id);
CREATE INDEX idx_deal_services_service_id ON public.deal_services(service_id);
```

### 1.4 Таблица service_packages (пакеты услуг)

```sql
CREATE TABLE public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL, -- {ru: "...", en: "...", uz: "..."}
  description JSONB NOT NULL,
  service_ids UUID[] NOT NULL, -- Массив ID услуг в пакете
  discount_percentage NUMERIC(5,2) DEFAULT 0, -- Скидка на пакет
  total_price NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);
```

## 2. RLS Политики

### 2.1 Политики для services

```sql
-- Включаем RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Публичный доступ к активным неархивированным услугам
CREATE POLICY "Public can view active services"
ON public.services
FOR SELECT
TO public
USING (status = 'active' AND archived = false);

-- Authenticated пользователи могут видеть активные неархивированные
CREATE POLICY "Authenticated users can view active services"
ON public.services
FOR SELECT
TO authenticated
USING (status = 'active' AND archived = false);

-- Менеджеры могут видеть все услуги (включая черновики и архив)
CREATE POLICY "Managers can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'sales_manager')
);

-- Observers могут видеть все услуги
CREATE POLICY "Observers can view all services"
ON public.services
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'observer'));

-- Менеджеры могут создавать услуги
CREATE POLICY "Managers can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'director') OR
   has_role(auth.uid(), 'admin') OR
   has_role(auth.uid(), 'sales_manager')) AND
  created_by = auth.uid()
);

-- Менеджеры могут обновлять услуги
CREATE POLICY "Managers can update services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'sales_manager')
)
WITH CHECK (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'sales_manager')
);

-- Только директора и админы могут удалять услуги
CREATE POLICY "Directors and admins can delete services"
ON public.services
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
);
```

### 2.2 Политики для service_categories

```sql
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Все могут просматривать категории
CREATE POLICY "Service categories are publicly viewable"
ON public.service_categories
FOR SELECT
TO public
USING (true);

-- Менеджеры могут управлять категориями
CREATE POLICY "Managers can manage service categories"
ON public.service_categories
FOR ALL
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'))
WITH CHECK (has_role_level(auth.uid(), 'sales_manager'));
```

### 2.3 Политики для deal_services

```sql
ALTER TABLE public.deal_services ENABLE ROW LEVEL SECURITY;

-- Пользователи могут просматривать услуги в своих сделках
CREATE POLICY "Users can view deal services"
ON public.deal_services
FOR SELECT
TO authenticated
USING (
  has_role_level(auth.uid(), 'salesperson') OR
  has_role(auth.uid(), 'accountant')
);

-- Продавцы могут добавлять услуги в сделки
CREATE POLICY "Salespersons can add services to deals"
ON public.deal_services
FOR INSERT
TO authenticated
WITH CHECK (has_role_level(auth.uid(), 'salesperson'));

-- Продавцы могут обновлять услуги в сделках
CREATE POLICY "Salespersons can update deal services"
ON public.deal_services
FOR UPDATE
TO authenticated
USING (has_role_level(auth.uid(), 'salesperson'));

-- Админы могут удалять услуги из сделок
CREATE POLICY "Admins can delete deal services"
ON public.deal_services
FOR DELETE
TO authenticated
USING (has_role_level(auth.uid(), 'admin'));
```

## 3. SQL функции

### 3.1 Функция валидации категории

```sql
CREATE OR REPLACE FUNCTION public.validate_service_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем существование категории
  IF NOT EXISTS (
    SELECT 1 FROM public.service_categories
    WHERE value = NEW.category
  ) THEN
    RAISE EXCEPTION 'Invalid service category: "%". Category not found in service_categories table.', NEW.category
      USING ERRCODE = '23514';
  END IF;
  
  RETURN NEW;
END;
$$;
```

### 3.2 Функция архивирования услуги

```sql
CREATE OR REPLACE FUNCTION public.archive_service(
  p_service_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем права
  IF NOT (has_role(p_user_id, 'director') OR 
          has_role(p_user_id, 'admin') OR 
          has_role(p_user_id, 'sales_manager')) THEN
    RAISE EXCEPTION 'Недостаточно прав для архивирования услуг';
  END IF;

  -- Проверяем, есть ли активные сделки с этой услугой
  IF EXISTS (
    SELECT 1 FROM public.deal_services ds
    JOIN public.deals d ON d.id = ds.deal_id
    WHERE ds.service_id = p_service_id 
      AND d.stage NOT IN ('won', 'lost')
  ) THEN
    RAISE EXCEPTION 'Нельзя архивировать услугу, используемую в активных сделках';
  END IF;

  -- Архивируем
  UPDATE public.services
  SET 
    archived = true,
    archived_at = now(),
    archived_by = p_user_id,
    updated_at = now()
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Услуга не найдена';
  END IF;
END;
$$;
```

### 3.3 Функция восстановления из архива

```sql
CREATE OR REPLACE FUNCTION public.unarchive_service(p_service_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.services
  SET 
    archived = false,
    archived_at = NULL,
    archived_by = NULL,
    updated_at = now()
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Услуга не найдена';
  END IF;
END;
$$;
```

### 3.4 Функция учета просмотров

```sql
CREATE OR REPLACE FUNCTION public.increment_service_views(p_service_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.services
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = now()
  WHERE id = p_service_id AND archived = false;
END;
$$;
```

### 3.5 Функция учета запросов на услуги

```sql
CREATE OR REPLACE FUNCTION public.increment_service_quote_requests(p_service_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.services
  SET 
    quote_requests_count = COALESCE(quote_requests_count, 0) + 1,
    updated_at = now()
  WHERE id = p_service_id AND archived = false;
  
  -- Обновляем конверсию
  PERFORM public.update_service_conversion(p_service_id);
END;
$$;
```

### 3.6 Функция расчета конверсии

```sql
CREATE OR REPLACE FUNCTION public.update_service_conversion(p_service_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views INTEGER;
  v_quotes INTEGER;
  v_conversion NUMERIC(5,4);
BEGIN
  SELECT 
    COALESCE(views_count, 0),
    COALESCE(quote_requests_count, 0)
  INTO v_views, v_quotes
  FROM public.services
  WHERE id = p_service_id;

  -- Вычисляем конверсию
  v_conversion := CASE 
    WHEN v_views > 0 THEN v_quotes::NUMERIC / v_views::NUMERIC
    ELSE 0.0000
  END;

  UPDATE public.services
  SET conversion_rate = v_conversion
  WHERE id = p_service_id;
END;
$$;
```

### 3.7 Функция получения популярных услуг

```sql
CREATE OR REPLACE FUNCTION public.get_popular_services(
  p_limit INTEGER DEFAULT 10,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title JSONB,
  category TEXT,
  views_count INTEGER,
  quote_requests_count INTEGER,
  conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.title,
    s.category,
    s.views_count,
    s.quote_requests_count,
    s.conversion_rate
  FROM public.services s
  WHERE s.archived = false
    AND s.status = 'active'
    AND (p_category IS NULL OR s.category = p_category)
  ORDER BY s.views_count DESC, s.quote_requests_count DESC
  LIMIT p_limit;
$$;
```

## 4. TypeScript типы

### 4.1 Основные типы

```typescript
// src/types/services.ts

export interface MultiLanguageContent {
  ru: string;
  en: string;
  uz: string;
}

export interface ServiceImages {
  cover: string | null;
  gallery: string[];
}

export interface Service {
  id: string;
  
  // Основная информация
  title: MultiLanguageContent;
  description: MultiLanguageContent;
  
  // Категория и статус
  category: string; // value из service_categories
  status: 'active' | 'inactive' | 'draft';
  
  // Цена
  price?: string;
  currency: 'USD' | 'UZS' | 'RUB';
  
  // Характеристики
  features?: MultiLanguageContent[];
  images?: ServiceImages;
  
  // Дополнительные поля
  duration?: string;
  availability: 'available' | 'limited' | 'unavailable';
  service_type?: 'installation' | 'maintenance' | 'consultation' | 'training' | 'repair';
  min_booking_notice?: string;
  
  // Метаданные
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Архивирование
  archived: boolean;
  archived_at?: string;
  archived_by?: string;
  
  // Аналитика
  views_count: number;
  quote_requests_count: number;
  conversion_rate: number;
  revenue_attributed: number;
}

export interface ServiceFormData {
  title: MultiLanguageContent;
  description: MultiLanguageContent;
  category: string;
  status: 'active' | 'inactive' | 'draft';
  price?: string;
  currency: 'USD' | 'UZS' | 'RUB';
  features?: MultiLanguageContent[];
  images?: ServiceImages;
  duration?: string;
  availability: 'available' | 'limited' | 'unavailable';
  service_type?: string;
  min_booking_notice?: string;
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'draft';
  service_type?: string;
  availability?: 'available' | 'limited' | 'unavailable';
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  archived: number;
  total_views: number;
  total_quote_requests: number;
  avg_conversion_rate: number;
}

export interface ServiceCategory {
  id: string;
  value: string;
  name: MultiLanguageContent;
  created_at: string;
  updated_at: string;
}

export interface ServicePackage {
  id: string;
  name: MultiLanguageContent;
  description: MultiLanguageContent;
  service_ids: string[];
  discount_percentage: number;
  total_price: number;
  currency: 'USD' | 'UZS' | 'RUB';
  status: 'active' | 'inactive';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DealService {
  id: string;
  deal_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  // Populated
  service?: Service;
}
```

## 5. React Hooks

### 5.1 Hook useServices

```typescript
// src/hooks/useServices.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Service, ServiceFormData, ServiceFilters, ServiceStats } from '@/types/services';

export const useServices = (filters?: ServiceFilters) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('services')
        .select('*')
        .eq('archived', false);

      // Применяем фильтры
      if (filters?.search) {
        query = query.or(`title->ru.ilike.%${filters.search}%,description->ru.ilike.%${filters.search}%`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
      }
      if (filters?.availability) {
        query = query.eq('availability', filters.availability);
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setServices((data || []) as Service[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase
        .from('services')
        .select('status, archived, views_count, quote_requests_count, conversion_rate');

      if (statsError) throw statsError;

      const stats: ServiceStats = {
        total: data?.length || 0,
        active: data?.filter(s => s.status === 'active' && !s.archived).length || 0,
        inactive: data?.filter(s => s.status === 'inactive' && !s.archived).length || 0,
        draft: data?.filter(s => s.status === 'draft' && !s.archived).length || 0,
        archived: data?.filter(s => s.archived).length || 0,
        total_views: data?.reduce((sum, s) => sum + (s.views_count || 0), 0) || 0,
        total_quote_requests: data?.reduce((sum, s) => sum + (s.quote_requests_count || 0), 0) || 0,
        avg_conversion_rate: data?.length 
          ? data.reduce((sum, s) => sum + (s.conversion_rate || 0), 0) / data.length 
          : 0,
      };

      setStats(stats);
    } catch (err) {
      console.error('Error fetching service stats:', err);
    }
  }, []);

  const addService = useCallback(async (serviceData: ServiceFormData) => {
    try {
      // Валидация
      if (!serviceData.title.ru || !serviceData.description.ru) {
        throw new Error('Название и описание на русском языке обязательны');
      }

      const { data, error: insertError } = await supabase
        .from('services')
        .insert([{
          ...serviceData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchServices();
      await fetchStats();
      return data as Service;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при добавлении услуги';
      throw new Error(errorMessage);
    }
  }, [fetchServices, fetchStats]);

  const updateService = useCallback(async (id: string, serviceData: Partial<ServiceFormData>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('services')
        .update({
          ...serviceData,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchServices();
      await fetchStats();
      return data as Service;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении услуги';
      throw new Error(errorMessage);
    }
  }, [fetchServices, fetchStats]);

  const deleteService = useCallback(async (id: string) => {
    try {
      // Проверяем использование в активных сделках
      const { data: dealServices, error: checkError } = await supabase
        .from('deal_services')
        .select('id, deal_id, deals!inner(stage)')
        .eq('service_id', id);

      if (checkError) throw checkError;

      const activeDeals = dealServices?.filter(
        ds => !['won', 'lost'].includes((ds as any).deals.stage)
      );

      if (activeDeals && activeDeals.length > 0) {
        throw new Error('Нельзя удалить услугу, используемую в активных сделках');
      }

      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchServices();
      await fetchStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении услуги';
      throw new Error(errorMessage);
    }
  }, [fetchServices, fetchStats]);

  const archiveService = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase.rpc('archive_service', {
        p_service_id: id,
        p_user_id: user.id,
      });

      if (error) throw error;

      await fetchServices();
      await fetchStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при архивировании услуги';
      throw new Error(errorMessage);
    }
  }, [fetchServices, fetchStats]);

  const incrementViews = useCallback(async (id: string) => {
    try {
      await supabase.rpc('increment_service_views', { p_service_id: id });
    } catch (err) {
      console.error('Error incrementing service views:', err);
    }
  }, []);

  const incrementQuoteRequests = useCallback(async (id: string) => {
    try {
      await supabase.rpc('increment_service_quote_requests', { p_service_id: id });
    } catch (err) {
      console.error('Error incrementing service quote requests:', err);
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchStats();
  }, [fetchServices, fetchStats]);

  // Real-time подписка
  useEffect(() => {
    const channel = supabase
      .channel('services_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        () => {
          fetchServices();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchServices, fetchStats]);

  return {
    services,
    loading,
    error,
    stats,
    addService,
    updateService,
    deleteService,
    archiveService,
    incrementViews,
    incrementQuoteRequests,
    refetch: fetchServices,
  };
};
```

### 5.2 Hook для одной услуги

```typescript
// src/hooks/useService.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Service } from '@/types/services';

export const useService = (id: string) => {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .eq('archived', false)
        .single();

      if (fetchError) throw fetchError;

      setService(data as Service);

      // Инкрементируем просмотры
      await supabase.rpc('increment_service_views', { p_service_id: id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Услуга не найдена';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id, fetchService]);

  return { service, loading, error, refetch: fetchService };
};
```

## 6. React компоненты

### 6.1 Страница AdminServices.tsx

```typescript
// src/features/admin/pages/AdminServices.tsx

import { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Download, Archive, Eye, MessageSquare } from 'lucide-react';
import { AddServiceDialog } from '@/features/admin/components/Services/AddServiceDialog';
import { EditServiceDialog } from '@/features/admin/components/Services/EditServiceDialog';
import { ServiceCard } from '@/features/admin/components/Services/ServiceCard';
import { ServiceStats } from '@/features/admin/components/Services/ServiceStats';
import { Skeleton } from '@/components/ui/skeleton';
import type { Service, ServiceFilters } from '@/types/services';

export const AdminServices = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { services, loading, stats, deleteService, archiveService } = useServices(filters);
  const { categories } = useCategories('service');

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
      toast({
        title: 'Успех',
        description: 'Услуга успешно удалена',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить услугу',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveService(id);
      toast({
        title: 'Успех',
        description: 'Услуга архивирована',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось архивировать услугу',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const getCurrentLanguageTitle = (service: Service) => {
    return service.title[i18n.language as 'ru' | 'en' | 'uz'] || service.title.ru;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление услугами</h1>
          <p className="text-muted-foreground">
            Создавайте и управляйте услугами вашей компании
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить услугу
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && <ServiceStats stats={stats} />}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск услуг..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, category: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.value}>
                    {cat.name[i18n.language as 'ru' | 'en' | 'uz'] || cat.name.ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, status: value === 'all' ? undefined : value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
                <SelectItem value="draft">Черновики</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.service_type || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, service_type: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="installation">Установка</SelectItem>
                <SelectItem value="maintenance">Обслуживание</SelectItem>
                <SelectItem value="consultation">Консультация</SelectItem>
                <SelectItem value="training">Обучение</SelectItem>
                <SelectItem value="repair">Ремонт</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Услуги не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => handleEdit(service)}
              onDelete={() => handleDelete(service.id)}
              onArchive={() => handleArchive(service.id)}
              getCurrentLanguageTitle={getCurrentLanguageTitle}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddServiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categories={categories}
      />

      {selectedService && (
        <EditServiceDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          service={selectedService}
          categories={categories}
        />
      )}
    </div>
  );
};
```

### 6.2 Компонент ServiceCard

```typescript
// src/features/admin/components/Services/ServiceCard.tsx

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, MessageSquare, Pencil, Archive, Trash2 } from 'lucide-react';
import type { Service } from '@/types/services';

interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  getCurrentLanguageTitle: (service: Service) => string;
}

export const ServiceCard = ({
  service,
  onEdit,
  onDelete,
  onArchive,
  getCurrentLanguageTitle,
}: ServiceCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'inactive': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'draft': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'limited': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'unavailable': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      {service.images?.cover && (
        <div className="h-48 overflow-hidden bg-muted">
          <img
            src={service.images.cover}
            alt={getCurrentLanguageTitle(service)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Title and Badges */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg line-clamp-2">
                {getCurrentLanguageTitle(service)}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Архивировать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Badge className={getStatusColor(service.status)}>
                {service.status}
              </Badge>
              <Badge className={getAvailabilityColor(service.availability)}>
                {service.availability}
              </Badge>
              {service.service_type && (
                <Badge variant="outline">{service.service_type}</Badge>
              )}
            </div>
          </div>

          {/* Price */}
          {service.price && (
            <div className="text-2xl font-bold text-primary">
              {service.price} {service.currency}
            </div>
          )}

          {/* Duration */}
          {service.duration && (
            <div className="text-sm text-muted-foreground">
              Длительность: {service.duration}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{service.views_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{service.quote_requests_count}</span>
            </div>
            {service.conversion_rate > 0 && (
              <div className="text-xs">
                Conv: {(service.conversion_rate * 100).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 7. Валидация (Zod)

```typescript
// src/lib/validations/service.ts

import { z } from 'zod';

const multiLanguageSchema = z.object({
  ru: z.string().min(1, 'Поле на русском обязательно').max(500),
  en: z.string().min(1, 'Поле на английском обязательно').max(500),
  uz: z.string().min(1, 'Поле на узбекском обязательно').max(500),
});

export const serviceSchema = z.object({
  title: multiLanguageSchema,
  description: z.object({
    ru: z.string().min(10, 'Минимум 10 символов').max(5000),
    en: z.string().min(10, 'Минимум 10 символов').max(5000),
    uz: z.string().min(10, 'Минимум 10 символов').max(5000),
  }),
  category: z.string().min(1, 'Выберите категорию'),
  status: z.enum(['active', 'inactive', 'draft']),
  price: z.string().optional(),
  currency: z.enum(['USD', 'UZS', 'RUB']),
  features: z.array(multiLanguageSchema).optional(),
  duration: z.string().optional(),
  availability: z.enum(['available', 'limited', 'unavailable']),
  service_type: z.enum(['installation', 'maintenance', 'consultation', 'training', 'repair']).optional(),
  min_booking_notice: z.string().optional(),
});

// Усиленная валидация для публикации (status: 'active')
export const activeServiceSchema = serviceSchema.refine(
  (data) => {
    if (data.status === 'active') {
      return data.title.ru && data.description.ru && data.category;
    }
    return true;
  },
  {
    message: 'Для публикации услуги необходимо заполнить название, описание и категорию',
  }
);
```

## 8. Права доступа по ролям

### Матрица прав

| Роль | Просмотр | Создание | Редактирование | Удаление | Архивирование |
|------|----------|----------|----------------|----------|---------------|
| **Public** | ✅ Активные | ❌ | ❌ | ❌ | ❌ |
| **User** | ✅ Активные | ❌ | ❌ | ❌ | ❌ |
| **Observer** | ✅ Все | ❌ | ❌ | ❌ | ❌ |
| **Accountant** | ✅ Активные | ❌ | ❌ | ❌ | ❌ |
| **Engineer** | ✅ Активные | ❌ | ❌ | ❌ | ❌ |
| **Salesperson** | ✅ Активные | ❌ | ❌ | ❌ | ❌ |
| **Sales Manager** | ✅ Все | ✅ | ✅ | ❌ | ✅ |
| **Admin** | ✅ Все | ✅ | ✅ | ✅ | ✅ |
| **Director** | ✅ Все | ✅ | ✅ | ✅ | ✅ |

## 9. Краткий промпт для AI

```
Создай систему управления услугами с:

БАЗА ДАННЫХ:
- Таблица services: id, title (JSONB ru/en/uz), description (JSONB), category (FK), status, price, currency, features (JSONB array), images (JSONB), duration, availability, service_type, archived, analytics
- Таблица service_categories: аналогично product_categories
- Таблица deal_services: связь услуг со сделками
- RLS: public SELECT для active, managers+ для CRUD
- Функции: archive_service, unarchive_service, increment_service_views, increment_service_quote_requests, update_service_conversion

FRONTEND:
- Hook: useServices(filters) с CRUD, stats, archiving
- Компоненты: AdminServices, ServiceCard, AddServiceDialog, EditServiceDialog, ServiceStats
- Фильтры: поиск, категория, статус, тип услуги, доступность
- Real-time обновления

ФУНКЦИОНАЛ:
- Многоязычность (ru, en, uz)
- Статусы: active, inactive, draft
- Типы: installation, maintenance, consultation, training, repair
- Доступность: available, limited, unavailable
- Аналитика: просмотры, запросы, конверсия
- Проверка использования в активных сделках перед удалением

ВАЛИДАЦИЯ:
- Zod схемы с проверкой для публикации
- title.ru, description.ru обязательны для active
- duration, price опциональны

UI: Grid cards, badges для статусов, stats dashboard, skeleton loading, toast notifications, HSL semantic tokens.
```

---

Промпт сохранен в `SERVICES_SYSTEM_PROMPT.md` с полной структурой для воспроизведения системы управления услугами.

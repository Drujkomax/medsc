# ПРОМПТ ДЛЯ СОЗДАНИЯ СИСТЕМЫ УПРАВЛЕНИЯ ТОВАРАМИ (PRODUCTS)

## 1. СТРУКТУРА БАЗЫ ДАННЫХ

### 1.1. Таблица `products`

```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Многоязычные поля (JSONB)
  name JSONB NOT NULL DEFAULT '{"ru": "", "en": "", "uz": ""}',
  description JSONB NOT NULL DEFAULT '{"ru": "", "en": "", "uz": ""}',
  features JSONB DEFAULT '{"ru": [], "en": [], "uz": []}',
  
  -- Классификация
  category TEXT NOT NULL,
  manufacturer_id UUID REFERENCES public.manufacturers(id) ON DELETE SET NULL,
  manufacturer_name TEXT,
  country TEXT,
  
  -- Ценообразование
  price TEXT, -- Может быть "price_on_request" или числовое значение
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'UZS')),
  competitor_price NUMERIC(12,2),
  price_history JSONB DEFAULT '[]',
  
  -- Медиа
  images JSONB DEFAULT '{"cover": null, "gallery": []}',
  icon_url TEXT,
  
  -- Статус и доступность
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft')),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID,
  
  -- Аналитика
  views_count INTEGER DEFAULT 0,
  quote_requests_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0.0000,
  revenue_attributed NUMERIC(12,2) DEFAULT 0.00,
  performance_score INTEGER DEFAULT 0,
  
  -- Метаданные
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  CONSTRAINT valid_category FOREIGN KEY (category) REFERENCES product_categories(value)
);

-- Индексы для оптимизации
CREATE INDEX idx_products_category ON products(category) WHERE NOT archived;
CREATE INDEX idx_products_status ON products(status) WHERE NOT archived;
CREATE INDEX idx_products_manufacturer ON products(manufacturer_id) WHERE NOT archived;
CREATE INDEX idx_products_archived ON products(archived, archived_at);
CREATE INDEX idx_products_views ON products(views_count DESC) WHERE NOT archived;
CREATE INDEX idx_products_conversion ON products(conversion_rate DESC) WHERE NOT archived;
CREATE INDEX idx_products_country ON products(country) WHERE NOT archived;

-- Полнотекстовый поиск
CREATE INDEX idx_products_search ON products USING GIN (
  (name::text || ' ' || description::text || ' ' || manufacturer_name)
);

-- Включаем RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
```

### 1.2. Таблица `product_categories`

```sql
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE, -- Уникальный код категории (например, 'ultrasound')
  name JSONB NOT NULL DEFAULT '{"ru": "", "en": "", "uz": ""}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_product_categories_value ON product_categories(value);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
```

### 1.3. Таблица `manufacturers`

```sql
CREATE TABLE public.manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 код страны
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_manufacturers_country ON manufacturers(country_code);
CREATE INDEX idx_manufacturers_slug ON manufacturers(slug);

ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
```

### 1.4. Таблица `conversion_analytics`

```sql
CREATE TABLE public.conversion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  views_count INTEGER DEFAULT 0,
  quote_requests_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,4) DEFAULT 0.0000,
  revenue NUMERIC(12,2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, date)
);

CREATE INDEX idx_conversion_analytics_product ON conversion_analytics(product_id, date DESC);
CREATE INDEX idx_conversion_analytics_date ON conversion_analytics(date DESC);

ALTER TABLE public.conversion_analytics ENABLE ROW LEVEL SECURITY;
```

---

## 2. RLS ПОЛИТИКИ

### 2.1. Политики для `products`

```sql
-- Публичный просмотр только активных неархивированных товаров
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (status = 'active' AND archived = false);

-- Менеджеры и выше могут управлять всеми товарами
CREATE POLICY "Managers can manage all products"
ON public.products FOR ALL
USING (
  has_role(auth.uid(), 'director') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'sales_manager')
);

-- Наблюдатели могут просматривать все товары
CREATE POLICY "Observers can view all products"
ON public.products FOR SELECT
USING (has_role(auth.uid(), 'observer'));

-- Продавцы могут просматривать активные товары
CREATE POLICY "Salespersons can view active products"
ON public.products FOR SELECT
USING (
  has_role(auth.uid(), 'salesperson') AND 
  (status = 'active' OR created_by = auth.uid())
);
```

### 2.2. Политики для `product_categories`

```sql
-- Категории доступны всем для просмотра
CREATE POLICY "Categories are publicly viewable"
ON public.product_categories FOR SELECT
USING (true);

-- Менеджеры могут управлять категориями
CREATE POLICY "Managers can manage categories"
ON public.product_categories FOR ALL
USING (
  has_role(auth.uid(), 'director') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'sales_manager')
);
```

### 2.3. Политики для `manufacturers`

```sql
-- Производители доступны всем для просмотра
CREATE POLICY "Manufacturers are publicly viewable"
ON public.manufacturers FOR SELECT
USING (true);

-- Менеджеры могут управлять производителями
CREATE POLICY "Managers can manage manufacturers"
ON public.manufacturers FOR ALL
USING (
  has_role(auth.uid(), 'director') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'sales_manager')
);
```

### 2.4. Политики для `conversion_analytics`

```sql
-- Менеджеры могут просматривать аналитику
CREATE POLICY "Managers can view conversion analytics"
ON public.conversion_analytics FOR SELECT
USING (has_role_level(auth.uid(), 'sales_manager'));

-- Менеджеры могут управлять аналитикой
CREATE POLICY "Managers can manage conversion analytics"
ON public.conversion_analytics FOR ALL
USING (has_role_level(auth.uid(), 'sales_manager'));
```

---

## 3. ФУНКЦИИ И ТРИГГЕРЫ

### 3.1. Архивирование товаров

```sql
CREATE OR REPLACE FUNCTION public.archive_product(product_id UUID, user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем права
  IF NOT (has_role(user_id, 'director') OR has_role(user_id, 'admin') OR has_role(user_id, 'sales_manager')) THEN
    RAISE EXCEPTION 'У вас нет прав для архивирования товаров';
  END IF;

  -- Архивируем
  UPDATE public.products 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id,
    updated_at = now()
  WHERE id = product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Товар не найден';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.unarchive_product(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET 
    archived = false,
    archived_at = null,
    archived_by = null,
    updated_at = now()
  WHERE id = product_id;
END;
$$;
```

### 3.2. Аналитические функции

```sql
-- Увеличение счетчика просмотров
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET 
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$;

-- Увеличение счетчика запросов на расчет
CREATE OR REPLACE FUNCTION public.increment_product_quote_requests(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET 
    quote_requests_count = COALESCE(quote_requests_count, 0) + 1,
    updated_at = now()
  WHERE id = product_id AND archived = false;
END;
$$;

-- Обновление аналитики конверсии
CREATE OR REPLACE FUNCTION public.update_conversion_analytics(
  p_product_id UUID, 
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views INTEGER;
  v_quotes INTEGER;
  v_conversion_rate DECIMAL(5,4);
BEGIN
  -- Получаем данные
  SELECT COALESCE(views_count, 0), COALESCE(quote_requests_count, 0)
  INTO v_views, v_quotes
  FROM public.products 
  WHERE id = p_product_id;
  
  -- Вычисляем конверсию
  v_conversion_rate := CASE 
    WHEN v_views > 0 THEN v_quotes::DECIMAL / v_views::DECIMAL
    ELSE 0.0000
  END;
  
  -- Обновляем или вставляем
  INSERT INTO public.conversion_analytics (
    product_id, date, views_count, quote_requests_count, conversion_rate
  )
  VALUES (p_product_id, p_date, v_views, v_quotes, v_conversion_rate)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET
    views_count = EXCLUDED.views_count,
    quote_requests_count = EXCLUDED.quote_requests_count,
    conversion_rate = EXCLUDED.conversion_rate,
    updated_at = now();
    
  -- Обновляем в таблице товаров
  UPDATE public.products 
  SET conversion_rate = v_conversion_rate
  WHERE id = p_product_id;
END;
$$;
```

### 3.3. Валидация категорий

```sql
-- Функция валидации категории
CREATE OR REPLACE FUNCTION public.validate_product_category(category_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.product_categories 
    WHERE value = category_value
  );
END;
$$;

-- Триггер для валидации категории
CREATE OR REPLACE FUNCTION public.validate_product_category_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_categories pc
      WHERE pc.value = NEW.category
    ) THEN
      RAISE EXCEPTION 'Invalid category: "%" not found', NEW.category
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.product_categories pc
        WHERE pc.value = NEW.category
      ) THEN
        RAISE EXCEPTION 'Invalid category: "%" not found', NEW.category
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_product_category_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_product_category_change();
```

### 3.4. Триггер обновления updated_at

```sql
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON public.manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 4. TYPESCRIPT ТИПЫ

### 4.1. Основные типы

```typescript
// src/types/product.ts

export interface Product {
  id: string;
  
  // Многоязычные поля
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
  features?: {
    ru: string[];
    en: string[];
    uz: string[];
  };
  
  // Классификация
  category: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  country?: string;
  
  // Ценообразование
  price?: string; // "price_on_request" или числовое значение
  currency?: 'USD' | 'EUR' | 'UZS';
  competitor_price?: number;
  price_history?: PriceHistoryEntry[];
  
  // Медиа
  images?: {
    cover: string | null;
    gallery: string[];
  };
  icon_url?: string;
  
  // Статус
  status: 'active' | 'draft';
  in_stock: boolean;
  archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  
  // Аналитика
  views_count?: number;
  quote_requests_count?: number;
  conversion_rate?: number;
  revenue_attributed?: number;
  performance_score?: number;
  
  // Метаданные
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  currency: string;
  changed_by?: string;
}

export interface ProductCategory {
  id: string;
  value: string;
  name: {
    ru: string;
    en: string;
    uz: string;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  legal_name?: string;
  country_code: string;
  slug: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ConversionAnalytics {
  id: string;
  product_id: string;
  date: string;
  views_count: number;
  quote_requests_count: number;
  conversions_count: number;
  conversion_rate: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  manufacturer?: string;
  country?: string;
  status?: 'active' | 'draft' | 'all';
  in_stock?: boolean;
  price_min?: number;
  price_max?: number;
}

export interface ProductStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  out_of_stock: number;
  total_views: number;
  total_quote_requests: number;
  avg_conversion_rate: number;
}
```

---

## 5. REACT HOOKS

### 5.1. Hook `useProducts.ts`

```typescript
// src/hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFilters } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      // Применяем фильтры
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.manufacturer) {
        query = query.eq('manufacturer_id', filters.manufacturer);
      }
      
      if (filters?.country) {
        query = query.eq('country', filters.country);
      }
      
      if (filters?.in_stock !== undefined) {
        query = query.eq('in_stock', filters.in_stock);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Клиентский поиск
      let filteredData = data || [];
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(product => {
          const nameMatch = Object.values(product.name || {})
            .some(n => n?.toLowerCase().includes(searchLower));
          const descMatch = Object.values(product.description || {})
            .some(d => d?.toLowerCase().includes(searchLower));
          const manuMatch = product.manufacturer_name?.toLowerCase().includes(searchLower);
          
          return nameMatch || descMatch || manuMatch;
        });
      }

      setProducts(filteredData);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Ошибка загрузки товаров',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [JSON.stringify(filters)]);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Товар добавлен',
        description: 'Товар успешно добавлен в каталог',
      });

      await fetchProducts();
      return data;
    } catch (err: any) {
      toast({
        title: 'Ошибка добавления товара',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateProduct = async (
    id: string,
    updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Товар обновлен',
        description: 'Изменения сохранены успешно',
      });

      await fetchProducts();
      return data;
    } catch (err: any) {
      toast({
        title: 'Ошибка обновления товара',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Товар удален',
        description: 'Товар успешно удален из каталога',
      });

      await fetchProducts();
    } catch (err: any) {
      toast({
        title: 'Ошибка удаления товара',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const archiveProduct = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { error } = await supabase.rpc('archive_product', {
        product_id: id,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Товар архивирован',
        description: 'Товар перемещен в архив',
      });

      await fetchProducts();
    } catch (err: any) {
      toast({
        title: 'Ошибка архивирования',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    refetch: fetchProducts,
  };
};
```

### 5.2. Hook `useCategories.ts`

```typescript
// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

export const useCategories = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('product_categories')
        .select('*')
        .order('name->ru');

      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Ошибка загрузки категорий',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Категория добавлена',
        description: 'Новая категория успешно создана',
      });

      await fetchCategories();
      return data;
    } catch (err: any) {
      toast({
        title: 'Ошибка добавления категории',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<ProductCategory>) => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Категория обновлена',
        description: 'Изменения сохранены',
      });

      await fetchCategories();
      return data;
    } catch (err: any) {
      toast({
        title: 'Ошибка обновления категории',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Проверяем, используется ли категория
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category', id)
        .limit(1);

      if (products && products.length > 0) {
        throw new Error('Категория используется в товарах и не может быть удалена');
      }

      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Категория удалена',
        description: 'Категория успешно удалена',
      });

      await fetchCategories();
    } catch (err: any) {
      toast({
        title: 'Ошибка удаления категории',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};
```

### 5.3. Hook `useManufacturers.ts`

Аналогично `useCategories.ts`, но для производителей.

---

## 6. КЛЮЧЕВЫЕ КОМПОНЕНТЫ

### 6.1. `AdminProducts.tsx` - Главная страница управления товарами

**Функциональность:**
- Список всех товаров (включая черновики)
- Фильтры: поиск, категория, производитель, статус, наличие
- Статистика: всего товаров, активные, черновики, архивированные
- Карточки товаров с превью, статусом, аналитикой
- Действия: редактировать, архивировать, удалить
- Кнопка "Добавить товар"
- Экспорт/импорт товаров (CSV/JSON)

**Структура:**
```typescript
<div className="container mx-auto p-6">
  {/* Заголовок и статистика */}
  <ProductStats stats={stats} />
  
  {/* Фильтры и действия */}
  <div className="flex gap-4 mb-6">
    <Input placeholder="Поиск..." />
    <Select category, manufacturer, status />
    <AddProductDialog />
    <ExportProducts />
    <ImportProducts />
  </div>
  
  {/* Сетка товаров */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map(product => (
      <ProductCard 
        key={product.id}
        product={product}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    ))}
  </div>
</div>
```

### 6.2. `AddProductDialog.tsx` - Диалог добавления товара

**Поля формы:**
- **Основная информация:**
  - Название (ru, en, uz) - обязательно для активных
  - Описание (ru, en, uz) - обязательно для активных
  - Категория - обязательно
  - Производитель - опционально
  - Страна производства - опционально

- **Изображения:**
  - Обложка (cover) - обязательно для активных
  - Галерея (gallery) - опционально

- **Характеристики:**
  - Особенности (features) по языкам - массивы строк

- **Цена:**
  - Чекбокс "Цена по запросу"
  - Если не по запросу: числовое поле + валюта (USD/EUR/UZS)

- **Статус и настройки:**
  - Статус: Active / Draft
  - В наличии: Да / Нет

**Валидация:**
- Для статуса "active":
  - Название (хотя бы на русском)
  - Описание (хотя бы на русском)
  - Категория
  - Обложка
- Для статуса "draft" - все необязательно

### 6.3. `EditProductDialog.tsx` - Диалог редактирования

Аналогичен `AddProductDialog`, но с предзаполненными данными.

### 6.4. `ProductImageUpload.tsx` - Загрузка изображений

**Функциональность:**
- Две секции: "Обложка товара" и "Галерея изображений"
- Загрузка в Supabase Storage bucket `product-images`
- Предпросмотр изображений
- Удаление изображений
- Поддержка форматов: JPG, PNG, WebP

**Логика загрузки:**
```typescript
const uploadImage = async (file: File, type: 'cover' | 'gallery') => {
  setUploading(true);
  
  // Генерируем уникальное имя файла
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = `products/${fileName}`;
  
  // Загружаем в Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);
  
  if (uploadError) throw uploadError;
  
  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);
  
  // Обновляем состояние
  if (type === 'cover') {
    onImagesChange({ ...images, cover: publicUrl });
  } else {
    onImagesChange({ 
      ...images, 
      gallery: [...images.gallery, publicUrl] 
    });
  }
  
  setUploading(false);
};
```

### 6.5. `ExportProducts.tsx` - Экспорт товаров

**Форматы:** CSV, JSON

**CSV структура:**
```
ID,Название (RU),Название (EN),Название (UZ),Описание (RU),...,Категория,Производитель,Страна,Цена,Валюта,Статус,В наличии,Просмотры,Запросы,Конверсия
```

**JSON структура:**
```json
[
  {
    "id": "uuid",
    "name": {"ru": "...", "en": "...", "uz": "..."},
    "description": {...},
    "category": "...",
    ...
  }
]
```

### 6.6. `ImportProducts.tsx` - Импорт товаров из CSV

**Функциональность:**
- Скачивание шаблона CSV
- Загрузка CSV файла
- Валидация данных
- Предпросмотр импортируемых товаров
- Массовое создание товаров
- Отчет об ошибках

**Валидация полей:**
- Обязательные: name_ru, category
- Проверка существования категории
- Проверка формата цены
- Проверка валюты (USD/EUR/UZS)
- Проверка статуса (active/draft)

---

## 7. БИЗНЕС-ЛОГИКА

### 7.1. Правила валидации при публикации

Товар можно опубликовать (status = 'active') только если:
- Заполнено название хотя бы на русском
- Заполнено описание хотя бы на русском
- Выбрана категория
- Загружена обложка (cover)

### 7.2. Аналитика товаров

**Счетчики:**
- `views_count` - общее количество просмотров товара
- `quote_requests_count` - количество запросов на расчет/КП

**Конверсия:**
```
conversion_rate = quote_requests_count / views_count
```

**Performance Score (0-100):**
```
score = (
  (conversion_rate * 40) +
  (views_count / max_views * 30) +
  (quote_requests_count / max_quotes * 30)
)
```

### 7.3. Правила архивирования

**Можно архивировать:**
- Товары без активных сделок (deals)
- Устаревшие товары
- Снятые с производства товары

**Предупреждения:**
- Если есть активные сделки - показать предупреждение
- Если товар в черновиках клиентов - показать предупреждение

### 7.4. Управление ценами

**История цен:**
```typescript
price_history: [
  {
    date: '2024-01-15',
    price: 15000,
    currency: 'USD',
    changed_by: 'user_id'
  }
]
```

При изменении цены - добавляется новая запись в `price_history`.

---

## 8. МАТРИЦА ДОСТУПА ПО РОЛЯМ

| Действие | director | admin | sales_manager | salesperson | accountant | engineer | observer | public |
|----------|----------|-------|---------------|-------------|------------|----------|----------|--------|
| Просмотр активных товаров | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Просмотр черновиков | ✅ | ✅ | ✅ | Свои | ❌ | ❌ | ✅ | ❌ |
| Просмотр архива | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Создание товара | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Редактирование | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Удаление | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Архивирование | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Восстановление из архива | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Просмотр аналитики | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Управление категориями | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Управление производителями | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Экспорт данных | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Импорт данных | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 9. UI/UX ТРЕБОВАНИЯ

### 9.1. Дизайн-система

**Цвета из index.css (HSL):**
```css
--product-active: 142 76% 36%;
--product-draft: 43 96% 56%;
--product-archived: 0 0% 50%;
--product-out-of-stock: 0 84% 60%;

--category-ultrasound: 200 80% 50%;
--category-mri: 280 70% 55%;
--category-xray: 30 90% 50%;
--category-ct: 180 70% 45%;
```

**Статусные бэджи:**
- Active: зеленый фон, белый текст
- Draft: желтый фон, темный текст
- Out of Stock: красный фон, белый текст
- Archived: серый фон, белый текст

### 9.2. Адаптивность

- **Mobile (< 768px):** 1 колонка
- **Tablet (768px - 1024px):** 2 колонки
- **Desktop (> 1024px):** 3-4 колонки

### 9.3. Интерактивность

**Загрузка:**
- Скелетоны для карточек товаров
- Спиннеры для кнопок действий
- Прогресс-бар при загрузке изображений

**Уведомления:**
- Успех: зеленый тост с галочкой
- Ошибка: красный тост с крестиком
- Предупреждение: желтый тост с восклицательным знаком

**Подтверждения:**
- Удаление товара: `AlertDialog` с подтверждением
- Архивирование: `AlertDialog` если есть активные сделки

### 9.4. Анимации

```css
/* Hover эффекты для карточек */
.product-card {
  transition: var(--transition-smooth);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-elegant);
}

/* Fade-in для списка товаров */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 10. ВАЛИДАЦИЯ И БЕЗОПАСНОСТЬ

### 10.1. Клиентская валидация (Zod)

```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.object({
    ru: z.string().min(1, 'Название на русском обязательно'),
    en: z.string().optional(),
    uz: z.string().optional(),
  }),
  description: z.object({
    ru: z.string().min(10, 'Описание должно быть не менее 10 символов'),
    en: z.string().optional(),
    uz: z.string().optional(),
  }),
  category: z.string().min(1, 'Выберите категорию'),
  price: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'UZS']).default('USD'),
  status: z.enum(['active', 'draft']),
  images: z.object({
    cover: z.string().nullable(),
    gallery: z.array(z.string()),
  }),
}).refine(
  (data) => {
    if (data.status === 'active') {
      return data.name.ru && data.description.ru && data.images.cover;
    }
    return true;
  },
  {
    message: 'Для публикации необходимо заполнить все обязательные поля',
  }
);
```

### 10.2. Серверная безопасность

**RLS политики:**
- Публичный доступ только к активным неархивированным товарам
- Менеджеры и выше видят все товары
- Изменения только для ролей sales_manager и выше

**SQL Injection:**
- Использование параметризованных запросов через Supabase SDK
- Валидация UUID перед использованием в RPC функциях

**XSS защита:**
- Санитизация HTML в описаниях
- Использование React (автоматическая защита)
- CSP заголовки

---

## 11. ПРОИЗВОДИТЕЛЬНОСТЬ

### 11.1. Оптимизация запросов

**Индексы:**
```sql
CREATE INDEX idx_products_category ON products(category) WHERE NOT archived;
CREATE INDEX idx_products_status ON products(status) WHERE NOT archived;
CREATE INDEX idx_products_views ON products(views_count DESC);
```

**Пагинация:**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .range(start, end)
  .order('created_at', { ascending: false });
```

### 11.2. Кэширование

**React Query:**
```typescript
import { useQuery } from '@tanstack/react-query';

const { data: products } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 5 * 60 * 1000, // 5 минут
});
```

### 11.3. Оптимизация изображений

**Сжатие перед загрузкой:**
```typescript
const compressImage = async (file: File): Promise<File> => {
  // Используем canvas для сжатия
  // Максимальный размер: 1920x1920
  // Качество: 80%
};
```

**Lazy Loading:**
```tsx
<img 
  src={product.images.cover} 
  loading="lazy" 
  alt={product.name.ru}
/>
```

---

## 12. ДОПОЛНИТЕЛЬНЫЕ ВОЗМОЖНОСТИ

### 12.1. Сравнение товаров

**Таблица `product_comparisons`:**
```sql
CREATE TABLE product_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 12.2. Избранное

**Таблица `product_favorites`:**
```sql
CREATE TABLE product_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);
```

### 12.3. Отзывы и рейтинги

**Таблица `product_reviews`:**
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 12.4. Связанные товары

**Таблица `product_relations`:**
```sql
CREATE TABLE product_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  related_product_id UUID REFERENCES products(id),
  relation_type TEXT CHECK (relation_type IN ('similar', 'accessory', 'alternative')),
  UNIQUE(product_id, related_product_id)
);
```

---

## 13. КРАТКИЙ ПРОМПТ ДЛЯ ИИ

```
Создай систему управления товарами (Products) для B2B CRM с:

БД:
- products (id, name/description/features в JSONB для ru/en/uz, category FK, manufacturer_id FK, country, price/currency, images JSONB {cover, gallery}, status active/draft, in_stock, archived, views/quotes/conversion, timestamps)
- product_categories (id, value unique, name JSONB)
- manufacturers (id, name, country_code, slug, logo_url)
- conversion_analytics (product_id FK, date, views/quotes/conversions, conversion_rate, revenue)

RLS:
- Публичный SELECT активных неархивированных
- Менеджеры (sales_manager+) управляют всем
- Наблюдатели видят все
- Продавцы видят активные + свои черновики

Функции:
- archive_product(product_id, user_id) - архивирование с проверкой прав
- increment_product_views(product_id) - увеличение просмотров
- increment_product_quote_requests(product_id) - увеличение запросов
- update_conversion_analytics(product_id, date) - расчет конверсии
- validate_product_category_change() - триггер валидации категории

Хуки:
- useProducts(filters) - CRUD, фильтры (search, category, manufacturer, status, stock), архивирование
- useCategories() - CRUD категорий с проверкой использования
- useManufacturers() - CRUD производителей

Компоненты:
- AdminProducts - список с фильтрами, статистикой, карточками, экспорт/импорт
- AddProductDialog - форма с мультиязычными полями, загрузкой изображений, валидацией (обязательные для active: name.ru, description.ru, category, cover)
- EditProductDialog - аналогично Add с предзаполнением
- ProductImageUpload - загрузка в Supabase Storage bucket product-images, preview, удаление
- ExportProducts - CSV/JSON экспорт
- ImportProducts - CSV импорт с валидацией и отчетом об ошибках

Роли:
- director/admin/sales_manager - полный доступ
- salesperson - просмотр активных + свои черновики
- accountant/engineer - просмотр активных
- observer - просмотр всего
- public - просмотр активных неархивированных

Валидация:
- Клиент: Zod схема с проверкой обязательных полей для status='active'
- Сервер: RLS политики, триггер валидации категории

Аналитика:
- conversion_rate = quote_requests / views
- performance_score = (conversion*40 + views*30 + quotes*30) / 100

Дизайн:
- HSL цвета из design tokens
- Адаптив: 1-4 колонки
- Статусные бэджи (active зеленый, draft желтый, archived серый)
- Hover эффекты, skeletons, toasts
- Lazy loading изображений

Особенности:
- История цен в JSONB price_history
- Многоязычность через JSONB
- Архивирование с проверкой активных сделок
- Real-time updates через Supabase subscriptions
- Индексы на category, status, manufacturer, views, conversion
```

---

## 14. ПРИМЕРЫ ДАННЫХ

### 14.1. Пример товара

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": {
    "ru": "Ультразвуковой сканер GE Voluson E10",
    "en": "GE Voluson E10 Ultrasound Scanner",
    "uz": "GE Voluson E10 ultratovush skaneri"
  },
  "description": {
    "ru": "Премиум-класс УЗИ система для акушерства и гинекологии",
    "en": "Premium ultrasound system for obstetrics and gynecology",
    "uz": "Akusherlik va ginekologiya uchun premium ultratovush tizimi"
  },
  "features": {
    "ru": [
      "4D визуализация в реальном времени",
      "Технология HDlive",
      "Автоматический расчет параметров плода"
    ],
    "en": [
      "Real-time 4D imaging",
      "HDlive technology",
      "Automatic fetal measurement"
    ],
    "uz": [
      "Real vaqt 4D tasvirlash",
      "HDlive texnologiyasi",
      "Homila parametrlarini avtomatik hisoblash"
    ]
  },
  "category": "ultrasound",
  "manufacturer_id": "660e8400-e29b-41d4-a716-446655440001",
  "manufacturer_name": "GE Healthcare",
  "country": "US",
  "price": "95000",
  "currency": "USD",
  "images": {
    "cover": "https://...supabase.co/storage/v1/object/public/product-images/products/voluson-e10-cover.jpg",
    "gallery": [
      "https://.../voluson-e10-1.jpg",
      "https://.../voluson-e10-2.jpg"
    ]
  },
  "status": "active",
  "in_stock": true,
  "archived": false,
  "views_count": 1247,
  "quote_requests_count": 89,
  "conversion_rate": 0.0713,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-03-20T14:22:00Z"
}
```

### 14.2. Пример категории

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "value": "ultrasound",
  "name": {
    "ru": "Ультразвуковое оборудование",
    "en": "Ultrasound Equipment",
    "uz": "Ultratovush uskunalari"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 14.3. Пример производителя

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "GE Healthcare",
  "legal_name": "General Electric Healthcare",
  "country_code": "US",
  "slug": "ge-healthcare",
  "logo_url": "https://.../manufacturers/ge-healthcare-logo.png",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

**КОНЕЦ ПРОМПТА**

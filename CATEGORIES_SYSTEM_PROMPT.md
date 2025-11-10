# Техническое задание: Система управления категориями (Categories Management System)

## 1. Структура базы данных

### 1.1 Таблица product_categories

```sql
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE, -- Уникальный идентификатор категории (slug)
  name JSONB NOT NULL, -- Многоязычное название категории
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Индексы для производительности
CREATE INDEX idx_product_categories_value ON public.product_categories(value);
CREATE INDEX idx_product_categories_name_ru ON public.product_categories((name->>'ru'));
CREATE INDEX idx_product_categories_created_by ON public.product_categories(created_by);

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Проверка структуры JSONB для name
ALTER TABLE public.product_categories
ADD CONSTRAINT name_has_required_languages 
CHECK (
  name ? 'ru' AND 
  name ? 'en' AND 
  name ? 'uz' AND
  jsonb_typeof(name->'ru') = 'string' AND
  jsonb_typeof(name->'en') = 'string' AND
  jsonb_typeof(name->'uz') = 'string'
);
```

### 1.2 Таблица service_categories (аналогичная структура)

```sql
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Аналогичные индексы и триггеры
CREATE INDEX idx_service_categories_value ON public.service_categories(value);
CREATE INDEX idx_service_categories_name_ru ON public.service_categories((name->>'ru'));
CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 1.3 Таблица category_usage_stats (опционально, для аналитики)

```sql
CREATE TABLE public.category_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  category_type TEXT NOT NULL, -- 'product' или 'service'
  products_count INTEGER DEFAULT 0,
  services_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category_id, category_type)
);
```

## 2. RLS Политики

### 2.1 Политики для product_categories

```sql
-- Включаем RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Все могут просматривать категории
CREATE POLICY "Categories are publicly viewable"
ON public.product_categories
FOR SELECT
TO public
USING (true);

-- Менеджеры и выше могут управлять категориями
CREATE POLICY "Managers can manage categories"
ON public.product_categories
FOR ALL
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
```

### 2.2 Аналогичные политики для service_categories

```sql
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service categories are publicly viewable"
ON public.service_categories FOR SELECT TO public USING (true);

CREATE POLICY "Managers can manage service categories"
ON public.service_categories FOR ALL TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'))
WITH CHECK (has_role_level(auth.uid(), 'sales_manager'));
```

## 3. SQL функции

### 3.1 Функция проверки использования категории

```sql
CREATE OR REPLACE FUNCTION public.check_category_usage(
  p_category_value TEXT,
  p_entity_type TEXT DEFAULT 'product'
)
RETURNS TABLE(
  is_used BOOLEAN,
  usage_count INTEGER,
  entity_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_ids UUID[];
BEGIN
  IF p_entity_type = 'product' THEN
    SELECT COUNT(*), ARRAY_AGG(id)
    INTO v_count, v_ids
    FROM public.products
    WHERE category = p_category_value AND archived = false;
  ELSIF p_entity_type = 'service' THEN
    SELECT COUNT(*), ARRAY_AGG(id)
    INTO v_count, v_ids
    FROM public.services
    WHERE category = p_category_value;
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  RETURN QUERY SELECT (v_count > 0), v_count, COALESCE(v_ids, ARRAY[]::UUID[]);
END;
$$;
```

### 3.2 Функция безопасного удаления категории

```sql
CREATE OR REPLACE FUNCTION public.safe_delete_category(
  p_category_id UUID,
  p_category_type TEXT DEFAULT 'product'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_value TEXT;
  v_usage_count INTEGER;
  v_result JSON;
BEGIN
  -- Проверяем права
  IF NOT (has_role(auth.uid(), 'director') OR 
          has_role(auth.uid(), 'admin') OR 
          has_role(auth.uid(), 'sales_manager')) THEN
    RAISE EXCEPTION 'Недостаточно прав для удаления категории';
  END IF;

  -- Получаем value категории
  IF p_category_type = 'product' THEN
    SELECT value INTO v_category_value
    FROM public.product_categories WHERE id = p_category_id;
  ELSE
    SELECT value INTO v_category_value
    FROM public.service_categories WHERE id = p_category_id;
  END IF;

  IF v_category_value IS NULL THEN
    RAISE EXCEPTION 'Категория не найдена';
  END IF;

  -- Проверяем использование
  SELECT usage_count INTO v_usage_count
  FROM public.check_category_usage(v_category_value, p_category_type);

  IF v_usage_count > 0 THEN
    RAISE EXCEPTION 'Нельзя удалить категорию, которая используется (% элементов)', v_usage_count;
  END IF;

  -- Удаляем категорию
  IF p_category_type = 'product' THEN
    DELETE FROM public.product_categories WHERE id = p_category_id;
  ELSE
    DELETE FROM public.service_categories WHERE id = p_category_id;
  END IF;

  v_result := json_build_object(
    'success', true,
    'message', 'Категория успешно удалена',
    'category_id', p_category_id
  );

  RETURN v_result;
END;
$$;
```

### 3.3 Функция обновления статистики использования

```sql
CREATE OR REPLACE FUNCTION public.update_category_usage_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'products' THEN
      INSERT INTO public.category_usage_stats (category_id, category_type, products_count, last_used_at)
      SELECT pc.id, 'product', COUNT(p.id), now()
      FROM public.product_categories pc
      LEFT JOIN public.products p ON p.category = pc.value AND p.archived = false
      WHERE pc.value = NEW.category
      GROUP BY pc.id
      ON CONFLICT (category_id, category_type)
      DO UPDATE SET
        products_count = EXCLUDED.products_count,
        last_used_at = EXCLUDED.last_used_at,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
```

## 4. TypeScript типы

### 4.1 Основные типы

```typescript
// src/types/categories.ts

export interface MultiLanguageName {
  ru: string;
  en: string;
  uz: string;
}

export interface Category {
  id: string;
  value: string; // Уникальный slug
  name: MultiLanguageName;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CategoryWithStats extends Category {
  usage_count?: number;
  products_count?: number;
  services_count?: number;
  last_used_at?: string;
}

export interface CategoryFormData {
  value: string;
  name: MultiLanguageName;
}

export interface CategoryUsageInfo {
  is_used: boolean;
  usage_count: number;
  entity_ids: string[];
}

export type CategoryType = 'product' | 'service';

export interface CategoryFilters {
  search?: string;
  created_by?: string;
  date_from?: string;
  date_to?: string;
}
```

## 5. React Hook: useCategories

### 5.1 Основной хук

```typescript
// src/hooks/useCategories.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Category, CategoryFormData, CategoryType } from '@/types/categories';

export const useCategories = (type: CategoryType = 'product') => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tableName = type === 'product' ? 'product_categories' : 'service_categories';

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order('name->ru', { ascending: true });

      if (fetchError) throw fetchError;

      setCategories((data || []) as Category[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const addCategory = useCallback(async (categoryData: CategoryFormData) => {
    try {
      // Валидация на клиенте
      if (!categoryData.value || !categoryData.name.ru || !categoryData.name.en || !categoryData.name.uz) {
        throw new Error('Все поля должны быть заполнены');
      }

      // Проверка на уникальность value
      const existing = categories.find(c => c.value === categoryData.value);
      if (existing) {
        throw new Error('Категория с таким значением уже существует');
      }

      const { data, error: insertError } = await supabase
        .from(tableName)
        .insert([categoryData])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchCategories();
      return data as Category;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при добавлении категории';
      throw new Error(errorMessage);
    }
  }, [tableName, categories, fetchCategories]);

  const updateCategory = useCallback(async (id: string, categoryData: CategoryFormData) => {
    try {
      // Валидация
      if (!categoryData.value || !categoryData.name.ru || !categoryData.name.en || !categoryData.name.uz) {
        throw new Error('Все поля должны быть заполнены');
      }

      // Проверка на уникальность value (исключая текущую категорию)
      const existing = categories.find(c => c.value === categoryData.value && c.id !== id);
      if (existing) {
        throw new Error('Категория с таким значением уже существует');
      }

      const { data, error: updateError } = await supabase
        .from(tableName)
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchCategories();
      return data as Category;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении категории';
      throw new Error(errorMessage);
    }
  }, [tableName, categories, fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      // Получаем value категории
      const category = categories.find(c => c.id === id);
      if (!category) throw new Error('Категория не найдена');

      // Проверяем использование
      const entityTable = type === 'product' ? 'products' : 'services';
      const { data: entities, error: checkError } = await supabase
        .from(entityTable)
        .select('id')
        .eq('category', category.value)
        .limit(1);

      if (checkError) throw checkError;

      if (entities && entities.length > 0) {
        throw new Error(`Нельзя удалить категорию, которая используется в ${type === 'product' ? 'товарах' : 'услугах'}`);
      }

      // Удаляем категорию
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении категории';
      throw new Error(errorMessage);
    }
  }, [tableName, categories, type, fetchCategories]);

  const getCategoryByValue = useCallback((value: string): Category | undefined => {
    return categories.find(c => c.value === value);
  }, [categories]);

  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  }, [categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Real-time подписка на изменения
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fetchCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryByValue,
    getCategoryById,
    refetch: fetchCategories,
  };
};
```

## 6. React компоненты

### 6.1 Главная страница Categories.tsx

```typescript
// src/features/admin/pages/Categories.tsx

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryFormData, Category } from '@/types/categories';

export const Categories = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    value: '',
    name: { ru: '', en: '', uz: '' }
  });

  const {
    categories: productCategories,
    loading: productLoading,
    addCategory: addProductCategory,
    updateCategory: updateProductCategory,
    deleteCategory: deleteProductCategory,
  } = useCategories('product');

  const {
    categories: serviceCategories,
    loading: serviceLoading,
    addCategory: addServiceCategory,
    updateCategory: updateServiceCategory,
    deleteCategory: deleteServiceCategory,
  } = useCategories('service');

  const resetForm = () => {
    setFormData({ value: '', name: { ru: '', en: '', uz: '' } });
    setSelectedCategory(null);
  };

  const handleAdd = async (type: 'product' | 'service') => {
    try {
      setIsSubmitting(true);
      
      const addFn = type === 'product' ? addProductCategory : addServiceCategory;
      await addFn(formData);
      
      toast({
        title: 'Успех',
        description: 'Категория успешно добавлена',
      });
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить категорию',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (type: 'product' | 'service') => {
    if (!selectedCategory) return;
    
    try {
      setIsSubmitting(true);
      
      const updateFn = type === 'product' ? updateProductCategory : updateServiceCategory;
      await updateFn(selectedCategory.id, formData);
      
      toast({
        title: 'Успех',
        description: 'Категория успешно обновлена',
      });
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить категорию',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: 'product' | 'service') => {
    if (!selectedCategory) return;
    
    try {
      setIsSubmitting(true);
      
      const deleteFn = type === 'product' ? deleteProductCategory : deleteServiceCategory;
      await deleteFn(selectedCategory.id);
      
      toast({
        title: 'Успех',
        description: 'Категория успешно удалена',
      });
      
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить категорию',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      value: category.value,
      name: category.name,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const getCurrentLanguageName = (category: Category) => {
    return category.name[i18n.language as 'ru' | 'en' | 'uz'] || category.name.ru;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Управление категориями</h1>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="products">Категории товаров</TabsTrigger>
          <TabsTrigger value="services">Категории услуг</TabsTrigger>
        </TabsList>

        {/* Product Categories Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить категорию товара
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Добавить категорию товара</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={() => handleAdd('product')}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список категорий товаров</CardTitle>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <CategoryTableSkeleton />
              ) : (
                <CategoryTable
                  categories={productCategories}
                  getCurrentLanguageName={getCurrentLanguageName}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Categories Tab */}
        <TabsContent value="services" className="space-y-4">
          {/* Аналогично для услуг */}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={() => handleEdit('product')}
            isSubmitting={isSubmitting}
            isEdit
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить категорию "{selectedCategory?.name.ru}"?
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete('product')}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
```

### 6.2 Компонент формы CategoryForm

```typescript
interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

const CategoryForm = ({ formData, setFormData, onSubmit, isSubmitting, isEdit }: CategoryFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="value">Значение (slug) *</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder="medical-equipment"
          disabled={isEdit} // Value не редактируется после создания
          required
        />
        <p className="text-sm text-muted-foreground">
          Уникальный идентификатор категории (используется в URL и базе данных)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name-ru">Название (RU) *</Label>
          <Input
            id="name-ru"
            value={formData.name.ru}
            onChange={(e) => setFormData({
              ...formData,
              name: { ...formData.name, ru: e.target.value }
            })}
            placeholder="Медицинское оборудование"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name-en">Название (EN) *</Label>
          <Input
            id="name-en"
            value={formData.name.en}
            onChange={(e) => setFormData({
              ...formData,
              name: { ...formData.name, en: e.target.value }
            })}
            placeholder="Medical Equipment"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name-uz">Название (UZ) *</Label>
          <Input
            id="name-uz"
            value={formData.name.uz}
            onChange={(e) => setFormData({
              ...formData,
              name: { ...formData.name, uz: e.target.value }
            })}
            placeholder="Tibbiy asbob-uskunalar"
            required
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Сохранение...' : isEdit ? 'Обновить' : 'Добавить'}
      </Button>
    </div>
  );
};
```

### 6.3 Таблица категорий

```typescript
interface CategoryTableProps {
  categories: Category[];
  getCurrentLanguageName: (category: Category) => string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryTable = ({ categories, getCurrentLanguageName, onEdit, onDelete }: CategoryTableProps) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Категории не найдены</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Значение</TableHead>
          <TableHead>Название</TableHead>
          <TableHead>Создано</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-mono text-sm">{category.value}</TableCell>
            <TableCell>{getCurrentLanguageName(category)}</TableCell>
            <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(category)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const CategoryTableSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);
```

## 7. Бизнес-логика

### 7.1 Валидация

```typescript
export const validateCategory = (data: CategoryFormData): string[] => {
  const errors: string[] = [];

  // Проверка value
  if (!data.value || data.value.trim().length === 0) {
    errors.push('Значение (slug) обязательно для заполнения');
  } else if (!/^[a-z0-9-]+$/.test(data.value)) {
    errors.push('Значение может содержать только латинские буквы в нижнем регистре, цифры и дефисы');
  } else if (data.value.length < 2 || data.value.length > 50) {
    errors.push('Длина значения должна быть от 2 до 50 символов');
  }

  // Проверка названий на всех языках
  if (!data.name.ru || data.name.ru.trim().length === 0) {
    errors.push('Название на русском языке обязательно');
  }
  if (!data.name.en || data.name.en.trim().length === 0) {
    errors.push('Название на английском языке обязательно');
  }
  if (!data.name.uz || data.name.uz.trim().length === 0) {
    errors.push('Название на узбекском языке обязательно');
  }

  // Проверка длины названий
  Object.entries(data.name).forEach(([lang, name]) => {
    if (name && (name.length < 2 || name.length > 100)) {
      errors.push(`Длина названия (${lang}) должна быть от 2 до 100 символов`);
    }
  });

  return errors;
};
```

### 7.2 Правила работы с категориями

1. **Создание категории:**
   - Все поля обязательны (value, name.ru, name.en, name.uz)
   - Value должен быть уникальным в пределах типа категории
   - Value не может быть изменен после создания
   - Автоматически заполняется created_by текущим пользователем

2. **Редактирование категории:**
   - Можно изменять только названия (name)
   - Value остается неизменным
   - updated_at обновляется автоматически

3. **Удаление категории:**
   - Нельзя удалить категорию, которая используется в товарах/услугах
   - Проверка выполняется на клиенте и на сервере
   - При попытке удаления используемой категории показывается предупреждение с количеством связанных элементов

4. **Автоматическая slug генерация (опционально):**
   ```typescript
   const generateSlug = (text: string): string => {
     return text
       .toLowerCase()
       .replace(/[^\w\s-]/g, '') // Удаляем спецсимволы
       .replace(/\s+/g, '-') // Пробелы в дефисы
       .replace(/-+/g, '-') // Множественные дефисы в один
       .trim();
   };
   ```

## 8. Права доступа по ролям

### Матрица прав доступа

| Роль | Просмотр | Создание | Редактирование | Удаление |
|------|----------|----------|----------------|----------|
| **Public** | ✅ Все активные | ❌ | ❌ | ❌ |
| **User** | ✅ Все активные | ❌ | ❌ | ❌ |
| **Observer** | ✅ Все | ❌ | ❌ | ❌ |
| **Accountant** | ✅ Все | ❌ | ❌ | ❌ |
| **Engineer** | ✅ Все | ❌ | ❌ | ❌ |
| **Salesperson** | ✅ Все | ❌ | ❌ | ❌ |
| **Sales Manager** | ✅ Все | ✅ | ✅ | ✅ (без использования) |
| **Admin** | ✅ Все | ✅ | ✅ | ✅ (без использования) |
| **Director** | ✅ Все | ✅ | ✅ | ✅ (принудительно) |

### Дополнительные правила

- **Director** может удалить категорию принудительно (с переназначением товаров/услуг на другую категорию)
- **Sales Manager** и **Admin** видят предупреждение при попытке удаления используемой категории
- Все сотрудники видят все категории для использования при создании товаров/услуг
- Публичный доступ к категориям необходим для отображения на сайте (каталог, фильтры)

## 9. UI/UX требования

### 9.1 Цветовая схема (HSL)

```css
/* index.css - добавить переменные для категорий */
:root {
  --category-bg: 210 40% 98%;
  --category-border: 214 32% 91%;
  --category-hover: 210 40% 96%;
  --category-active: 221 83% 53%;
  --category-text: 222 47% 11%;
  --category-muted: 215 16% 47%;
}

.dark {
  --category-bg: 222 47% 11%;
  --category-border: 217 33% 17%;
  --category-hover: 217 33% 15%;
  --category-active: 217 91% 60%;
  --category-text: 210 40% 98%;
  --category-muted: 215 20% 65%;
}
```

### 9.2 Дизайн элементов

1. **Карточка категории:**
   ```typescript
   <div className="p-4 rounded-lg border border-category-border bg-category-bg hover:bg-category-hover transition-colors">
     <div className="flex items-center justify-between">
       <div>
         <p className="font-medium text-category-text">{name}</p>
         <p className="text-sm text-category-muted">{value}</p>
       </div>
       <div className="flex gap-2">
         {/* Actions */}
       </div>
     </div>
   </div>
   ```

2. **Бейдж с количеством использований:**
   ```typescript
   <Badge variant="secondary" className="text-xs">
     {usageCount} товаров
   </Badge>
   ```

3. **Индикаторы состояния:**
   - Используемая категория: Badge с зеленым цветом
   - Неиспользуемая категория: Badge с серым цветом
   - Недавно созданная (< 7 дней): Badge "NEW" с синим цветом

### 9.3 Адаптивность

```css
/* Сетка категорий */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
```

### 9.4 Интерактивность

1. **Скелетоны загрузки:**
   - Показывать 5 строк скелетонов при загрузке таблицы
   - Анимация пульсации

2. **Toast уведомления:**
   - Успешное создание: "Категория успешно создана"
   - Успешное обновление: "Категория обновлена"
   - Успешное удаление: "Категория удалена"
   - Ошибка: Конкретное сообщение об ошибке

3. **Подтверждение удаления:**
   - AlertDialog с названием категории
   - Предупреждение о невозможности отмены
   - Если категория используется - показать количество связанных элементов

4. **Real-time обновления:**
   - Автоматическое обновление списка при изменениях другими пользователями
   - Подписка на изменения через Supabase Realtime

## 10. Валидация и безопасность

### 10.1 Client-side валидация (Zod)

```typescript
import { z } from 'zod';

export const categorySchema = z.object({
  value: z
    .string()
    .min(2, 'Минимум 2 символа')
    .max(50, 'Максимум 50 символов')
    .regex(/^[a-z0-9-]+$/, 'Только латинские буквы в нижнем регистре, цифры и дефисы'),
  name: z.object({
    ru: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
    en: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
    uz: z.string().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  }),
});

export type CategorySchemaType = z.infer<typeof categorySchema>;
```

### 10.2 Server-side безопасность

1. **RLS политики:**
   - Публичный SELECT для всех
   - INSERT/UPDATE/DELETE только для менеджеров и выше
   - Автоматическая установка created_by

2. **SQL Injection защита:**
   - Использование параметризованных запросов
   - Валидация типов данных

3. **XSS защита:**
   - Санитизация HTML в названиях категорий
   - Экранирование специальных символов

4. **CSRF защита:**
   - Использование Supabase JWT токенов
   - Проверка аутентификации на каждом запросе

## 11. Производительность

### 11.1 Оптимизация запросов

```sql
-- Индексы для быстрого поиска
CREATE INDEX CONCURRENTLY idx_product_categories_value ON product_categories(value);
CREATE INDEX CONCURRENTLY idx_product_categories_name_ru ON product_categories((name->>'ru'));
CREATE INDEX CONCURRENTLY idx_products_category ON products(category) WHERE archived = false;

-- Материализованное представление для статистики (опционально)
CREATE MATERIALIZED VIEW category_usage_summary AS
SELECT 
  pc.id,
  pc.value,
  pc.name,
  COUNT(p.id) as products_count,
  MAX(p.updated_at) as last_used_at
FROM product_categories pc
LEFT JOIN products p ON p.category = pc.value AND p.archived = false
GROUP BY pc.id, pc.value, pc.name;

CREATE UNIQUE INDEX ON category_usage_summary(id);

-- Функция для обновления представления
CREATE OR REPLACE FUNCTION refresh_category_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY category_usage_summary;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Client-side оптимизация

```typescript
// React Query для кеширования
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useCategoriesQuery = (type: CategoryType) => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', type],
    queryFn: () => fetchCategories(type),
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
  });

  const addMutation = useMutation({
    mutationFn: (data: CategoryFormData) => addCategory(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories', type]);
    },
  });

  return {
    ...categoriesQuery,
    addCategory: addMutation.mutateAsync,
  };
};
```

### 11.3 Debouncing для поиска

```typescript
import { useMemo, useState } from 'react';
import { debounce } from 'lodash';

const [searchTerm, setSearchTerm] = useState('');

const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    // Выполнить поиск
  }, 300),
  []
);
```

## 12. Дополнительные функции

### 12.1 Экспорт категорий в CSV

```typescript
export const exportCategoriesToCSV = (categories: Category[]) => {
  const headers = ['ID', 'Value', 'Name (RU)', 'Name (EN)', 'Name (UZ)', 'Created At'];
  const rows = categories.map(cat => [
    cat.id,
    cat.value,
    cat.name.ru,
    cat.name.en,
    cat.name.uz,
    new Date(cat.created_at).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `categories_${new Date().toISOString()}.csv`;
  link.click();
};
```

### 12.2 Импорт категорий из CSV

```typescript
export const importCategoriesFromCSV = async (file: File, type: CategoryType) => {
  return new Promise<Category[]>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').slice(1); // Пропускаем заголовок
        
        const categories: CategoryFormData[] = lines
          .filter(line => line.trim())
          .map(line => {
            const [, value, nameRu, nameEn, nameUz] = line.split(',').map(s => s.trim().replace(/"/g, ''));
            return {
              value,
              name: { ru: nameRu, en: nameEn, uz: nameUz }
            };
          });

        // Валидация и импорт
        const results: Category[] = [];
        for (const cat of categories) {
          const errors = validateCategory(cat);
          if (errors.length === 0) {
            const result = await addCategory(type, cat);
            results.push(result);
          }
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsText(file);
  });
};
```

### 12.3 Массовое переназначение категории

```typescript
// Функция для переназначения товаров/услуг с одной категории на другую
export const reassignCategory = async (
  fromCategoryValue: string,
  toCategoryValue: string,
  type: CategoryType
) => {
  const tableName = type === 'product' ? 'products' : 'services';
  
  const { error } = await supabase
    .from(tableName)
    .update({ category: toCategoryValue })
    .eq('category', fromCategoryValue);

  if (error) throw error;
  
  return true;
};
```

## 13. Тестирование

### 13.1 Unit тесты

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { validateCategory } from './categoryValidation';

describe('Category Validation', () => {
  it('should validate correct category data', () => {
    const data = {
      value: 'medical-equipment',
      name: {
        ru: 'Медицинское оборудование',
        en: 'Medical Equipment',
        uz: 'Tibbiy asbob-uskunalar'
      }
    };
    
    const errors = validateCategory(data);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid value format', () => {
    const data = {
      value: 'Medical Equipment!', // Недопустимые символы
      name: { ru: 'Test', en: 'Test', uz: 'Test' }
    };
    
    const errors = validateCategory(data);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should require all language names', () => {
    const data = {
      value: 'test',
      name: { ru: 'Тест', en: '', uz: '' } // Пустые en и uz
    };
    
    const errors = validateCategory(data);
    expect(errors).toContain(expect.stringContaining('английском'));
    expect(errors).toContain(expect.stringContaining('узбекском'));
  });
});
```

### 13.2 E2E тесты

```typescript
import { test, expect } from '@playwright/test';

test.describe('Categories Management', () => {
  test('should create new category', async ({ page }) => {
    await page.goto('/admin/categories');
    
    await page.click('text=Добавить категорию товара');
    await page.fill('#value', 'test-category');
    await page.fill('#name-ru', 'Тестовая категория');
    await page.fill('#name-en', 'Test Category');
    await page.fill('#name-uz', 'Test kategoriyasi');
    await page.click('text=Добавить');
    
    await expect(page.locator('text=Категория успешно добавлена')).toBeVisible();
  });

  test('should prevent deleting used category', async ({ page }) => {
    await page.goto('/admin/categories');
    
    // Попытаться удалить используемую категорию
    await page.click('[data-category-id="used-category"] button[aria-label="Delete"]');
    await page.click('text=Удалить');
    
    await expect(page.locator('text=которая используется')).toBeVisible();
  });
});
```

---

## 14. Краткий промпт для AI

```
Создай систему управления категориями товаров/услуг с:

БАЗА ДАННЫХ:
- Таблицы: product_categories, service_categories
- Поля: id, value (slug), name (JSONB с ru/en/uz), timestamps, created_by
- RLS: публичный SELECT, INSERT/UPDATE/DELETE для managers+
- Функции: check_category_usage, safe_delete_category
- Триггер: validate_product_category_change

FRONTEND:
- Hook: useCategories(type) с CRUD операциями
- Компоненты: Categories.tsx, CategoryForm, CategoryTable
- Tabs для product/service категорий
- Real-time обновления через Supabase

ФУНКЦИОНАЛ:
- Создание/редактирование/удаление категорий
- Многоязычность (ru, en, uz)
- Проверка использования перед удалением
- Value не редактируется после создания
- Автоматическая валидация slug формата

ПРАВА:
- Public: view only
- Sales Manager+: full CRUD
- Director: принудительное удаление

UI:
- Таблица с сортировкой
- Диалоги создания/редактирования
- Подтверждение удаления
- Toast уведомления
- Skeleton loading

ВАЛИДАЦИЯ:
- Zod схемы на клиенте
- SQL constraints на сервере
- Value: /^[a-z0-9-]+$/
- Name: 2-100 символов на каждом языке

HSL цвета из semantic tokens, responsive grid, debounced search, экспорт CSV.
```

---

## 15. Примеры данных

### 15.1 Пример категории товара

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "value": "ultrasound-equipment",
  "name": {
    "ru": "Ультразвуковое оборудование",
    "en": "Ultrasound Equipment",
    "uz": "Ultratovush uskunalari"
  },
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z",
  "created_by": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 15.2 Пример категории услуги

```json
{
  "id": "660f9511-f39c-52e5-b827-557766551111",
  "value": "installation-services",
  "name": {
    "ru": "Установка и монтаж",
    "en": "Installation Services",
    "uz": "O'rnatish xizmatlari"
  },
  "created_at": "2025-01-10T13:00:00Z",
  "updated_at": "2025-01-10T13:00:00Z",
  "created_by": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 15.3 Пример результата проверки использования

```json
{
  "is_used": true,
  "usage_count": 15,
  "entity_ids": [
    "770g0622-g49d-63f6-c938-668877662222",
    "880h1733-h59e-74g7-d049-779988773333"
  ]
}
```

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomPermission {
  id: string;
  user_id: string;
  section: string;
  permission_level: 'full_access' | 'view_only' | 'no_access';
  created_at: string;
  updated_at: string;
}

export interface TemporaryEmployee {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

export const ADMIN_SECTIONS = [
  { value: 'dashboard', label: 'Панель управления' },
  { value: 'leads', label: 'Лиды' },
  { value: 'deals', label: 'Сделки' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'products', label: 'Товары' },
  { value: 'services', label: 'Услуги' },
  { value: 'contacts', label: 'Контакты' },
  { value: 'categories', label: 'Категории' },
  { value: 'users', label: 'Сотрудники' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'archive', label: 'Архив' },
] as const;

export const useCustomPermissions = (userId?: string) => {
  const [permissions, setPermissions] = useState<CustomPermission[]>([]);
  const [temporaryEmployee, setTemporaryEmployee] = useState<TemporaryEmployee | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPermissions();
      fetchTemporaryStatus();
    }
  }, [userId]);

  const fetchPermissions = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_custom_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setPermissions((data as CustomPermission[]) || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить права доступа',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemporaryStatus = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('temporary_employees')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setTemporaryEmployee(data);
    } catch (error) {
      console.error('Error fetching temporary status:', error);
    }
  };

  const savePermissions = async (
    fullAccessSections: string[],
    viewOnlySections: string[],
    isTemporary: boolean,
    expiresAt?: Date
  ) => {
    if (!userId) return;

    console.log('Saving permissions:', { fullAccessSections, viewOnlySections, isTemporary, expiresAt });

    try {
      // Удаляем все существующие права
      const { error: deleteError } = await supabase
        .from('employee_custom_permissions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting old permissions:', deleteError);
        throw deleteError;
      }

      // Создаем новые права
      const permissionsToInsert: Omit<CustomPermission, 'id' | 'created_at' | 'updated_at'>[] = [];

      fullAccessSections.forEach(section => {
        permissionsToInsert.push({
          user_id: userId,
          section,
          permission_level: 'full_access',
        });
      });

      viewOnlySections.forEach(section => {
        permissionsToInsert.push({
          user_id: userId,
          section,
          permission_level: 'view_only',
        });
      });

      console.log('Permissions to insert:', permissionsToInsert);

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('employee_custom_permissions')
          .insert(permissionsToInsert);

        if (insertError) {
          console.error('Error inserting permissions:', insertError);
          throw insertError;
        }
      }

      // Управление временным доступом
      if (isTemporary && expiresAt) {
        const { error: tempError } = await supabase
          .from('temporary_employees')
          .upsert({
            user_id: userId,
            expires_at: expiresAt.toISOString(),
            is_active: true,
          }, { onConflict: 'user_id' });

        if (tempError) {
          console.error('Error upserting temporary employee:', tempError);
          throw tempError;
        }
      } else {
        // Удаляем временный доступ если он был
        const { error: deleteError } = await supabase
          .from('temporary_employees')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error('Error deleting temporary employee:', deleteError);
        }
      }

      toast({
        title: 'Успешно',
        description: 'Права доступа сохранены',
      });

      // Обновляем данные после успешного сохранения
      await Promise.all([fetchPermissions(), fetchTemporaryStatus()]);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить права доступа',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deactivateTemporaryEmployee = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('temporary_employees')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Временный доступ деактивирован',
      });

      await fetchTemporaryStatus();
    } catch (error) {
      console.error('Error deactivating temporary employee:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось деактивировать временный доступ',
        variant: 'destructive',
      });
    }
  };

  return {
    permissions,
    temporaryEmployee,
    loading,
    savePermissions,
    deactivateTemporaryEmployee,
    refetch: () => {
      fetchPermissions();
      fetchTemporaryStatus();
    },
  };
};

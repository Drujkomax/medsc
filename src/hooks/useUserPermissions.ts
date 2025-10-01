import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { supabase } from '@/integrations/supabase/client';

type Permission = 
  | 'view_all_leads'
  | 'manage_all_leads'
  | 'assign_leads'
  | 'export_leads'
  | 'import_leads'
  | 'manage_products'
  | 'manage_services'
  | 'manage_contacts'
  | 'manage_users'
  | 'view_activity_logs'
  | 'view_analytics'
  | 'manage_deals'
  | 'manage_tasks'
  | 'manage_categories'
  | 'view_archive'
  | 'view_kanban';

interface UserPermissions {
  [key: string]: boolean;
}

interface CustomPermission {
  section: string;
  permission_level: 'full_access' | 'view_only' | 'no_access';
}

// Маппинг разделов на права доступа
const sectionPermissionMap: Record<string, Permission[]> = {
  'leads': ['view_all_leads', 'manage_all_leads', 'assign_leads'],
  'deals': ['manage_deals'],
  'tasks': ['manage_tasks'],
  'products': ['manage_products'],
  'services': ['manage_services'],
  'contacts': ['manage_contacts'],
  'users': ['manage_users'],
  'analytics': ['view_analytics'],
  'archive': ['view_archive'],
  'categories': ['manage_categories'],
  'dashboard': ['view_activity_logs'],
};

const rolePermissions: Record<string, Permission[]> = {
  'director': [
    // Директор имеет доступ абсолютно ко всему
    'view_all_leads',
    'manage_all_leads',
    'assign_leads',
    'export_leads',
    'import_leads',
    'manage_products',
    'manage_services',
    'manage_contacts',
    'manage_users',
    'view_activity_logs',
    'view_analytics',
    'manage_deals',
    'manage_tasks',
    'manage_categories',
    'view_archive',
    'view_kanban'
  ],
  'sales_manager': [
    // Руководитель имеет доступ ко всему
    'view_all_leads',
    'manage_all_leads',
    'assign_leads',
    'export_leads',
    'import_leads',
    'manage_products',
    'manage_services',
    'manage_contacts',
    'manage_users',
    'view_activity_logs',
    'view_analytics',
    'manage_deals',
    'manage_tasks',
    'manage_categories',
    'view_archive',
    'view_kanban'
  ],
  'admin': [
    // Админ: только задачи, архив, товары, категории, услуги, сделки
    'manage_tasks',
    'view_archive',
    'manage_products',
    'manage_categories',
    'manage_services',
    'manage_deals'
  ],
  'salesperson': [
    // Специалист по продажам: лиды, сделки, задачи, канбан, архив
    'view_all_leads',
    'manage_all_leads',
    'manage_deals',
    'manage_tasks',
    'view_kanban',
    'view_archive'
  ],
  'accountant': [
    // Бухгалтер: сделки, задачи, товары
    'manage_deals',
    'manage_tasks',
    'manage_products'
  ],
  'engineer': [
    // Инженер: сделки, задачи, услуги
    'manage_deals',
    'manage_tasks',
    'manage_services'
  ],
  'observer': [
    // Наблюдатель: только просмотр (без прав на изменение)
    'view_all_leads',
    'view_analytics',
    'view_archive',
    'view_kanban',
    'view_activity_logs'
  ],
  'user': []
};

export const useUserPermissions = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [customPermissions, setCustomPermissions] = useState<CustomPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCustomPermissions();
    }
  }, [user]);

  const fetchCustomPermissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('employee_custom_permissions')
        .select('section, permission_level')
        .eq('user_id', user.id);

      if (error) throw error;
      setCustomPermissions((data as CustomPermission[]) || []);
    } catch (error) {
      console.error('Error fetching custom permissions:', error);
    }
  };

  useEffect(() => {
    if (!roleLoading) {
      if (!user || !role) {
        setPermissions({});
      } else {
        const userPermissions: UserPermissions = {};
        
        // Если есть кастомные права, используем их
        if (customPermissions.length > 0) {
          // Для каждого раздела с кастомными правами
          customPermissions.forEach(customPerm => {
            const sectionPerms = sectionPermissionMap[customPerm.section] || [];
            
            sectionPerms.forEach(perm => {
              if (customPerm.permission_level === 'full_access') {
                userPermissions[perm] = true;
              } else if (customPerm.permission_level === 'view_only') {
                // Для view_only даем только права просмотра
                if (perm.includes('view') || perm.includes('archive')) {
                  userPermissions[perm] = true;
                }
              }
            });
          });
        } else {
          // Используем стандартные права роли
          const rolePerms = rolePermissions[role] || [];
          
          // Устанавливаем все возможные права в false
          Object.values(rolePermissions).flat().forEach(permission => {
            userPermissions[permission] = false;
          });
          
          // Затем устанавливаем права пользователя в true
          rolePerms.forEach(permission => {
            userPermissions[permission] = true;
          });
        }
        
        setPermissions(userPermissions);
      }
      setLoading(false);
    }
  }, [user, role, roleLoading, customPermissions]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions[permission] || false;
  };

  const hasAnyPermission = (permissionList: Permission[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionList: Permission[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    role
  };
};
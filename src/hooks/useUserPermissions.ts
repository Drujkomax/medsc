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
  | 'view_products'
  | 'manage_products'
  | 'view_services'
  | 'manage_services'
  | 'view_contacts'
  | 'manage_contacts'
  | 'manage_users'
  | 'view_activity_logs'
  | 'view_analytics'
  | 'view_deals'
  | 'manage_deals'
  | 'view_tasks'
  | 'manage_tasks'
  | 'view_categories'
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
const sectionPermissionMap: Record<string, { view: Permission[], manage: Permission[] }> = {
  'leads': {
    view: ['view_all_leads'],
    manage: ['view_all_leads', 'manage_all_leads', 'assign_leads']
  },
  'deals': {
    view: ['view_deals'],
    manage: ['view_deals', 'manage_deals']
  },
  'tasks': {
    view: ['view_tasks'],
    manage: ['view_tasks', 'manage_tasks']
  },
  'products': {
    view: ['view_products'],
    manage: ['view_products', 'manage_products']
  },
  'services': {
    view: ['view_services'],
    manage: ['view_services', 'manage_services']
  },
  'contacts': {
    view: ['view_contacts'],
    manage: ['view_contacts', 'manage_contacts']
  },
  'users': {
    view: [],
    manage: ['manage_users']
  },
  'analytics': {
    view: ['view_analytics'],
    manage: ['view_analytics']
  },
  'archive': {
    view: ['view_archive'],
    manage: ['view_archive']
  },
  'categories': {
    view: ['view_categories'],
    manage: ['view_categories', 'manage_categories']
  },
  'dashboard': {
    view: ['view_activity_logs'],
    manage: ['view_activity_logs']
  },
};

const rolePermissions: Record<string, Permission[]> = {
  'director': [
    // Директор имеет доступ абсолютно ко всему
    'view_all_leads',
    'manage_all_leads',
    'assign_leads',
    'export_leads',
    'import_leads',
    'view_products',
    'manage_products',
    'view_services',
    'manage_services',
    'view_contacts',
    'manage_contacts',
    'manage_users',
    'view_activity_logs',
    'view_analytics',
    'view_deals',
    'manage_deals',
    'view_tasks',
    'manage_tasks',
    'view_categories',
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
    'view_products',
    'manage_products',
    'view_services',
    'manage_services',
    'view_contacts',
    'manage_contacts',
    'manage_users',
    'view_activity_logs',
    'view_analytics',
    'view_deals',
    'manage_deals',
    'view_tasks',
    'manage_tasks',
    'view_categories',
    'manage_categories',
    'view_archive',
    'view_kanban'
  ],
  'admin': [
    // Админ: только задачи, архив, товары, категории, услуги, сделки
    'view_tasks',
    'manage_tasks',
    'view_archive',
    'view_products',
    'manage_products',
    'view_categories',
    'manage_categories',
    'view_services',
    'manage_services',
    'view_deals',
    'manage_deals'
  ],
  'salesperson': [
    // Специалист по продажам: лиды, сделки, задачи, канбан, архив
    'view_all_leads',
    'manage_all_leads',
    'view_deals',
    'manage_deals',
    'view_tasks',
    'manage_tasks',
    'view_kanban',
    'view_archive'
  ],
  'accountant': [
    // Бухгалтер: сделки, задачи, товары
    'view_deals',
    'manage_deals',
    'view_tasks',
    'manage_tasks',
    'view_products',
    'manage_products'
  ],
  'engineer': [
    // Инженер: сделки, задачи, услуги
    'view_deals',
    'manage_deals',
    'view_tasks',
    'manage_tasks',
    'view_services',
    'manage_services'
  ],
  'observer': [
    // Наблюдатель: БЕЗ прав по умолчанию - используем только кастомные
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
          // Инициализируем все права как false
          Object.values(rolePermissions).flat().forEach(permission => {
            userPermissions[permission] = false;
          });

          // Получаем список разделов с кастомными настройками
          const configuredSections = customPermissions.map(cp => cp.section);
          
          // Для каждого раздела с кастомными правами
          customPermissions.forEach(customPerm => {
            const sectionPerms = sectionPermissionMap[customPerm.section];
            if (!sectionPerms) return;
            
            if (customPerm.permission_level === 'full_access') {
              // Полный доступ - даем все права (просмотр + управление)
              [...sectionPerms.view, ...sectionPerms.manage].forEach(perm => {
                userPermissions[perm] = true;
              });
            } else if (customPerm.permission_level === 'view_only') {
              // Только просмотр - даем только права на просмотр
              sectionPerms.view.forEach(perm => {
                userPermissions[perm] = true;
              });
            }
            // no_access или отсутствие - права остаются false
          });

          // Важно: разделы, которые не были настроены, остаются недоступными (false)
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
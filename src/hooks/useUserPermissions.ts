import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

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
  'user': []
};

export const useUserPermissions = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading) {
      if (!user || !role) {
        setPermissions({});
      } else {
        const userPermissions: UserPermissions = {};
        const rolePerms = rolePermissions[role] || [];
        
        // Set all possible permissions to false first
        Object.values(rolePermissions).flat().forEach(permission => {
          userPermissions[permission] = false;
        });
        
        // Then set the user's permissions to true
        rolePerms.forEach(permission => {
          userPermissions[permission] = true;
        });
        
        setPermissions(userPermissions);
      }
      setLoading(false);
    }
  }, [user, role, roleLoading]);

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
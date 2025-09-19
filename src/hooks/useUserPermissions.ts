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
  | 'view_analytics';

interface UserPermissions {
  [key: string]: boolean;
}

const rolePermissions: Record<string, Permission[]> = {
  'director': [
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
    'view_analytics'
  ],
  'sales_manager': [
    'view_all_leads',
    'manage_all_leads',
    'assign_leads',
    'export_leads',
    'import_leads',
    'manage_contacts',
    'view_activity_logs'
  ],
  'admin': [
    // Админ управляет системой, но не работает с лидами напрямую
    'manage_products',
    'manage_services',
    'manage_contacts',
    'manage_users',
    'view_activity_logs',
    'view_analytics'
  ],
  'salesperson': [
    'view_all_leads',
    'manage_all_leads'
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
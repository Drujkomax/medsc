import { ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface RoleBasedAccessProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

const RoleBasedAccess = ({ 
  children, 
  permissions = [], 
  roles = [], 
  requireAll = false, 
  fallback = null 
}: RoleBasedAccessProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, role, loading } = useUserPermissions();

  if (loading) {
    return null;
  }

  // Check role-based access
  if (roles.length > 0) {
    const hasRole = roles.includes(role || '');
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions as any)
      : hasAnyPermission(permissions as any);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleBasedAccess;
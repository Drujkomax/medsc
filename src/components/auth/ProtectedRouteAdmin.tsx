import { ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string | string[];
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, permission, fallback = null }: ProtectedRouteProps) => {
  const { hasPermission, hasAnyPermission } = useUserPermissions();
  
  if (permission) {
    // Если передан массив прав, проверяем наличие хотя бы одного
    if (Array.isArray(permission)) {
      if (!hasAnyPermission(permission as any[])) {
        return <>{fallback}</>;
      }
    } else {
      // Если передано одно право, проверяем его
      if (!hasPermission(permission as any)) {
        return <>{fallback}</>;
      }
    }
  }
  
  return <>{children}</>;
};
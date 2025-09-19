import { ReactNode } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, permission, fallback = null }: ProtectedRouteProps) => {
  const { hasPermission } = useUserPermissions();
  
  if (permission && !hasPermission(permission as any)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
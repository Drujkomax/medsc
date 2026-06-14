"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const RequireAuth = ({ children, requiredRole = 'user' }: RequireAuthProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      // Избегаем бесконечного редиректа - не перенаправляем если уже на админской странице
      if (pathname.startsWith('/admin')) {
        return;
      }

      if (!user) {
        router.replace('/admin');
        return;
      }

      if (requiredRole === 'admin' && role !== 'admin') {
        router.replace('/admin');
        return;
      }
    }
  }, [user, role, authLoading, roleLoading, router, requiredRole, pathname]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (requiredRole === 'admin' && role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
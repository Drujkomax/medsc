"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Если пользователь не авторизован - перенаправляем на страницу входа.
  // location.state не существует в Next: исходный путь (location.pathname + search)
  // передаём через query-параметр ?from=... вместо navigate(..., { state: { from } }).
  const isUnauthorized = !authLoading && !roleLoading && !user;
  useEffect(() => {
    if (isUnauthorized) {
      const search = searchParams.toString();
      const from = `${pathname}${search ? `?${search}` : ''}`;
      router.replace(`${redirectTo}?from=${encodeURIComponent(from)}`);
    }
  }, [isUnauthorized, redirectTo, pathname, searchParams, router]);

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если пользователь не авторизован - редирект выполняется в useEffect выше
  if (!user) {
    return null;
  }

  // Если указаны требуемые роли и у пользователя их нет - показываем ошибку доступа
  if (requiredRoles.length > 0 && !requiredRoles.includes(role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-4">
            У вас нет прав для доступа к этой странице.
          </p>
          <p className="text-sm text-gray-500">
            Ваша роль: {role || 'не определена'}
          </p>
          <p className="text-sm text-gray-500">
            Требуемые роли: {requiredRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
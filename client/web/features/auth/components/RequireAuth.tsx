import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const RequireAuth = ({ children, requiredRole = 'user' }: RequireAuthProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      // Избегаем бесконечного редиректа - не перенаправляем если уже на админской странице
      if (location.pathname.startsWith('/admin')) {
        return;
      }

      if (!user) {
        navigate('/admin', { replace: true });
        return;
      }

      if (requiredRole === 'admin' && role !== 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
    }
  }, [user, role, authLoading, roleLoading, navigate, requiredRole, location.pathname]);

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
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (requiredRole === 'admin' && role !== 'admin') {
        navigate('/auth');
        return;
      }
    }
  }, [user, role, authLoading, roleLoading, navigate, requiredRole]);

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
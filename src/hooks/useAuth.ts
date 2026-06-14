import { useAuthContext } from '@/providers/AuthProvider';

// Thin reader over the shared AuthProvider — same shape as before, but the
// session is resolved once for the whole app instead of per-component.
export const useAuth = () => {
  const { user, session, authLoading, signOut } = useAuthContext();
  return { user, session, loading: authLoading, signOut };
};

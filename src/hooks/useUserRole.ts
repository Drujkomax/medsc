import { useAuthContext } from '@/providers/AuthProvider';

// Thin reader over the shared AuthProvider — role is resolved once (one
// get_user_role RPC) instead of per-component.
export const useUserRole = () => {
  const { role, roleLoading } = useAuthContext();
  return { role, loading: roleLoading };
};

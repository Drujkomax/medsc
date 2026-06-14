import { useAuthContext, type Permission } from '@/providers/AuthProvider';

// Thin reader over the shared AuthProvider. The role/custom-permission queries
// and the effective-permission computation now happen ONCE in the provider; this
// hook just exposes the result plus the same helper predicates as before.
export type { Permission };

export const useUserPermissions = () => {
  const { permissions, role, permsLoading } = useAuthContext();

  const hasPermission = (permission: Permission): boolean => permissions[permission] || false;

  const hasAnyPermission = (permissionList: Permission[]): boolean =>
    permissionList.some((permission) => hasPermission(permission));

  const hasAllPermissions = (permissionList: Permission[]): boolean =>
    permissionList.every((permission) => hasPermission(permission));

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading: permsLoading,
    role,
  };
};

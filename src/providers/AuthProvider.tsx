import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// One shared auth/role/permissions resolver for the whole SPA.
//
// Before this provider, useAuth/useUserRole/useUserPermissions were plain hooks
// re-instantiated 4-6x per page open. Each useAuth ran BOTH onAuthStateChange
// and getSession (→ 2× GET /auth/me), so a single admin open fired ~8 redundant
// /auth/me round-trips plus duplicate role/permission queries, all racing before
// first paint ("navbar first, then the rest"). Resolving once here collapses that
// to a single session subscription + one role RPC + one custom-permissions query.

export type Permission =
  | 'view_all_leads'
  | 'manage_all_leads'
  | 'assign_leads'
  | 'export_leads'
  | 'import_leads'
  | 'view_products'
  | 'manage_products'
  | 'view_services'
  | 'manage_services'
  | 'view_contacts'
  | 'manage_contacts'
  | 'manage_users'
  | 'view_activity_logs'
  | 'view_analytics'
  | 'view_deals'
  | 'manage_deals'
  | 'view_tasks'
  | 'manage_tasks'
  | 'view_categories'
  | 'manage_categories'
  | 'view_archive'
  | 'view_kanban';

export interface UserPermissions {
  [key: string]: boolean;
}

interface CustomPermission {
  section: string;
  permission_level: 'full_access' | 'view_only' | 'no_access';
}

// Маппинг разделов на права доступа
const sectionPermissionMap: Record<string, { view: Permission[]; manage: Permission[] }> = {
  leads: { view: ['view_all_leads'], manage: ['view_all_leads', 'manage_all_leads', 'assign_leads'] },
  deals: { view: ['view_deals'], manage: ['view_deals', 'manage_deals'] },
  tasks: { view: ['view_tasks'], manage: ['view_tasks', 'manage_tasks'] },
  products: { view: ['view_products'], manage: ['view_products', 'manage_products'] },
  services: { view: ['view_services'], manage: ['view_services', 'manage_services'] },
  contacts: { view: ['view_contacts'], manage: ['view_contacts', 'manage_contacts'] },
  users: { view: [], manage: ['manage_users'] },
  analytics: { view: ['view_analytics'], manage: ['view_analytics'] },
  archive: { view: ['view_archive'], manage: ['view_archive'] },
  categories: { view: ['view_categories'], manage: ['view_categories', 'manage_categories'] },
  dashboard: { view: ['view_activity_logs'], manage: ['view_activity_logs'] },
};

const rolePermissions: Record<string, Permission[]> = {
  director: [
    'view_all_leads', 'manage_all_leads', 'assign_leads', 'export_leads', 'import_leads',
    'view_products', 'manage_products', 'view_services', 'manage_services',
    'view_contacts', 'manage_contacts', 'manage_users', 'view_activity_logs',
    'view_analytics', 'view_deals', 'manage_deals', 'view_tasks', 'manage_tasks',
    'view_categories', 'manage_categories', 'view_archive', 'view_kanban',
  ],
  sales_manager: [
    'view_all_leads', 'manage_all_leads', 'assign_leads', 'export_leads', 'import_leads',
    'view_products', 'manage_products', 'view_services', 'manage_services',
    'view_contacts', 'manage_contacts', 'manage_users',
    'view_analytics', 'view_deals', 'manage_deals', 'view_tasks', 'manage_tasks',
    'view_categories', 'manage_categories', 'view_archive', 'view_kanban',
  ],
  admin: [
    'view_tasks', 'manage_tasks', 'view_archive', 'view_products', 'manage_products',
    'view_categories', 'manage_categories', 'view_services', 'manage_services',
    'view_deals', 'manage_deals',
  ],
  salesperson: [
    'view_all_leads', 'manage_all_leads', 'view_deals', 'manage_deals',
    'view_tasks', 'manage_tasks', 'view_kanban', 'view_archive',
  ],
  accountant: [
    'view_all_leads', 'view_deals', 'manage_deals', 'view_tasks', 'manage_tasks',
    'view_products', 'manage_products',
  ],
  engineer: [
    'view_deals', 'manage_deals', 'view_tasks', 'manage_tasks', 'view_services', 'manage_services',
  ],
  observer: ['view_archive', 'view_products', 'view_categories'],
  user: [],
};

function computePermissions(role: string | null, customPermissions: CustomPermission[]): UserPermissions {
  if (!role) return {};
  const userPermissions: UserPermissions = {};
  // Все возможные права в false
  Object.values(rolePermissions).flat().forEach((p) => {
    userPermissions[p] = false;
  });
  // Базовые права роли
  (rolePermissions[role] || []).forEach((p) => {
    userPermissions[p] = true;
  });
  // Кастомные права ДОПОЛНЯЮТ базовые
  if (customPermissions.length > 0) {
    customPermissions.forEach((cp) => {
      const sp = sectionPermissionMap[cp.section];
      if (!sp) return;
      if (cp.permission_level === 'full_access') {
        [...sp.view, ...sp.manage].forEach((p) => (userPermissions[p] = true));
      } else if (cp.permission_level === 'view_only') {
        sp.view.forEach((p) => (userPermissions[p] = true));
      } else if (cp.permission_level === 'no_access') {
        [...sp.view, ...sp.manage].forEach((p) => (userPermissions[p] = false));
      }
    });
  }
  return userPermissions;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  signOut: () => Promise<void>;
  role: string | null;
  roleLoading: boolean;
  permissions: UserPermissions;
  permsLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [customPermissions, setCustomPermissions] = useState<CustomPermission[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [permsLoading, setPermsLoading] = useState(true);

  // 1) Session — ONE subscription handles INITIAL_SESSION, SIGNED_IN, SIGNED_OUT
  //    (one GET /auth/me total instead of ~8).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    if (error && !error.message?.toLowerCase().includes('session')) throw error;
  };

  // 2) Role — once per user
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setRole(null);
        setRoleLoading(false);
        return;
      }
      setRoleLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_user_role', { _user_id: user.id });
        if (!active) return;
        if (error) {
          console.error('Error fetching user role via RPC:', error);
          setRole(null);
        } else {
          setRole((data as string) ?? null);
        }
      } catch (e) {
        if (active) {
          console.error('Error fetching user role:', e);
          setRole(null);
        }
      } finally {
        if (active) setRoleLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // 3) Custom permissions — once per user
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        setCustomPermissions([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('employee_custom_permissions')
          .select('section, permission_level')
          .eq('user_id', user.id);
        if (error) throw error;
        if (active) setCustomPermissions((data as CustomPermission[]) || []);
      } catch (e) {
        console.error('Error fetching custom permissions:', e);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  // 4) Compute effective permissions (role base + custom overrides)
  useEffect(() => {
    if (roleLoading) return;
    if (!user || !role) {
      setPermissions({});
    } else {
      setPermissions(computePermissions(role, customPermissions));
    }
    setPermsLoading(false);
  }, [user, role, roleLoading, customPermissions]);

  const value: AuthContextValue = {
    user,
    session,
    authLoading,
    signOut,
    role,
    roleLoading,
    permissions,
    permsLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}

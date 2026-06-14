"use client";
// Next admin shell: providers + auth guard, ported from web's App providers +
// AdminWrapper. The admin is client-only (auth reads localStorage), so a mounted
// gate keeps SSR to a neutral spinner (no localStorage on the server); the panel
// is noindex + auth-gated so there is nothing to server-render anyway.
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/i18n/config";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/providers/ErrorBoundary";
import PointerEventsGuard from "@/components/providers/PointerEventsGuard";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useResolveInviteRole } from "@/hooks/useResolveInviteRole";
import AdminAuth from "@/features/admin/components/AdminAuth";
import { AdminChrome } from "./admin-chrome";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: { retry: 1 },
  },
});

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Roles allowed into the panel (mirrors AdminWrapper). salesperson/etc. get a
// reduced menu via per-permission gating in the sidebar + ProtectedRoute.
const ALLOWED_ROLES = ["admin", "sales_manager", "director", "salesperson", "accountant", "engineer", "observer"];

function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { resolving } = useResolveInviteRole();

  // Invite-registration + director-registration render without auth.
  const isPublicAdminRoute =
    pathname.includes("/admin/register/") || pathname === "/admin/director-registration";
  if (isPublicAdminRoute) return <>{children}</>;

  if (authLoading || roleLoading) return <Spinner />;
  if (resolving) return <Spinner />;
  if (!user) return <AdminAuth />;
  if (roleLoading || !role) return <Spinner />;
  if (!ALLOWED_ROLES.includes(role)) return <AdminAuth />;

  return <AdminChrome>{children}</AdminChrome>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            <PointerEventsGuard />
            <Toaster />
            <Sonner />
            {mounted ? <AdminGate>{children}</AdminGate> : <Spinner />}
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

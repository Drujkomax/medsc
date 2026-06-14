"use client";
// Admin chrome (ported from web/features/admin/components/AdminLayout.tsx).
// Outlet -> children, useLocation -> usePathname. Design unchanged.
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { getRoleTranslation } from "@/utils/roleTranslations";

export function AdminChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { t, i18n } = useTranslation();
  const { role } = useUserPermissions();

  const navigation = [
    { name: t("admin.dashboard", "Дашборд"), href: "/admin" },
    { name: t("admin.leads", "Лиды"), href: "/admin/leads" },
    { name: t("admin.products", "Товары"), href: "/admin/products" },
    { name: t("admin.services", "Услуги"), href: "/admin/services" },
    { name: t("admin.contacts", "Контакты"), href: "/admin/contacts" },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const currentPageName = navigation.find((nav) => isActive(nav.href))?.name || t("admin.title");

  return (
    <SidebarProvider defaultOpen>
      <div className="theme-admin min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4 md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                    {currentPageName}
                  </h1>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <LanguageSwitcher />
                <Badge variant="secondary">{getRoleTranslation(role, i18n.language)}</Badge>
              </div>

              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

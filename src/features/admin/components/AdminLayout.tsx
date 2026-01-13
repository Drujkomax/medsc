import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/AdminSidebar';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getRoleTranslation } from '@/utils/roleTranslations';

const AdminLayout = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { role } = useUserPermissions();
  
  // Force re-render on language change by using i18n.language as dependency
  const currentLang = i18n.language;
  
  const navigation = [
    { name: t('admin.dashboard'), href: '/admin' },
    { name: t('admin.analytics', 'Аналитика'), href: '/admin/analytics' },
    { name: t('admin.leads', 'Лиды'), href: '/admin/leads' },
    { name: t('admin.products'), href: '/admin/products' },
    { name: t('admin.services', 'Услуги'), href: '/admin/services' },
    { name: t('admin.contacts'), href: '/admin/contacts' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const currentPageName = navigation.find(nav => isActive(nav.href))?.name || t('admin.title');

  return (
    <SidebarProvider defaultOpen>
      <div className="theme-admin min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
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
              
              {/* Desktop-only header items */}
              <div className="hidden md:flex items-center space-x-4">
                <LanguageSwitcher />
                <Badge variant="secondary">
                  {getRoleTranslation(role, i18n.language)}
                </Badge>
              </div>

              {/* Mobile-only header items */}
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
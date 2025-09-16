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
  
  const navigation = [
    { name: t('admin.dashboard'), href: '/admin' },
    { name: 'Аналитика', href: '/admin/analytics' },
    { name: 'Лиды', href: '/admin/leads' },
    { name: t('admin.products'), href: '/admin/products' },
    { name: 'Услуги', href: '/admin/services' },
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
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Premium Header with Glass Effect */}
          <header className="glass-card border-b border-white/10 px-4 py-4 md:px-6 m-3 md:m-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="md:hidden hover-glow p-2 rounded-lg hover:bg-white/10 smooth-transition" />
                <div className="animate-fade-in">
                  <h1 className="text-xl md:text-2xl font-heading gradient-text">
                    {currentPageName}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Добро пожаловать в админскую панель MSC
                  </p>
                </div>
              </div>
              
              {/* Desktop-only header items */}
              <div className="hidden md:flex items-center space-x-4">
                <LanguageSwitcher />
                <Badge 
                  variant="secondary" 
                  className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 text-primary font-medium px-3 py-1"
                >
                  {getRoleTranslation(role, i18n.language)}
                </Badge>
              </div>

              {/* Mobile-only header items */}
              <div className="md:hidden">
                <SidebarTrigger className="hover-glow p-2 rounded-lg hover:bg-white/10 smooth-transition" />
              </div>
            </div>
          </header>

          {/* Main Content with Premium Container */}
          <main className="flex-1 p-3 md:p-4">
            <div className="animate-slide-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
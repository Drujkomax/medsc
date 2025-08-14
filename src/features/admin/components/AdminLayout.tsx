import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import LogoutButton from '@/components/auth/LogoutButton';
import { 
  Users, 
  ShoppingBag, 
  FileText, 
  CheckSquare, 
  BarChart3,
  LogOut,
  Home,
  MessageSquare,
  Settings
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const { t } = useTranslation();
  
  const navigation = [
    { name: t('admin.dashboard'), href: '/admin', icon: BarChart3 },
    { name: 'Лиды', href: '/admin/leads', icon: Users },
    { name: t('admin.products'), href: '/admin/products', icon: ShoppingBag },
    { name: 'Услуги', href: '/admin/services', icon: Settings },
    { name: t('admin.contacts'), href: '/admin/contacts', icon: MessageSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-card border-r border-border">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <span className="font-semibold text-lg">{t('admin.title')}</span>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="absolute bottom-0 w-64 p-6 border-t border-border">
            <div className="space-y-3">
              <Link to="/">
                <Button variant="outline" className="w-full justify-start">
                  <Home className="w-4 h-4 mr-2" />
                  {t('admin.toWebsite')}
                </Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {navigation.find(nav => isActive(nav.href))?.name || t('admin.title')}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Badge variant="secondary">{t('admin.role')}</Badge>
                <div className="text-sm text-muted-foreground">
                  admin
                </div>
              </div>
            </div>
          </header>

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
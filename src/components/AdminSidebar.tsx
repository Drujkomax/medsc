import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import LogoutButton from '@/components/auth/LogoutButton';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import { getRoleTranslation } from '@/utils/roleTranslations';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Users,
  ShoppingBag,
  BarChart3,
  Home,
  MessageSquare,
  Settings,
  Columns3,
  UserCheck,
  HandCoins,
  CheckSquare,
  Archive,
  Tags,
  Factory,
  Warehouse,
  Building2,
  MapPin
} from 'lucide-react';

export function AdminSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { role } = useUserRole();
  const { hasPermission } = useUserPermissions();
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [];

    // Дашборд - доступен только руководителю и директору
    if (hasPermission('view_analytics')) {
      baseItems.push({ name: t('admin.dashboard'), href: '/admin', icon: BarChart3, permission: 'view_analytics' });
    }

    const conditionalItems = [];

    // Лиды - доступны специалистам по продажам, руководителям и директорам
    if (hasPermission('view_all_leads')) {
      conditionalItems.push({ name: t('navigation2.leads'), href: '/admin/leads', icon: Users, permission: 'view_all_leads' });
    }
    
    // Сделки - доступны при наличии любого права на сделки
    if (hasPermission('view_deals')) {
      conditionalItems.push({ name: t('admin.deals'), href: '/admin/deals', icon: HandCoins, permission: 'view_deals' });
    }
    
    // Задачи - доступны при наличии любого права на задачи
    if (hasPermission('view_tasks')) {
      conditionalItems.push({ name: t('admin.tasks'), href: '/admin/tasks', icon: CheckSquare, permission: 'view_tasks' });
    }
    
    // Канбан - доступен только специалистам по продажам, руководителям и директорам
    if (hasPermission('view_kanban')) {
      conditionalItems.push({ name: t('navigation2.kanban'), href: '/admin/kanban', icon: Columns3, permission: 'view_kanban' });
    }

    // Архив - доступен специалистам по продажам, админу, руководителю и директору
    if (hasPermission('view_archive')) {
      conditionalItems.push({ name: t('admin.archive', 'Архив'), href: '/admin/archived', icon: Archive, permission: 'view_archive' });
    }

    // Продукты - доступны при наличии любого права на товары (просмотр или управление)
    if (hasPermission('view_products')) {
      conditionalItems.push({ name: t('admin.products'), href: '/admin/products', icon: ShoppingBag, permission: 'view_products' });
    }
    
    // Категории - доступны при наличии права на категории
    if (hasPermission('view_categories')) {
      conditionalItems.push({ name: t('admin.categories', 'Категории'), href: '/admin/categories', icon: Tags, permission: 'view_categories' });
    }

    // Услуги - доступны при наличии права на услуги
    if (hasPermission('view_services')) {
      conditionalItems.push({ name: t('navigation2.services'), href: '/admin/services', icon: Settings, permission: 'view_services' });
    }

    // Контакты - доступны при наличии права на контакты
    if (hasPermission('view_contacts')) {
      conditionalItems.push({ name: t('admin.contacts'), href: '/admin/contacts', icon: MessageSquare, permission: 'view_contacts' });
    }
    
    // Склад - доступен при наличии права на товары
    if (hasPermission('view_products')) {
      conditionalItems.push({ name: t('admin.warehouse', 'Склад'), href: '/admin/warehouse', icon: Warehouse, permission: 'view_products' });
    }
    
    // Клиники - доступны при наличии права на товары
    if (hasPermission('view_products')) {
      conditionalItems.push({ name: t('admin.clinics', 'Клиники'), href: '/admin/clinics', icon: Building2, permission: 'view_products' });
    }

    // Обход — журнал визитов из Telegram-бота
    conditionalItems.push({ name: t('admin.visits', 'Обход'), href: '/admin/visits', icon: MapPin, permission: 'view_all_leads' });

    // Управление сотрудниками - только при наличии права на управление пользователями
    if (hasPermission('manage_users')) {
      conditionalItems.push({ name: t('navigation2.employees'), href: '/admin/employees', icon: UserCheck, permission: 'manage_users' });
    }

    return [...baseItems, ...conditionalItems];
  };

  const navigation = getNavigationItems();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold">MSC</span>
            </div>
            <span className="font-semibold text-lg">{t('navigation2.adminPanel')}</span>
          </div>
          {user?.email && (
            <div className="text-sm text-muted-foreground pl-10">
              {user.email}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation2.navigation')}</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <Link to="/">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Home className="w-4 h-4 mr-2" />
              {t('admin.toWebsite')}
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
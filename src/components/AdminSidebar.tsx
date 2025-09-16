import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Tags
} from 'lucide-react';

export function AdminSidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { role } = useUserRole();
  const { hasPermission } = useUserPermissions();
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      { name: t('admin.dashboard'), href: '/admin', icon: BarChart3, permission: null },
      { name: t('navigation2.leads'), href: '/admin/leads', icon: Users, permission: null },
      { name: t('admin.deals'), href: '/admin/deals', icon: HandCoins, permission: null },
      { name: t('admin.tasks'), href: '/admin/tasks', icon: CheckSquare, permission: null },
      { name: t('navigation2.kanban'), href: '/admin/kanban', icon: Columns3, permission: null },
      { name: 'Архив', href: '/admin/archived', icon: Archive, permission: null },
    ];

    const conditionalItems = [];

    if (hasPermission('manage_products')) {
      conditionalItems.push({ name: t('admin.products'), href: '/admin/products', icon: ShoppingBag, permission: 'manage_products' });
      conditionalItems.push({ name: 'Категории', href: '/admin/categories', icon: Tags, permission: 'manage_products' });
    }

    if (hasPermission('manage_services')) {
      conditionalItems.push({ name: t('navigation2.services'), href: '/admin/services', icon: Settings, permission: 'manage_services' });
    }

    if (hasPermission('manage_contacts')) {
      conditionalItems.push({ name: t('admin.contacts'), href: '/admin/contacts', icon: MessageSquare, permission: 'manage_contacts' });
    }

    if (role === 'director') {
      conditionalItems.push({ name: t('navigation2.employees'), href: '/admin/employees', icon: Users, permission: null });
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
    <Sidebar className="glass-sidebar">
      <SidebarHeader className="border-b border-white/10 p-6">
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center animate-glow">
              <span className="text-white font-bold text-sm">MSC</span>
            </div>
            <div>
              <span className="font-heading text-lg gradient-text">{t('navigation2.adminPanel')}</span>
              <div className="text-xs text-muted-foreground">Med Service Centre</div>
            </div>
          </div>
          {user?.email && (
            <div className="glass-card rounded-lg p-3">
              <div className="text-sm text-foreground font-medium">
                {user.email}
              </div>
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 text-primary text-xs mt-1"
              >
                {getRoleTranslation(role, i18n.language)}
              </Badge>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-medium mb-3 px-3">
            {t('navigation2.navigation')}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <SidebarMenuItem key={item.href} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium smooth-transition group ${
                          active
                            ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25'
                            : 'text-sidebar-foreground hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'animate-float' : 'group-hover:scale-110 smooth-transition'}`} />
                        <span className="group-hover:translate-x-1 smooth-transition">{item.name}</span>
                        {active && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-glow" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <Link to="/">
            <Button 
              variant="outline" 
              className="w-full justify-start glass-card border-white/20 hover:bg-white/10 smooth-transition group" 
              size="sm"
            >
              <Home className="w-4 h-4 mr-2 group-hover:scale-110 smooth-transition" />
              {t('admin.toWebsite')}
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
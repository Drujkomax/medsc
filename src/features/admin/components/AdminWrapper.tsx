import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import RegisterWithInvite from '@/pages/RegisterWithInvite';
import DirectorRegistration from '@/pages/DirectorRegistration';
import AdminAuth from './AdminAuth';
import AdminLayout from './AdminLayout';
import Dashboard from '../pages/Dashboard';
import Leads from '../../crm/pages/Leads';
import CreateDeal from '../../crm/pages/CreateDeal';
import DealsPage from '../../crm/pages/DealsPage';
import TasksPage from '../../crm/pages/TasksPage';
import AdminKanban from '../pages/AdminKanban';
import AdminProducts from '../../products/pages/AdminProducts';
import AddProduct from '../../products/pages/AddProduct';
import EditProduct from '../../products/pages/EditProduct';
import AdminProductPreview from '../../products/pages/AdminProductPreview';
import ArchivedData from '../pages/ArchivedData';
import AdminServices from '../pages/AdminServices';
import AdminContacts from '../pages/AdminContacts';
import UserManagement from '../pages/UserManagement';
import EmployeeManagement from '../pages/EmployeeManagement';

import Categories from '../pages/Categories';
import { Warehouse } from '../pages/Warehouse';
import Clinics from '../pages/Clinics';
import VisitsPage from '../pages/VisitsPage';
import { useResolveInviteRole } from '@/hooks/useResolveInviteRole';
import { ProtectedRoute } from '@/components/auth/ProtectedRouteAdmin';

const AdminWrapper = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { resolving } = useResolveInviteRole();

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Показываем страницы регистрации без проверки авторизации
  const currentPath = window.location.pathname;
  if (currentPath.includes('/admin/register/') || currentPath === '/admin/director-registration') {
    return (
      <Routes>
        <Route path="register/:inviteId" element={<RegisterWithInvite />} />
        <Route path="director-registration" element={<DirectorRegistration />} />
      </Routes>
    );
  }

  // Если сейчас пробуем автоматически назначить роль из приглашения — показываем спиннер
  if (resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если пользователь не авторизован или не имеет административных прав - показываем форму входа
  // Only director, admin, and sales_manager can access admin panel
  // salesperson has limited access only to assigned leads/deals through different interface
  const allowedRoles = ['admin', 'sales_manager', 'director', 'salesperson', 'accountant', 'engineer', 'observer'];
  console.info('[AdminWrapper] auth resolved:', { user: !!user, role });

  // Нет пользователя — показываем форму входа
  if (!user) {
    console.warn('[AdminWrapper] No user, showing AdminAuth');
    return <AdminAuth />;
  }

  // Пользователь есть, но роль ещё не определена — ждём, чтобы не "отбрасывать" на логин
  if (roleLoading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Роль определена, но нет доступа — форма входа
  if (!allowedRoles.includes(role)) {
    console.warn('[AdminWrapper] Access denied for role', { role });
    return <AdminAuth />;
  }

  // Если авторизован и админ - показываем админскую панель
  console.info('[AdminWrapper] Authorized, rendering admin routes');
  return (
    <Routes>
      <Route path="login" element={<AdminAuth />} />
      <Route path="/*" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* CRM маршруты */}
        <Route path="leads" element={
          <ProtectedRoute permission="view_all_leads" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <Leads />
          </ProtectedRoute>
        } />
        <Route path="deals" element={
          <ProtectedRoute permission={['view_deals', 'manage_deals']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <DealsPage />
          </ProtectedRoute>
        } />
        <Route path="deals/create" element={
          <ProtectedRoute permission="manage_deals" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <CreateDeal />
          </ProtectedRoute>
        } />
        <Route path="tasks" element={
          <ProtectedRoute permission={['view_tasks', 'manage_tasks']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <TasksPage />
          </ProtectedRoute>
        } />
        <Route path="kanban" element={
          <ProtectedRoute permission="view_kanban" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <AdminKanban />
          </ProtectedRoute>
        } />
        
        
        {/* Продукты - просмотр или управление */}
        <Route path="products" element={
          <ProtectedRoute permission={['view_products', 'manage_products']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <AdminProducts />
          </ProtectedRoute>
        } />
        <Route path="products/add" element={
          <ProtectedRoute permission="manage_products" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <AddProduct />
          </ProtectedRoute>
        } />
        <Route path="products/edit/:id" element={
          <ProtectedRoute permission="manage_products" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <EditProduct />
          </ProtectedRoute>
        } />
        <Route path="products/preview/:id" element={
          <ProtectedRoute permission={['view_products', 'manage_products']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <AdminProductPreview />
          </ProtectedRoute>
        } />
        <Route path="categories" element={
          <ProtectedRoute permission={['view_categories', 'manage_categories']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <Categories />
          </ProtectedRoute>
        } />
        
        {/* Услуги */}
        <Route path="services" element={
          <ProtectedRoute permission={['view_services', 'manage_services']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <AdminServices />
          </ProtectedRoute>
        } />
        
        {/* Контакты */}
        <Route path="contacts" element={
          <ProtectedRoute permission={['view_contacts', 'manage_contacts']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <AdminContacts />
          </ProtectedRoute>
        } />
        
        {/* Склад */}
        <Route path="warehouse" element={
          <ProtectedRoute permission={['view_products', 'manage_products']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <Warehouse />
          </ProtectedRoute>
        } />
        
        {/* Клиники */}
        <Route path="clinics" element={
          <ProtectedRoute permission={['view_products', 'manage_products']} fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <Clinics />
          </ProtectedRoute>
        } />

        {/* Обход (визиты из Telegram-бота) */}
        <Route path="visits" element={<VisitsPage />} />
        
        {/* Архив */}
        <Route path="archived" element={
          <ProtectedRoute permission="view_archive" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <ArchivedData />
          </ProtectedRoute>
        } />
        
        {/* Управление сотрудниками - только для директора и руководителя */}
        <Route path="employees" element={
          <ProtectedRoute permission="manage_users" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <EmployeeManagement />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute permission="manage_users" fallback={<div className="p-8 text-center text-muted-foreground">Доступ запрещен</div>}>
            <UserManagement />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

export default AdminWrapper;
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import RegisterWithInvite from '@/pages/RegisterWithInvite';
import DirectorRegistration from '@/pages/DirectorRegistration';
import AdminAuth from './AdminAuth';
import AdminLayout from './AdminLayout';
import Dashboard from '../pages/Dashboard';
import Leads from '../../crm/pages/Leads';
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
import Employees from '../pages/Employees';
import UserManagement from '../pages/UserManagement';
import EmployeeManagement from '../pages/EmployeeManagement';
import Analytics from '../pages/Analytics';
import Categories from '../pages/Categories';

const AdminWrapper = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();


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

  // Если пользователь не авторизован или не имеет административных прав - показываем форму входа
  // Only director, admin, and sales_manager can access admin panel
  // salesperson has limited access only to assigned leads/deals through different interface
  const allowedRoles = ['admin', 'sales_manager', 'director', 'salesperson'];
  if (!user || !allowedRoles.includes(role || '')) {
    return <AdminAuth />;
  }

  // Если авторизован и админ - показываем админскую панель
  return (
    <Routes>
      <Route path="login" element={<AdminAuth />} />
      <Route path="/*" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="tasks" element={<TasksPage />} />
        <Route path="kanban" element={<AdminKanban />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="products/preview/:id" element={<AdminProductPreview />} />
        <Route path="categories" element={<Categories />} />
        <Route path="archived" element={<ArchivedData />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="contacts" element={<AdminContacts />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="users" element={<UserManagement />} />
      </Route>
    </Routes>
  );
};

export default AdminWrapper;
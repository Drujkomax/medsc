import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import AdminAuth from './AdminAuth';
import AdminLayout from './AdminLayout';
import Dashboard from '../pages/Dashboard';
import Leads from '../../crm/pages/Leads';
import AdminProducts from '../../products/pages/AdminProducts';
import AddProduct from '../../products/pages/AddProduct';
import EditProduct from '../../products/pages/EditProduct';
import AdminServices from '../pages/AdminServices';
import AdminContacts from '../pages/AdminContacts';

const AdminWrapper = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Добавляем отладку
  console.log('AdminWrapper state:', { user: !!user, role, authLoading, roleLoading });

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если пользователь не авторизован или не админ - показываем форму входа
  if (!user || role !== 'admin') {
    console.log('Showing AdminAuth because:', { hasUser: !!user, role });
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
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="contacts" element={<AdminContacts />} />
      </Route>
    </Routes>
  );
};

export default AdminWrapper;
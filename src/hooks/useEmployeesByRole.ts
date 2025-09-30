import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export const useEmployeesByRole = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Получаем все профили
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Получаем все роли пользователей
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
          return;
        }

        // Объединяем данные профилей с ролями
        const formattedEmployees = profiles?.map(profile => {
          const userRole = userRoles?.find(role => role.user_id === profile.id);
          return {
            id: profile.id,
            email: profile.email || '',
            full_name: profile.full_name || profile.email || 'Без имени',
            role: userRole?.role || ''
          };
        }).filter(emp => emp.role) || []; // Оставляем только тех, у кого есть роль

        console.log('Loaded employees:', formattedEmployees);
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const getEmployeesByRole = (role: string) => {
    return employees.filter(emp => emp.role === role);
  };

  return {
    employees,
    loading,
    getEmployeesByRole,
    engineers: getEmployeesByRole('engineer'),
    accountants: getEmployeesByRole('accountant'),
    salespersons: getEmployeesByRole('salesperson')
  };
};
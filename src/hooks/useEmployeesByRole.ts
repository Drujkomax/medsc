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
        // Получаем всех сотрудников с их ролями
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            user_roles!inner(role)
          `);

        if (error) {
          console.error('Error fetching employees:', error);
          return;
        }

        // Преобразуем данные в нужный формат
        const formattedEmployees = data?.map(emp => ({
          id: emp.id,
          email: emp.email || '',
          full_name: emp.full_name || emp.email || '',
          role: (emp.user_roles as any)?.[0]?.role || ''
        })) || [];

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
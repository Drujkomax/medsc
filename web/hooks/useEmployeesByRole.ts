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
        // Используем функцию get_employees_with_roles для получения всех сотрудников
        const { data, error } = await supabase.rpc('get_employees_with_roles');

        if (error) {
          console.error('Error fetching employees:', error);
          return;
        }

        const formattedEmployees = data?.map(emp => ({
          id: emp.id,
          email: emp.email || '',
          full_name: emp.full_name || emp.email || 'Без имени',
          role: emp.role
        })) || [];

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
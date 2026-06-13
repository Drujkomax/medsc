import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Edit, Trash2, Activity, Eye } from 'lucide-react';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import ViewEmployeeModal from '@/features/admin/components/ViewEmployeeModal';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { getRoleTranslation } from '@/utils/roleTranslations';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  target_type: string;
  created_at: string;
  user_id: string;
  details: any;
}

const Employees = () => {
  const { t, i18n } = useTranslation();
  const { logActivity } = useActivityLogger();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    email: '',
    password: '',
    role: 'salesperson'
  });

  useEffect(() => {
    fetchEmployees();
    fetchActivityLogs();
    logActivity('page_view', 'admin_page', 'employees', {
      page: '/admin/employees',
      timestamp: new Date().toISOString()
    });
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .in('role', ['salesperson', 'sales_manager', 'admin', 'accountant', 'engineer'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_employee_profiles');

      if (profilesError) throw profilesError;

      const employeesWithProfiles = rolesData?.map(roleItem => {
        const profile = profilesData?.find(p => p.id === roleItem.user_id);
        return {
          id: roleItem.user_id,
          email: profile?.email || t('employees.notSpecified', 'Не указан'),
          full_name: profile?.full_name || profile?.email || t('employees.nameNotSpecified', 'Имя не указано'),
          role: roleItem.role,
          created_at: roleItem.created_at,
          last_sign_in_at: null
        };
      }) || [];

      setEmployees(employeesWithProfiles);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error(t('employees.loadError', 'Ошибка при загрузке сотрудников'));
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const handleAddEmployee = async () => {
    try {
      toast.success(t('employees.createFeatureComingSoon', 'Функция создания сотрудников будет реализована в следующей версии'));
      setIsAddDialogOpen(false);
      setNewEmployeeData({ email: '', password: '', role: 'salesperson' });
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(t('employees.addError', 'Ошибка при добавлении сотрудника'));
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', employeeId);

      if (error) throw error;

      toast.success(t('employees.deleted', 'Сотрудник удален'));
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error(t('employees.deleteError', 'Ошибка при удалении сотрудника'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <RoleBasedAccess roles={['director']}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('employees.title', 'Управление сотрудниками')}</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                {t('employees.addEmployee', 'Добавить сотрудника')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('employees.addNewEmployee', 'Добавить нового сотрудника')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('employees.email', 'Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployeeData.email}
                    onChange={(e) => setNewEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t('employees.password', 'Пароль')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployeeData.password}
                    onChange={(e) => setNewEmployeeData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t('employees.minChars', 'Минимум 6 символов')}
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t('employees.role', 'Роль')}</Label>
                  <Select value={newEmployeeData.role} onValueChange={(value) => setNewEmployeeData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salesperson">{t('roles.salesperson', 'Специалист по продажам')}</SelectItem>
                      <SelectItem value="sales_manager">{t('roles.salesManager', 'Руководитель')}</SelectItem>
                      <SelectItem value="accountant">{t('roles.accountant', 'Бухгалтер')}</SelectItem>
                      <SelectItem value="engineer">{t('roles.engineer', 'Инженер')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEmployee} className="w-full">
                  {t('employees.create', 'Создать сотрудника')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employees List */}
          <Card>
            <CardHeader>
              <CardTitle>{t('employees.list', 'Список сотрудников')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{employee.full_name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {getRoleTranslation(employee.role, i18n.language)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {t('employees.created', 'Создан')}: {new Date(employee.created_at).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz' ? 'uz-UZ' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {employees.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t('employees.notFound', 'Сотрудники не найдены')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>{t('employees.activityLog', 'Журнал активности')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-sm p-2 border-l-2 border-muted">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'uz' ? 'uz-UZ' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      {log.target_type} - {log.user_id}
                    </p>
                  </div>
                ))}
                {activityLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t('employees.noActivityLogs', 'Записи активности не найдены')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <ViewEmployeeModal
          employee={selectedEmployee}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      </div>
    </RoleBasedAccess>
  );
};

export default Employees;
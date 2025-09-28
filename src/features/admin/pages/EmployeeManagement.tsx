import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EditEmployeeModal from '@/features/admin/components/EditEmployeeModal';
import ViewEmployeeModal from '@/features/admin/components/ViewEmployeeModal';
import { getRoleTranslation } from '@/utils/roleTranslations';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck,
  Shield,
  Loader2,
  Edit,
  Eye
} from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role?: string;
  last_sign_in_at?: string;
}

const EmployeeManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    role: 'salesperson'
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const getRoles = () => [
    { value: 'salesperson', label: getRoleTranslation('salesperson', i18n.language), color: 'bg-blue-100 text-blue-800' },
    { value: 'sales_manager', label: getRoleTranslation('sales_manager', i18n.language), color: 'bg-green-100 text-green-800' },
    { value: 'admin', label: getRoleTranslation('admin', i18n.language), color: 'bg-red-100 text-red-800' },
    { value: 'director', label: getRoleTranslation('director', i18n.language), color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Получаем роли пользователей (исключаем директоров)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .neq('role', 'director'); // Исключаем директоров
          
      if (rolesError) throw rolesError;

      // Получаем профили сотрудников
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_employee_profiles');

      if (profilesError) throw profilesError;
      
      // Объединяем роли с профилями
      const employeesList = userRoles?.map(userRole => {
        const profile = profilesData?.find(p => p.id === userRole.user_id);
        return {
          id: userRole.user_id,
          email: profile?.email || 'Не указан',
          full_name: profile?.full_name || profile?.email || 'Имя не указано',
          created_at: userRole.created_at,
          role: userRole.role
        };
      }) || [];
      
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при загрузке сотрудников',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmployee.email || !newEmployee.role) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }
    
    setAddingEmployee(true);
    
    try {
      // Создаем приглашение через нашу функцию
      const { data, error } = await supabase.rpc('create_user_invite', {
        invite_email: newEmployee.email,
        invite_role: newEmployee.role as 'admin' | 'salesperson' | 'sales_manager'
      });

      if (error) throw error;

      const inviteData = data as { invite_id: string };
      const fullLink = `${window.location.origin}/admin/register/${inviteData.invite_id}`;

      toast({
        title: 'Приглашение отправлено',
        description: (
          <span>
            Сотрудник может зарегистрироваться по ссылке: {' '}
            <a href={fullLink} className="underline text-primary" target="_blank" rel="noopener noreferrer">
              {fullLink}
            </a>
          </span>
        ),
        duration: 15000,
      });

      setIsAddEmployeeOpen(false);
      setNewEmployee({ email: '', role: 'salesperson' });
      fetchEmployees();
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при создании приглашения',
        variant: 'destructive',
      });
    } finally {
      setAddingEmployee(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (role?: string) => {
    const roles = getRoles();
    return roles.find(r => r.value === role) || { label: t('roles.notAssigned'), color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Загрузка сотрудников...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            {t('employees.title')}
          </h2>
          <p className="text-muted-foreground">{t('employees.subtitle')}</p>
        </div>
        
        <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('employees.addEmployee')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>{t('employees.addNewEmployee')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('employees.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('employees.emailPlaceholder')}
                  required
                  disabled={addingEmployee}
                />
              </div>
              <div>
                <Label htmlFor="role">{t('employees.roleLabel')}</Label>
                <Select 
                  value={newEmployee.role} 
                  onValueChange={(value) => setNewEmployee(prev => ({ ...prev, role: value }))}
                  disabled={addingEmployee}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {getRoles().map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={addingEmployee}>
                  {addingEmployee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {addingEmployee ? t('employees.adding') : t('employees.addEmployee')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddEmployeeOpen(false)}
                  disabled={addingEmployee}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('employees.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t('employees.filterByRole')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">{t('employees.allRoles')}</SelectItem>
                  {getRoles().map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('employees.employeeStats.total')}</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {getRoles().filter(role => role.value !== 'director').map(role => {
          const count = employees.filter(emp => emp.role === role.value).length;
          return (
            <Card key={role.value}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{role.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Список сотрудников */}
      <div className="grid gap-4">
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('employees.notFound')}</h3>
              <p className="text-muted-foreground text-center">
                {t('employees.notFoundDescription')}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEmployees.map((employee) => {
            const roleInfo = getRoleInfo(employee.role);
            
            return (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{employee.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('employees.addedOn')}: {new Date(employee.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={roleInfo.color}>
                        {roleInfo.label}
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          {t('common.edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {t('common.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Модальные окна */}
      <EditEmployeeModal
        employee={selectedEmployee}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        onUpdate={fetchEmployees}
      />

      <ViewEmployeeModal
        employee={selectedEmployee}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

export default EmployeeManagement;
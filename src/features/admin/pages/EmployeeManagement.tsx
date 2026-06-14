import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EditEmployeeModal from '@/features/admin/components/EditEmployeeModal';
import ViewEmployeeModal from '@/features/admin/components/ViewEmployeeModal';
import { getRoleTranslation } from '@/utils/roleTranslations';
import { ADMIN_SECTIONS } from '@/hooks/useCustomPermissions';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Plus, 
  Search, 
  UserCheck,
  Shield,
  Loader2,
  Edit,
  Eye,
  User,
  CalendarIcon,
  Trash2,
  RotateCcw,
  Ban
} from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role?: string;
  last_sign_in_at?: string;
  is_active?: boolean;
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
    password: '',
    full_name: '',
    role: 'salesperson'
  });
  const [fullAccessSections, setFullAccessSections] = useState<string[]>([]);
  const [viewOnlySections, setViewOnlySections] = useState<string[]>([]);
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [hasAdminAccess, setHasAdminAccess] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const getRoles = () => [
    { value: 'observer', label: getRoleTranslation('observer', i18n.language), color: 'bg-yellow-100 text-yellow-800' },
    { value: 'salesperson', label: getRoleTranslation('salesperson', i18n.language), color: 'bg-blue-100 text-blue-800' },
    { value: 'sales_manager', label: getRoleTranslation('sales_manager', i18n.language), color: 'bg-green-100 text-green-800' },
    { value: 'admin', label: getRoleTranslation('admin', i18n.language), color: 'bg-red-100 text-red-800' },
    { value: 'director', label: getRoleTranslation('director', i18n.language), color: 'bg-purple-100 text-purple-800' },
    { value: 'accountant', label: getRoleTranslation('accountant', i18n.language), color: 'bg-orange-100 text-orange-800' },
    { value: 'engineer', label: getRoleTranslation('engineer', i18n.language), color: 'bg-cyan-100 text-cyan-800' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      // Загружаем ВСЕ роли, включая директоров. Раньше директоров исключали,
      // из-за чего директорский аккаунт «проваливался» в список без роли
      // («Незавершённая регистрация») и его пароль нельзя было сменить.
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');
          
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
          role: userRole.role,
          is_active: profile?.is_active ?? true
        };
      }) || [];

      // Также получаем пользователей без ролей (зависшие регистрации)
      const userIdsWithRoles = userRoles?.map(ur => ur.user_id) || [];
      const usersWithoutRoles = profilesData?.filter(p => !userIdsWithRoles.includes(p.id)).map(profile => ({
        id: profile.id,
        email: profile.email || 'Не указан',
        full_name: profile.full_name || profile.email || 'Имя не указано',
        created_at: new Date().toISOString(),
        role: undefined, // Нет роли
        is_active: profile.is_active ?? true
      })) || [];
      
      setEmployees([...employeesList, ...usersWithoutRoles]);
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

  const toggleFullAccess = (section: string) => {
    setFullAccessSections(prev => {
      const newSections = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      
      if (!prev.includes(section)) {
        setViewOnlySections(v => v.filter(s => s !== section));
      }
      
      return newSections;
    });
  };

  const toggleViewOnly = (section: string) => {
    setViewOnlySections(prev => {
      const newSections = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      
      if (!prev.includes(section)) {
        setFullAccessSections(f => f.filter(s => s !== section));
      }
      
      return newSections;
    });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmployee.email || !newEmployee.password || !newEmployee.role) {
      toast({
        title: 'Ошибка',
        description: 'Заполните email, пароль и роль',
        variant: 'destructive',
      });
      return;
    }

    if (newEmployee.password.length < 6) {
      toast({
        title: 'Ошибка',
        description: 'Пароль должен быть не короче 6 символов',
        variant: 'destructive',
      });
      return;
    }

    setAddingEmployee(true);

    try {
      // Роль зависит от доступа к админке (без доступа — обычный пользователь)
      const finalRole = hasAdminAccess ? newEmployee.role : 'user';

      // Создаём сотрудника напрямую: аккаунт + пароль (bcrypt на сервере),
      // сотрудник может войти сразу.
      const { error } = await supabase.rpc('create_employee', {
        email: newEmployee.email.trim(),
        password: newEmployee.password,
        full_name: newEmployee.full_name?.trim() || null,
        role: finalRole,
      });

      if (error) throw error;

      toast({
        title: 'Сотрудник создан',
        description: `${newEmployee.email} может войти с этим email и паролем`,
      });

      setIsAddEmployeeOpen(false);
      setNewEmployee({ email: '', password: '', full_name: '', role: 'salesperson' });
      setFullAccessSections([]);
      setViewOnlySections([]);
      setIsTemporary(false);
      setExpiresAt(undefined);
      setHasAdminAccess(true);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при создании сотрудника',
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

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    setDeletingEmployee(true);

    try {
      const { error } = await supabase.rpc('delete_employee', { user_id: employeeToDelete.id });
      if (error) throw error;

      toast({
        title: 'Сотрудник деактивирован',
        description: `${employeeToDelete.email} больше не может войти. Данные и история сохранены, доступ можно восстановить.`,
      });

      fetchEmployees();
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    } catch (error: any) {
      console.error('Error deactivating employee:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при деактивации сотрудника',
        variant: 'destructive',
      });
    } finally {
      setDeletingEmployee(false);
    }
  };

  const handleReactivateEmployee = async (employee: Employee) => {
    try {
      const { error } = await supabase.rpc('reactivate_employee', { user_id: employee.id });
      if (error) throw error;
      toast({
        title: 'Доступ восстановлен',
        description: `${employee.email} снова может входить в систему.`,
      });
      fetchEmployees();
    } catch (error: any) {
      console.error('Error reactivating employee:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при восстановлении сотрудника',
        variant: 'destructive',
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (role?: string) => {
    if (!role) {
      return { label: 'Роль не назначена', color: 'bg-gray-100 text-gray-800 border border-amber-400' };
    }
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
          <DialogContent className="bg-background max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('employees.addNewEmployee')}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className={cn(
                "grid w-full",
                (hasAdminAccess && newEmployee.role === 'observer') ? "grid-cols-2" : "grid-cols-1"
              )}>
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Основная информация
                </TabsTrigger>
                {hasAdminAccess && newEmployee.role === 'observer' && (
                  <TabsTrigger value="permissions" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Настройка прав
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="basic">
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
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                      disabled={addingEmployee}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Сотрудник войдёт с этим email и паролем
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="full_name">Имя (необязательно)</Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Иван Иванов"
                      disabled={addingEmployee}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="admin-access">Доступ в панель администрирования</Label>
                      <p className="text-sm text-muted-foreground">
                        Разрешить сотруднику входить в админ-панель
                      </p>
                    </div>
                    <Switch
                      id="admin-access"
                      checked={hasAdminAccess}
                      onCheckedChange={setHasAdminAccess}
                      disabled={addingEmployee}
                    />
                  </div>

                  {hasAdminAccess && (
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
                  )}

                  {!hasAdminAccess && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        💡 Сотрудник будет создан с ролью "Пользователь" без доступа к админ-панели
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={addingEmployee}>
                      {addingEmployee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {addingEmployee ? t('employees.adding') : 'Создать сотрудника'}
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
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                {/* Временный сотрудник */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temporary-access">Временный сотрудник</Label>
                    <Switch
                      id="temporary-access"
                      checked={isTemporary}
                      onCheckedChange={setIsTemporary}
                    />
                  </div>

                  {isTemporary && (
                    <div className="space-y-2">
                      <Label>Срок действия доступа</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !expiresAt && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiresAt ? format(expiresAt, 'dd.MM.yyyy') : 'Выберите дату'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={expiresAt}
                            onSelect={setExpiresAt}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Права доступа */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">Разделы администрирования</h4>
                    <div className="grid gap-3">
                      {ADMIN_SECTIONS.map(section => {
                        const hasFullAccess = fullAccessSections.includes(section.value);
                        const hasViewOnly = viewOnlySections.includes(section.value);
                        
                        return (
                          <div
                            key={section.value}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <span className="text-sm font-medium">{section.label}</span>
                            <div className="flex gap-2">
                              <Badge
                                variant={hasFullAccess ? "default" : "outline"}
                                className={`cursor-pointer transition-all ${
                                  hasFullAccess 
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                                    : 'hover:bg-accent border-muted-foreground/20'
                                }`}
                                onClick={() => toggleFullAccess(section.value)}
                              >
                                Полный доступ
                              </Badge>
                              <Badge
                                variant={hasViewOnly ? "secondary" : "outline"}
                                className={`cursor-pointer transition-all ${
                                  hasViewOnly 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                                    : 'hover:bg-accent border-muted-foreground/20'
                                }`}
                                onClick={() => toggleViewOnly(section.value)}
                              >
                                Только просмотр
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  💡 Права будут применены сразу после регистрации сотрудника по пригласительной ссылке
                </p>
              </TabsContent>
            </Tabs>
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
            const inactive = employee.is_active === false;

            return (
              <Card key={employee.id} className={cn('hover:shadow-md transition-shadow', inactive && 'opacity-60')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{employee.email}</h3>
                        <p className="text-xs text-muted-foreground">
                          {t('employees.addedOn')}: {new Date(employee.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ru-RU')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {inactive && (
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700">
                          Деактивирован
                        </Badge>
                      )}
                      <Badge className={roleInfo.color}>
                        {roleInfo.label}
                      </Badge>

                      <div className="flex gap-2">
                        {/* Просмотр + Изменить доступны для ЛЮБОГО аккаунта,
                            в т.ч. без роли — иначе нельзя сменить ему пароль
                            или назначить роль. */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {t('common.view')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          {t('common.edit')}
                        </Button>
                        {inactive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateEmployee(employee)}
                            className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Восстановить
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee)}
                            className="flex items-center gap-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            <Ban className="w-4 h-4" />
                            Деактивировать
                          </Button>
                        )}
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

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Деактивировать сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToDelete?.email} больше не сможет войти в систему. Все его данные и
              история (клиники, сделки, обходы) сохранятся. Доступ можно восстановить в любой момент.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingEmployee}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEmployee}
              disabled={deletingEmployee}
              className="bg-orange-600 text-white hover:bg-orange-600/90"
            >
              {deletingEmployee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deletingEmployee ? 'Деактивация...' : 'Деактивировать'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeManagement;
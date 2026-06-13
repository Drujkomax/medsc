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
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Eye,
  Settings
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  role?: string;
  last_sign_in_at?: string;
}

const UserManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'salesperson'
  });

  const roles = [
    { value: 'salesperson', label: 'Специалист по продажам', color: 'bg-blue-100 text-blue-800' },
    { value: 'sales_manager', label: 'Руководитель', color: 'bg-purple-100 text-purple-800' },
    { value: 'admin', label: 'Администратор', color: 'bg-red-100 text-red-800' },
    { value: 'director', label: 'Директор', color: 'bg-green-100 text-green-800' },
    { value: 'accountant', label: 'Бухгалтер', color: 'bg-orange-100 text-orange-800' },
    { value: 'engineer', label: 'Инженер', color: 'bg-cyan-100 text-cyan-800' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Получаем всех пользователей из auth.users через админский доступ
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        // Если нет админского доступа, получаем роли пользователей
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
        if (rolesError) throw rolesError;
        
        // Создаем упрощенную структуру пользователей
        const simplifiedUsers = userRoles?.map(userRole => ({
          id: userRole.user_id,
          email: `user-${userRole.user_id.slice(0, 8)}@company.com`,
          created_at: new Date().toISOString(),
          role: userRole.role
        })) || [];
        
        setUsers(simplifiedUsers);
      } else {
        // Получаем роли пользователей
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role');

        // Объединяем данные
        const usersWithRoles = authUsers.users.map(user => ({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          role: userRoles?.find(role => role.user_id === user.id)?.role
        }));

        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при загрузке пользователей',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      // Добавляем роль
      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: newUser.role as 'admin' | 'salesperson' | 'sales_manager' | 'director' | 'accountant' | 'engineer'
          });

        if (roleError) throw roleError;
      }

      toast({
        title: 'Успешно',
        description: 'Пользователь создан',
      });

      setIsAddUserOpen(false);
      setNewUser({ email: '', password: '', role: 'salesperson' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при создании пользователя',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole as 'admin' | 'salesperson' | 'sales_manager' | 'director' | 'accountant' | 'engineer'
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Роль пользователя обновлена',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при обновлении роли',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleInfo = (role?: string) => {
    return roles.find(r => r.value === role) || { label: 'Не назначена', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Загрузка пользователей...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Управление пользователями
          </h2>
          <p className="text-muted-foreground">Управление пользователями и их ролями</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Добавить пользователя
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Добавить нового пользователя</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Роль</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Создать</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Отмена
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
                  placeholder={t('admin.searchByEmail')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.filterByRole')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Все роли</SelectItem>
                  {roles.map(role => (
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

      {/* Список пользователей */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Пользователи не найдены</h3>
              <p className="text-muted-foreground text-center">
                Попробуйте изменить фильтры или добавить нового пользователя
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const roleInfo = getRoleInfo(user.role);
            
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.email}</h3>
                        <p className="text-sm text-muted-foreground">
                          Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          {user.last_sign_in_at && (
                            <span className="ml-2">
                              • Последний вход: {new Date(user.last_sign_in_at).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={roleInfo.color}>
                        {roleInfo.label}
                      </Badge>
                      
                      <Select 
                        value={user.role || ''} 
                        onValueChange={(value) => handleUpdateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <Settings className="w-4 h-4 mr-2" />
                          <SelectValue placeholder={t('admin.changeRole')} />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {roles.map(role => (
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
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserManagement;
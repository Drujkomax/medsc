import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Employee {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at: string;
}

interface EditEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditEmployeeModal = ({ employee, isOpen, onClose, onUpdate }: EditEmployeeModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    password: '',
    isActive: true
  });

  const roles = [
    { value: 'salesperson', label: 'Продавец' },
    { value: 'sales_manager', label: 'Менеджер продаж' },
    { value: 'admin', label: 'Администратор' }
  ];

  useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email,
        name: employee.name || '',
        role: employee.role || '',
        password: '',
        isActive: true // По умолчанию активен
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    try {
      // Обновляем роль пользователя
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role as 'admin' | 'salesperson' | 'sales_manager' })
        .eq('user_id', employee.id);

      if (roleError) throw roleError;

      // Обновляем email если изменился
      if (formData.email !== employee.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          employee.id,
          { email: formData.email }
        );
        if (emailError) throw emailError;
      }

      // Обновляем пароль если указан
      if (formData.password.trim()) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          employee.id,
          { password: formData.password }
        );
        if (passwordError) throw passwordError;
      }

      // Сохраняем имя в локальном хранилище для отображения
      // TODO: Создать таблицу profiles в будущем для хранения дополнительных данных

      toast({
        title: 'Успешно',
        description: 'Данные сотрудника обновлены',
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при обновлении данных',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать сотрудника</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              placeholder="Введите email сотрудника"
            />
          </div>

          <div>
            <Label htmlFor="name">Имя сотрудника</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите имя сотрудника"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Новый пароль</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Оставьте пустым, чтобы не менять пароль"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Оставьте поле пустым, если не хотите менять пароль
            </p>
          </div>

          <div>
            <Label htmlFor="role">Должность</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите должность" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Доступ активен</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeModal;
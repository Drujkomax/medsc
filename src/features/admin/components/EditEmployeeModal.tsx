import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { getRoleTranslation } from '@/utils/roleTranslations';

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
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    password: '',
    isActive: true
  });

  const getRoles = () => [
    { value: 'salesperson', label: getRoleTranslation('salesperson', i18n.language) },
    { value: 'sales_manager', label: getRoleTranslation('sales_manager', i18n.language) },
    { value: 'admin', label: getRoleTranslation('admin', i18n.language) },
    { value: 'director', label: getRoleTranslation('director', i18n.language) }
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
      // Используем edge function для обновления пользователя
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        throw new Error('Нет активной сессии');
      }

      const response = await fetch('https://smvbhwaupvbxqxqxzzjx.supabase.co/functions/v1/admin-user-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({
          action: 'updateUser',
          userId: employee.id,
          email: formData.email !== employee.email ? formData.email : undefined,
          password: formData.password.trim() || undefined,
          role: formData.role !== employee.role ? formData.role : undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при обновлении данных');
      }

      // Сохраняем имя в локальном хранилище для отображения
      if (formData.name.trim()) {
        localStorage.setItem(`employee_name_${employee.id}`, formData.name);
      }

      toast({
        title: 'Успешно',
        description: t('employees.updated'),
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
          <DialogTitle>{t('employees.editEmployee')}</DialogTitle>
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
              placeholder={t('employees.emailPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="name">{t('employees.nameLabel')}</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('employees.namePlaceholder')}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">{t('employees.passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('employees.passwordPlaceholder')}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Оставьте поле пустым, если не хотите менять пароль
            </p>
          </div>

          <div>
            <Label htmlFor="role">{t('employees.roleLabel')}</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('employees.selectRole')} />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {getRoles().map(role => (
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
              {t('common.save')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeModal;
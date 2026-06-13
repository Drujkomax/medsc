import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Shield } from 'lucide-react';
import { getRoleTranslation } from '@/utils/roleTranslations';
import { CustomPermissionsForm } from './CustomPermissionsForm';

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
      const { error } = await supabase.rpc('update_employee', {
        user_id: employee.id,
        email: formData.email !== employee.email ? formData.email : undefined,
        full_name: formData.name.trim() || undefined,
        password: formData.password.trim() || undefined,
        role: formData.role !== employee.role ? formData.role : undefined,
      });

      if (error) throw error;

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
      <DialogContent className="bg-background max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('employees.editEmployee')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Основная информация
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Настройка прав
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
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
          </TabsContent>

          <TabsContent value="permissions">
            {employee && (
              <CustomPermissionsForm 
                userId={employee.id}
                onSave={() => {
                  toast({
                    title: 'Успешно',
                    description: 'Права доступа обновлены',
                  });
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeModal;
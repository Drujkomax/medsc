import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
  onUpdate: (data: any) => Promise<void>;
}

const CONTRACT_STATUSES = [
  { value: 'active', label: 'Активный' },
  { value: 'onboarding', label: 'Онбординг' },
  { value: 'suspended', label: 'Приостановлен' },
  { value: 'expired', label: 'Истёк' },
];

const COOPERATION_TYPES = [
  { value: 'equipment', label: 'Оборудование' },
  { value: 'consumables', label: 'Расходники' },
  { value: 'maintenance', label: 'Обслуживание' },
  { value: 'software', label: 'ПО' },
];

const PRIORITIES = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
];

export default function EditClientDialog({ open, onOpenChange, client, onUpdate }: EditClientDialogProps) {
  const [loading, setLoading] = useState(false);
  const { employees } = useEmployeesByRole();
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    inn: '',
    notes: '',
    contract_start_date: '',
    contract_end_date: '',
    contract_status: 'onboarding',
    cooperation_type: [] as string[],
    assigned_manager: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (open && client) {
      setFormData({
        name: client.name || '',
        legal_name: client.legal_name || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        inn: client.inn || '',
        notes: client.notes || '',
        contract_start_date: client.contract_start_date || '',
        contract_end_date: client.contract_end_date || '',
        contract_status: client.contract_status || 'onboarding',
        cooperation_type: client.cooperation_type || [],
        assigned_manager: client.assigned_manager || '',
        priority: client.priority || 'medium',
      });
    }
  }, [open, client]);

  const handleCooperationTypeChange = (value: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, cooperation_type: [...formData.cooperation_type, value] });
    } else {
      setFormData({ ...formData, cooperation_type: formData.cooperation_type.filter(t => t !== value) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate({
        ...formData,
        assigned_manager: formData.assigned_manager || null,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать клинику</DialogTitle>
          <DialogDescription>Измените информацию о клинике</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Основная информация</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Название клиники *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label>Юридическое название</Label>
                <Input
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Контактное лицо</Label>
                <Input
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>

              <div>
                <Label>ИНН</Label>
                <Input
                  value={formData.inn}
                  onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label>Телефон</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label>Город</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <Label>Страна</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label>Адрес</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Контракт и сотрудничество</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Статус контракта</Label>
                <Select
                  value={formData.contract_status}
                  onValueChange={(value) => setFormData({ ...formData, contract_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Приоритет</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Дата начала контракта</Label>
                <Input
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Дата окончания контракта</Label>
                <Input
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Ответственный менеджер</Label>
                <Select
                  value={formData.assigned_manager || "none"}
                  onValueChange={(value) => setFormData({ ...formData, assigned_manager: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не назначен" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не назначен</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name || emp.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Тип сотрудничества</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {COOPERATION_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`coop-${type.value}`}
                        checked={formData.cooperation_type.includes(type.value)}
                        onCheckedChange={(checked) => handleCooperationTypeChange(type.value, !!checked)}
                      />
                      <label
                        htmlFor={`coop-${type.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Заметки</h4>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

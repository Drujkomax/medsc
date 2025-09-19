import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const stages = [
  { value: 'new', label: 'Новый' },
  { value: 'contacted', label: 'Связались' },
  { value: 'qualified', label: 'Квалифицирован' },
  { value: 'proposal', label: 'Предложение' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'closed', label: 'Закрыт' },
  { value: 'lost', label: 'Потерян' }
];

const budgetRanges = [
  { value: 'under_50k', label: 'До $50,000' },
  { value: '50k_100k', label: '$50,000 - $100,000' },
  { value: '100k_500k', label: '$100,000 - $500,000' },
  { value: '500k_1m', label: '$500,000 - $1,000,000' },
  { value: 'over_1m', label: 'Свыше $1,000,000' },
  { value: 'not_disclosed', label: 'Не раскрыт' }
];

const equipmentTypes = [
  { value: 'mri', label: 'МРТ оборудование' },
  { value: 'ct', label: 'КТ оборудование' },
  { value: 'ultrasound', label: 'УЗИ оборудование' },
  { value: 'xray', label: 'Рентгеновское оборудование' },
  { value: 'laboratory', label: 'Лабораторное оборудование' },
  { value: 'surgical', label: 'Хирургическое оборудование' },
  { value: 'anesthesia', label: 'Оборудование для анестезии' },
  { value: 'monitoring', label: 'Мониторинговое оборудование' },
  { value: 'rehabilitation', label: 'Реабилитационное оборудование' },
  { value: 'other', label: 'Другое' }
];

export const EditLeadModal = ({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) => {
  const { updateLead } = useLeads();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'new',
    budget_range: '',
    equipment_interest: '',
    position: '',
    value: '',
    notes: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        stage: lead.stage || 'new',
        budget_range: lead.budget_range || '',
        equipment_interest: lead.equipment_interest || '',
        position: lead.position || '',
        value: lead.value?.toString() || '',
        notes: lead.notes || ''
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      await updateLead(lead.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        stage: formData.stage,
        budget_range: formData.budget_range || undefined,
        equipment_interest: formData.equipment_interest || undefined,
        position: formData.position.trim() || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined,
        notes: formData.notes.trim() || undefined
      });
      
      toast({
        title: 'Успешно',
        description: 'Лид обновлен',
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при обновлении лида',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-background overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Редактировать лид</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">Основная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Введите имя"
                  required
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Введите email"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Введите телефон"
                  type="tel"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Компания</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Введите название компании"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Должность</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Введите должность"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Потенциальная стоимость</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="0"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Статус и классификация */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">Статус и классификация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Статус</Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_range">Бюджет</Label>
                <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Выберите диапазон бюджета" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {budgetRanges.map((budget) => (
                      <SelectItem key={budget.value} value={budget.value}>
                        {budget.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="equipment_interest">Интересующее оборудование</Label>
                <Select value={formData.equipment_interest} onValueChange={(value) => handleInputChange('equipment_interest', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Выберите тип оборудования" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {equipmentTypes.map((equipment) => (
                      <SelectItem key={equipment.value} value={equipment.value}>
                        {equipment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Заметки */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">Дополнительная информация</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Введите заметки о лиде..."
                rows={4}
                className="focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-6">
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()} className="px-6">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить изменения
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
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
import { useTranslation } from 'react-i18next';

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditLeadModal = ({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) => {
  const { t } = useTranslation();
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
    notes: '',
    lead_quality: '',
    lead_created_date: ''
  });

  const stages = [
    { value: 'new', label: t('leads.stages.new', 'Новый') },
    { value: 'contacted', label: t('leads.stages.contacted', 'Связались') },
    { value: 'qualified', label: t('leads.stages.qualified', 'Квалифицирован') },
    { value: 'proposal', label: t('leads.stages.proposal', 'Предложение') },
    { value: 'negotiation', label: t('leads.stages.negotiation', 'Переговоры') },
    { value: 'closed', label: t('leads.stages.closed', 'Закрыт') },
    { value: 'lost', label: t('leads.stages.lost', 'Потерян') }
  ];

  const budgetRanges = [
    { value: 'under_50k', label: t('leads.editModal.budgetRanges.under_50k', 'До $50,000') },
    { value: '50k_100k', label: t('leads.editModal.budgetRanges.50k_100k', '$50,000 - $100,000') },
    { value: '100k_500k', label: t('leads.editModal.budgetRanges.100k_500k', '$100,000 - $500,000') },
    { value: '500k_1m', label: t('leads.editModal.budgetRanges.500k_1m', '$500,000 - $1,000,000') },
    { value: 'over_1m', label: t('leads.editModal.budgetRanges.over_1m', 'Свыше $1,000,000') },
    { value: 'not_disclosed', label: t('leads.editModal.budgetRanges.not_disclosed', 'Не раскрыт') }
  ];

  const equipmentTypes = [
    { value: 'mri', label: t('leads.editModal.equipmentTypes.mri', 'МРТ оборудование') },
    { value: 'ct', label: t('leads.editModal.equipmentTypes.ct', 'КТ оборудование') },
    { value: 'ultrasound', label: t('leads.editModal.equipmentTypes.ultrasound', 'УЗИ оборудование') },
    { value: 'xray', label: t('leads.editModal.equipmentTypes.xray', 'Рентгеновское оборудование') },
    { value: 'laboratory', label: t('leads.editModal.equipmentTypes.laboratory', 'Лабораторное оборудование') },
    { value: 'surgical', label: t('leads.editModal.equipmentTypes.surgical', 'Хирургическое оборудование') },
    { value: 'anesthesia', label: t('leads.editModal.equipmentTypes.anesthesia', 'Оборудование для анестезии') },
    { value: 'monitoring', label: t('leads.editModal.equipmentTypes.monitoring', 'Мониторинговое оборудование') },
    { value: 'rehabilitation', label: t('leads.editModal.equipmentTypes.rehabilitation', 'Реабилитационное оборудование') },
    { value: 'other', label: t('leads.editModal.equipmentTypes.other', 'Другое') }
  ];

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
        notes: lead.notes || '',
        lead_quality: lead.lead_quality || '',
        lead_created_date: lead.lead_created_date ? new Date(lead.lead_created_date).toISOString().slice(0, 16) : ''
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
        notes: formData.notes.trim() || undefined,
        lead_quality: formData.lead_quality ? (formData.lead_quality as 'A' | 'B' | 'C') : undefined,
        lead_created_date: formData.lead_created_date || undefined
      });
      
      toast({
        title: t('common.success', 'Успешно'),
        description: t('leads.editModal.leadUpdated', 'Лид обновлен'),
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: t('common.error', 'Ошибка'),
        description: t('leads.editModal.updateError', 'Ошибка при обновлении лида'),
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
          <DialogTitle className="text-xl font-semibold">{t('leads.editModal.title', 'Редактировать лид')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">{t('leads.editModal.sections.basicInfo', 'Основная информация')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead_created_date">{t('leads.leadCreatedDate', 'Дата создания лида')}</Label>
                <Input
                  id="lead_created_date"
                  type="datetime-local"
                  value={formData.lead_created_date}
                  onChange={(e) => handleInputChange('lead_created_date', e.target.value)}
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">{t('leads.name', 'Имя')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('leads.editModal.placeholders.name', 'Введите имя')}
                  required
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('leads.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('leads.editModal.placeholders.email', 'Введите email')}
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('leads.phone', 'Телефон')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('leads.editModal.placeholders.phone', 'Введите телефон')}
                  type="tel"
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">{t('leads.company', 'Компания')}</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder={t('leads.editModal.placeholders.company', 'Введите название компании')}
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">{t('leads.editModal.fields.position', 'Должность')}</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder={t('leads.editModal.placeholders.position', 'Введите должность')}
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">{t('leads.editModal.fields.potentialValue', 'Потенциальная стоимость')}</Label>
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
            <h3 className="text-lg font-medium text-foreground border-b pb-2">{t('leads.editModal.sections.statusClassification', 'Статус и классификация')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">{t('leads.status', 'Статус')}</Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder={t('leads.editModal.placeholders.status', 'Выберите статус')} />
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
                <Label htmlFor="budget_range">{t('leads.editModal.fields.budget', 'Бюджет')}</Label>
                <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder={t('leads.editModal.placeholders.budget', 'Выберите диапазон бюджета')} />
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

              <div className="space-y-2">
                <Label htmlFor="lead_quality">{t('leads.leadQuality', 'Качество лида')}</Label>
                <Select value={formData.lead_quality} onValueChange={(value) => handleInputChange('lead_quality', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder={t('leads.editModal.placeholders.quality', 'Выберите качество лида')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="A">{t('leads.qualityA', 'A - Целевой')}</SelectItem>
                    <SelectItem value="B">{t('leads.qualityB', 'B - Потенциальный')}</SelectItem>
                    <SelectItem value="C">{t('leads.qualityC', 'C - Мусор')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="equipment_interest">{t('leads.editModal.fields.equipmentInterest', 'Интересующее оборудование')}</Label>
                <Select value={formData.equipment_interest} onValueChange={(value) => handleInputChange('equipment_interest', value)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder={t('leads.editModal.placeholders.equipment', 'Выберите тип оборудования')} />
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
            <h3 className="text-lg font-medium text-foreground border-b pb-2">{t('leads.editModal.sections.additionalInfo', 'Дополнительная информация')}</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('leads.editModal.fields.notes', 'Заметки')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('leads.editModal.placeholders.notes', 'Введите заметки о лиде...')}
                rows={4}
                className="focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-6">
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()} className="px-6">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('leads.editModal.saveChanges', 'Сохранить изменения')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

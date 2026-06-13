import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, User, Phone, Building, FileText, Tag, Target, DollarSign, Clock, Briefcase } from 'lucide-react';

interface EditLeadFormProps {
  lead: Lead;
  onSuccess?: () => void;
  embedded?: boolean;
}

export const EditLeadForm = ({ lead, onSuccess, embedded = false }: EditLeadFormProps) => {
  const { t } = useTranslation();
  const { updateLead } = useLeads();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const stages = [
    { value: 'new', label: t('leads.stages.new', 'Новый') },
    { value: 'contacted', label: t('leads.stages.contacted', 'Связались') },
    { value: 'qualified', label: t('leads.stages.qualified', 'Квалифицирован') },
    { value: 'proposal', label: t('leads.stages.proposal', 'Предложение') },
    { value: 'negotiation', label: t('leads.stages.negotiation', 'Переговоры') },
    { value: 'closed', label: t('leads.stages.closed', 'Закрыт') },
    { value: 'lost', label: t('leads.stages.lost', 'Потерян') }
  ];

  const sources = [
    { value: 'manual', label: t('leads.addLeadDialog.sources.manual', 'Ручной ввод') },
    { value: 'website_form', label: t('leads.addLeadDialog.sources.website_form', 'Форма на сайте') },
    { value: 'phone_call', label: t('leads.addLeadDialog.sources.phone_call', 'Телефонный звонок') },
    { value: 'email', label: t('leads.addLeadDialog.sources.email', 'Email') },
    { value: 'social_media', label: t('leads.addLeadDialog.sources.social_media', 'Социальные сети') },
    { value: 'referral', label: t('leads.addLeadDialog.sources.referral', 'Рекомендация') },
    { value: 'other', label: t('leads.addLeadDialog.sources.other', 'Другое') }
  ];

  const budgetRanges = [
    { value: '3k_5k', label: t('leads.addLeadDialog.budgetRanges.3k_5k', '$3,000 - $5,000') },
    { value: '5k_10k', label: t('leads.addLeadDialog.budgetRanges.5k_10k', '$5,000 - $10,000') },
    { value: '10k_50k', label: t('leads.addLeadDialog.budgetRanges.10k_50k', '$10,000 - $50,000') },
    { value: '50k_100k', label: t('leads.addLeadDialog.budgetRanges.50k_100k', '$50,000 - $100,000') },
    { value: '100k_500k', label: t('leads.addLeadDialog.budgetRanges.100k_500k', '$100,000 - $500,000') },
    { value: 'over_500k', label: t('leads.addLeadDialog.budgetRanges.over_500k', 'Свыше $500,000') },
    { value: 'not_specified', label: t('leads.addLeadDialog.budgetRanges.not_specified', 'Не указан') }
  ];

  const equipmentTypes = [
    { value: 'mrt_mskt', label: t('leads.addLeadDialog.equipmentTypes.mrt_mskt', 'МРТ и МСКТ') },
    { value: 'ultrasound', label: t('leads.addLeadDialog.equipmentTypes.ultrasound', 'УЗИ') },
    { value: 'xray', label: t('leads.addLeadDialog.equipmentTypes.xray', 'Рентген') },
    { value: 'gynecology', label: t('leads.addLeadDialog.equipmentTypes.gynecology', 'Гинекология') },
    { value: 'laboratory', label: t('leads.addLeadDialog.equipmentTypes.laboratory', 'Лабораторное оборудование') },
    { value: 'surgical', label: t('leads.addLeadDialog.equipmentTypes.surgical', 'Хирургическое оборудование') },
    { value: 'physiotherapy', label: t('leads.addLeadDialog.equipmentTypes.physiotherapy', 'Физиотерапия') },
    { value: 'resuscitation', label: t('leads.addLeadDialog.equipmentTypes.resuscitation', 'Реанимация') },
    { value: 'other', label: t('leads.addLeadDialog.equipmentTypes.other', 'Другое') }
  ];

  const timelines = [
    { value: 'immediate', label: t('leads.enhancedLeadModal.timelines.immediate', 'Немедленно (в течение месяца)') },
    { value: 'quarter', label: t('leads.enhancedLeadModal.timelines.quarter', 'В течение квартала') },
    { value: 'half_year', label: t('leads.enhancedLeadModal.timelines.half_year', 'В течение полугода') },
    { value: 'year', label: t('leads.enhancedLeadModal.timelines.year', 'В течение года') },
    { value: 'over_year', label: t('leads.enhancedLeadModal.timelines.over_year', 'Более года') },
    { value: 'research', label: t('leads.enhancedLeadModal.timelines.research', 'Пока изучаем рынок') }
  ];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'new',
    source: 'manual',
    notes: '',
    value: '',
    budget_range: '',
    position: '',
    equipment_interest: '',
    timeline: '',
    lead_quality: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        stage: lead.stage || 'new',
        source: lead.source || 'manual',
        notes: lead.notes || '',
        value: lead.value?.toString() || '',
        budget_range: lead.budget_range || '',
        position: lead.position || '',
        equipment_interest: lead.equipment_interest || '',
        timeline: lead.timeline || '',
        lead_quality: lead.lead_quality || ''
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await updateLead(lead.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        stage: formData.stage,
        source: formData.source,
        notes: formData.notes.trim() || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined,
        budget_range: formData.budget_range || undefined,
        position: formData.position.trim() || undefined,
        equipment_interest: formData.equipment_interest || undefined,
        timeline: formData.timeline || undefined,
        lead_quality: formData.lead_quality ? formData.lead_quality as 'A' | 'B' | 'C' : undefined
      });
      
      toast({
        title: t('common.success', 'Успешно'),
        description: t('leads.editForm.success', 'Лид обновлен'),
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: t('common.error', 'Ошибка'),
        description: t('leads.editForm.error', 'Ошибка при обновлении лида'),
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

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('leads.editForm.sections.basicInfo', 'Основная информация')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('leads.name', 'Имя')} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('leads.editForm.placeholders.name', 'Введите имя')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('leads.editForm.fields.email', 'Email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('leads.editForm.placeholders.email', 'Введите email')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('leads.phone', 'Телефон')}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={t('leads.editForm.placeholders.phone', 'Введите телефон')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('leads.company', 'Компания')}
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder={t('leads.editForm.placeholders.company', 'Введите название компании')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">{t('leads.editForm.fields.value', 'Потенциальная сумма ($)')}</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Статус и источник */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t('leads.editForm.sections.statusAndSource', 'Статус и источник')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage">{t('leads.status', 'Статус')}</Label>
            <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('leads.editForm.placeholders.stage', 'Выберите статус')} />
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
            <Label htmlFor="source">{t('leads.addLeadDialog.fields.source', 'Источник')}</Label>
            <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('leads.editForm.placeholders.source', 'Выберите источник')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {sources.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Квалификация лида */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('leads.editForm.sections.qualification', 'Квалификация лида')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget_range" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('leads.addLeadDialog.fields.budgetRange', 'Бюджет')}
            </Label>
            <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('leads.addLeadDialog.placeholders.budgetRange', 'Выберите диапазон бюджета')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {budgetRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {t('leads.editForm.fields.position', 'Позиция/Должность')}
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              placeholder={t('leads.editForm.placeholders.position', 'Например: Главный врач, Директор')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_interest" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('leads.addLeadDialog.fields.equipmentInterest', 'Интерес к оборудованию')}
            </Label>
            <Select value={formData.equipment_interest} onValueChange={(value) => handleInputChange('equipment_interest', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('leads.addLeadDialog.placeholders.equipmentInterest', 'Выберите тип оборудования')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {equipmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('leads.editForm.fields.timeline', 'Сроки реализации')}
            </Label>
            <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('leads.editForm.placeholders.timeline', 'Выберите временные рамки')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {timelines.map((timeline) => (
                  <SelectItem key={timeline.value} value={timeline.value}>
                    {timeline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_quality" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('leads.leadQuality', 'Качество лида')}
            </Label>
            <Select value={formData.lead_quality} onValueChange={(value) => handleInputChange('lead_quality', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('leads.addLeadDialog.placeholders.leadQuality', 'Выберите качество лида')} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="A">{t('leads.qualityA', 'A - Целевой')}</SelectItem>
                <SelectItem value="B">{t('leads.qualityB', 'B - Потенциальный')}</SelectItem>
                <SelectItem value="C">{t('leads.qualityC', 'C - Мусор')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{t('leads.editForm.tip', 'Совет:')}</span> {t('leads.editForm.tipText', 'Заполните поля квалификации во время телефонного разговора с клиентом. Эта информация поможет лучше понять потребности лида и подготовить персональное предложение.')}
          </p>
        </div>
      </div>

      {/* Заметки */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('leads.editForm.sections.notes', 'Заметки')}
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="notes">{t('leads.editForm.fields.mainNotes', 'Основные заметки')}</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={t('leads.editForm.placeholders.notes', 'Введите заметки о лиде')}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {t('leads.editForm.notesHelp', 'Эти заметки отображаются в основной информации лида. Для детального общения используйте вкладку "Активность"')}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading || !formData.name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {t('leads.editForm.saveButton', 'Сохранить изменения')}
        </Button>
      </div>
    </form>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('leads.editForm.title', 'Редактировать лид')}</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

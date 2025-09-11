import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Phone, Building, FileText, Tag, Target, DollarSign, Clock, Briefcase } from 'lucide-react';

interface EditLeadFormProps {
  lead: Lead;
  onSuccess?: () => void;
  embedded?: boolean;
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

const sources = [
  { value: 'manual', label: 'Ручной ввод' },
  { value: 'website_form', label: 'Форма на сайте' },
  { value: 'phone_call', label: 'Телефонный звонок' },
  { value: 'email', label: 'Email' },
  { value: 'social_media', label: 'Социальные сети' },
  { value: 'referral', label: 'Рекомендация' },
  { value: 'other', label: 'Другое' }
];

const budgetRanges = [
  { value: 'under_10k', label: 'До $10,000' },
  { value: '10k_50k', label: '$10,000 - $50,000' },
  { value: '50k_100k', label: '$50,000 - $100,000' },
  { value: '100k_500k', label: '$100,000 - $500,000' },
  { value: 'over_500k', label: 'Свыше $500,000' },
  { value: 'not_specified', label: 'Не указан' }
];

const equipmentTypes = [
  { value: 'mri', label: 'МРТ' },
  { value: 'ct', label: 'КТ' },
  { value: 'ultrasound', label: 'УЗИ' },
  { value: 'xray', label: 'Рентген' },
  { value: 'mammography', label: 'Маммография' },
  { value: 'endoscopy', label: 'Эндоскопия' },
  { value: 'laboratory', label: 'Лабораторное оборудование' },
  { value: 'other', label: 'Другое' }
];

const timelines = [
  { value: 'immediate', label: 'Немедленно (в течение месяца)' },
  { value: 'quarter', label: 'В течение квартала' },
  { value: 'half_year', label: 'В течение полугода' },
  { value: 'year', label: 'В течение года' },
  { value: 'over_year', label: 'Более года' },
  { value: 'research', label: 'Пока изучаем рынок' }
];

export const EditLeadForm = ({ lead, onSuccess, embedded = false }: EditLeadFormProps) => {
  const { updateLead } = useLeads();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    timeline: ''
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
        timeline: lead.timeline || ''
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
        timeline: formData.timeline || undefined
      });
      
      toast({
        title: 'Успешно',
        description: 'Лид обновлен',
      });
      
      onSuccess?.();
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

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Основная информация
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Имя *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите имя"
              required
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Телефон
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Введите телефон"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Компания
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Введите название компании"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Потенциальная сумма ($)</Label>
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
          Статус и источник
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Статус</Label>
            <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
              <SelectTrigger>
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
            <Label htmlFor="source">Источник</Label>
            <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите источник" />
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
          Квалификация лида
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget_range" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Бюджет
            </Label>
            <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите диапазон бюджета" />
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
              Позиция/Должность
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              placeholder="Например: Главный врач, Директор"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_interest" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Интерес к оборудованию
            </Label>
            <Select value={formData.equipment_interest} onValueChange={(value) => handleInputChange('equipment_interest', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип оборудования" />
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
              Сроки реализации
            </Label>
            <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите временные рамки" />
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
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Совет:</span> Заполните поля квалификации во время телефонного разговора с клиентом. 
            Эта информация поможет лучше понять потребности лида и подготовить персональное предложение.
          </p>
        </div>
      </div>

      {/* Заметки */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Заметки
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Основные заметки</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Введите заметки о лиде"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Эти заметки отображаются в основной информации лида. Для детального общения используйте вкладку "Активность"
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading || !formData.name.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Сохранить изменения
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
        <CardTitle>Редактировать лид</CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};
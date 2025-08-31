import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { Plus, User, Phone, Building, FileText, Tag } from 'lucide-react';

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddLeadDialog = ({ open, onClose, onSuccess }: AddLeadDialogProps) => {
  const { toast } = useToast();
  const { addLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    notes: '',
    source: 'manual',
    stage: 'new'
  });

  const leadSources = [
    { value: 'manual', label: 'Ручной ввод' },
    { value: 'website_form', label: 'Форма на сайте' },
    { value: 'phone_call', label: 'Телефонный звонок' },
    { value: 'email', label: 'Email' },
    { value: 'social_media', label: 'Социальные сети' },
    { value: 'referral', label: 'Рекомендация' },
    { value: 'other', label: 'Другое' }
  ];

  const leadStages = [
    { value: 'new', label: 'Новый' },
    { value: 'contacted', label: 'Связались' },
    { value: 'qualified', label: 'Квалифицирован' },
    { value: 'proposal', label: 'Предложение' },
    { value: 'negotiation', label: 'Переговоры' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Имя клиента обязательно для заполнения',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addLead({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        source: formData.source,
        stage: formData.stage
      });

      toast({
        title: 'Успешно',
        description: 'Лид добавлен успешно',
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        company: '',
        notes: '',
        source: 'manual',
        stage: 'new'
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Ошибка при добавлении лида',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить лида
          </DialogTitle>
          <DialogDescription>
            Заполните информацию для создания нового лида
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Имя клиента *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите имя клиента"
              required
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
              placeholder="+7 (xxx) xxx-xx-xx"
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
              placeholder="Название компании"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Источник
            </Label>
            <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите источник" />
              </SelectTrigger>
              <SelectContent>
                {leadSources.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Статус
            </Label>
            <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                {leadStages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Заметки
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Дополнительная информация о лиде"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Добавление...' : 'Добавить лида'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
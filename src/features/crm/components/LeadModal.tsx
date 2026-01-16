import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  company?: string;
  stage: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSave: () => void;
}

const LeadModal = ({ isOpen, onClose, lead, onSave }: LeadModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    stage: 'new',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const stages = [
    { value: 'new', label: t('leads.stages.new', 'Новый лид') },
    { value: 'contacted', label: t('leads.stages.contacted', 'Связались') },
    { value: 'qualified', label: t('leads.stages.qualified', 'Квалифицирован') },
    { value: 'proposal', label: t('leads.stages.proposal', 'Предложение') },
    { value: 'negotiation', label: t('leads.stages.negotiation', 'Переговоры') },
    { value: 'closed', label: t('leads.stages.closed', 'Закрыт') },
    { value: 'lost', label: t('leads.stages.lost', 'Потерян') }
  ];

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        company: lead.company || '',
        stage: lead.stage || 'new',
        notes: lead.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        company: '',
        stage: 'new',
        notes: ''
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const leadData = {
        name: formData.name,
        phone: formData.phone || null,
        company: formData.company || null,
        stage: formData.stage,
        notes: formData.notes || null
      };

      if (lead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id);

        if (error) throw error;

        toast({
          title: t('common.success', 'Успешно'),
          description: t('leads.leadModal.updated', 'Лид обновлен'),
        });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;

        toast({
          title: t('common.success', 'Успешно'),
          description: t('leads.leadModal.created', 'Лид создан'),
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: t('common.error', 'Ошибка'),
        description: t('leads.leadModal.saveError', 'Не удалось сохранить лид'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead ? t('leads.leadModal.editTitle', 'Редактировать лид') : t('leads.leadModal.createTitle', 'Создать лид')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('leads.name', 'Имя')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">{t('leads.phone', 'Телефон')}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="company">{t('leads.company', 'Компания')}</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="stage">{t('leads.leadModal.stageLabel', 'Этап')}</Label>
            <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">{t('leads.leadModal.notesLabel', 'Заметки')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving', 'Сохранение...') : t('common.save', 'Сохранить')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadModal;

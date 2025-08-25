import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const stages = [
  { value: 'new', label: 'Новый лид' },
  { value: 'contacted', label: 'Связались' },
  { value: 'qualified', label: 'Квалифицирован' },
  { value: 'proposal', label: 'Предложение' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'closed', label: 'Закрыт' },
  { value: 'lost', label: 'Потерян' }
];

const LeadModal = ({ isOpen, onClose, lead, onSave }: LeadModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    stage: 'new',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
          title: "Успешно",
          description: "Лид обновлен",
        });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;

        toast({
          title: "Успешно",
          description: "Лид создан",
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить лид",
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
            {lead ? 'Редактировать лид' : 'Создать лид'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="company">Компания</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="stage">Этап</Label>
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
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadModal;
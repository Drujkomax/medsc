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

export const EditLeadModal = ({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) => {
  const { updateLead } = useLeads();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    stage: 'new',
    notes: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        company: lead.company || '',
        stage: lead.stage || 'new',
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
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
        stage: formData.stage,
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
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle>Редактировать лид</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите имя"
              required
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Компания</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Введите название компании"
            />
          </div>

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
            <Label htmlFor="notes">Заметки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Введите заметки"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
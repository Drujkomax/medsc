import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeals } from '@/hooks/useDeals';
import { Lead } from '@/hooks/useLeads';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Calendar, User } from 'lucide-react';

interface CreateDealFromLeadDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess?: (deal: Deal) => void;
}

const CreateDealFromLeadDialog = ({ open, onClose, lead, onSuccess }: CreateDealFromLeadDialogProps) => {
  const { t } = useTranslation();
  const { addDeal } = useDeals();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    stage: 'qualified' as Deal['stage'],
    probability: '80',
    close_date: '',
    notes: ''
  });

  // Set default title based on lead
  useEffect(() => {
    if (lead && open) {
      const defaultTitle = `Сделка с ${lead.name}${lead.company ? ` (${lead.company})` : ''}`;
      setFormData(prev => ({ ...prev, title: defaultTitle }));
    }
  }, [lead, open]);

  const stages = [
    { value: 'qualified', label: t('deals.stages.qualified'), probability: 80 },
    { value: 'proposal', label: t('deals.stages.proposal'), probability: 60 },
    { value: 'negotiation', label: t('deals.stages.negotiation'), probability: 40 },
    { value: 'closed', label: t('deals.stages.closed'), probability: 100 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const title = formData.title.trim();
    if (!title) {
      toast.error(t('deals.titleRequired', 'Введите название сделки'));
      return;
    }

    setLoading(true);

    try {
      const dealData = {
        title,
        lead_id: lead.id,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        stage: formData.stage,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        close_date: formData.close_date || undefined,
        notes: formData.notes || undefined
      };

      const newDeal = await addDeal(dealData);
      
      toast.success(t('deals.createdFromLead', { client: lead.name }));
      
      if (onSuccess && newDeal) {
        onSuccess(newDeal as Deal);
      }
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      stage: 'qualified',
      probability: '80',
      close_date: '',
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update probability based on stage
    if (field === 'stage') {
      const selectedStage = stages.find(s => s.value === value);
      if (selectedStage) {
        setFormData(prev => ({ ...prev, probability: selectedStage.probability.toString() }));
      }
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('deals.createFromLead')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lead Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{lead.name}</span>
            </div>
            {lead.company && (
              <div className="text-xs text-muted-foreground mt-1">{lead.company}</div>
            )}
            {(lead as any).value && (
              <div className="text-xs text-muted-foreground mt-1">
                {t('leads.estimatedValue')}: ${(lead as any).value.toLocaleString()}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('deals.title')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={t('deals.titlePlaceholder')}
                required
              />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('deals.amount')}</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder={(lead as any).value?.toString() || "0"}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">{t('deals.probability')} (%)</Label>
              <Input
                id="probability"
                type="number"
                value={formData.probability}
                onChange={(e) => handleInputChange('probability', e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">{t('deals.stage')} *</Label>
            <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{stage.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {stage.probability}%
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="close_date">{t('deals.closeDate')}</Label>
            <Input
              id="close_date"
              type="date"
              value={formData.close_date}
              onChange={(e) => handleInputChange('close_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('deals.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('deals.notesFromLeadPlaceholder')}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.creating') : t('deals.createDeal')}
            </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDealFromLeadDialog;
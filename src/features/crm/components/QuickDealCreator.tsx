import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { useTasks } from '@/hooks/useTasks';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarIcon, DollarSign, Target, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickDealCreatorProps {
  onSuccess?: () => void;
}

const QuickDealCreator = ({ onSuccess }: QuickDealCreatorProps) => {
  const { t } = useTranslation();
  const { addDeal } = useDeals();
  const { leads } = useLeads();
  const { addTask } = useTasks();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    client_id: 'none',
    amount: '',
    stage: 'qualified' as Deal['stage'],
    probability: '80',
    close_date: undefined as Date | undefined,
    notes: '',
    createFollowUpTask: true
  });

  const stages = [
    { value: 'qualified', label: t('deals.stages.qualified'), probability: 80, color: 'text-green-600' },
    { value: 'proposal', label: t('deals.stages.proposal'), probability: 60, color: 'text-yellow-600' },
    { value: 'negotiation', label: t('deals.stages.negotiation'), probability: 40, color: 'text-orange-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        title: formData.title,
        client_id: formData.client_id === 'none' ? undefined : formData.client_id,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        stage: formData.stage,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        close_date: formData.close_date?.toISOString(),
        notes: formData.notes || undefined
      };

      const newDeal = await addDeal(dealData);
      
      // Create follow-up task if requested
      if (formData.createFollowUpTask && newDeal) {
        const taskTitle = `Проследить сделку: ${formData.title}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // 3 days from now
        
        await addTask({
          title: taskTitle,
          description: `Связаться с клиентом по сделке "${formData.title}" и уточнить статус`,
          deal_id: (newDeal as any).id,
          client_id: formData.client_id === 'none' ? undefined : formData.client_id,
          status: 'pending',
          priority: 'medium',
          due_date: dueDate.toISOString()
        });
      }
      
      toast.success(t('deals.created'));
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleReset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      client_id: 'none',
      amount: '',
      stage: 'qualified',
      probability: '80',
      close_date: undefined,
      notes: '',
      createFollowUpTask: true
    });
  };

  const handleInputChange = (field: string, value: string | Date | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update probability based on stage
    if (field === 'stage' && typeof value === 'string') {
      const selectedStage = stages.find(s => s.value === value);
      if (selectedStage) {
        setFormData(prev => ({ ...prev, probability: selectedStage.probability.toString() }));
      }
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <DollarSign className="w-4 h-4 mr-2" />
        {t('deals.quickCreate')}
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          {t('deals.quickCreate')}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              <Label htmlFor="client">{t('deals.client')}</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => handleInputChange('client_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('deals.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('deals.noClient')}</SelectItem>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} {lead.company && `(${lead.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t('deals.amount')}</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">{t('deals.stage')} *</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(value) => handleInputChange('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{stage.label}</span>
                        <span className={`text-xs ml-2 ${stage.color}`}>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.close_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.close_date ? format(formData.close_date, "dd.MM.yyyy") : t('deals.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.close_date}
                    onSelect={(date) => handleInputChange('close_date', date || new Date())}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('deals.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('deals.notesPlaceholder')}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="createFollowUpTask"
              checked={formData.createFollowUpTask}
              onChange={(e) => handleInputChange('createFollowUpTask', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="createFollowUpTask" className="text-sm">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              {t('deals.createFollowUpTask')}
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickDealCreator;
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  Save, 
  X, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp,
  Target,
  AlertCircle,
  Calculator
} from 'lucide-react';

interface EnhancedAddDealDialogProps {
  open: boolean;
  onClose: () => void;
  deal?: Deal | null;
}

const EnhancedAddDealDialog = ({ open, onClose, deal }: EnhancedAddDealDialogProps) => {
  const { t } = useTranslation();
  const { addDeal, updateDeal } = useDeals();
  const { leads } = useLeads();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    lead_id: 'none',
    amount: '',
    stage: 'lead' as Deal['stage'],
    probability: '',
    close_date: '',
    notes: ''
  });

  // Update form data when deal prop changes
  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        lead_id: deal.lead_id || 'none',
        amount: deal.amount?.toString() || '',
        stage: deal.stage || 'lead',
        probability: deal.probability?.toString() || '',
        close_date: deal.close_date ? new Date(deal.close_date).toISOString().split('T')[0] : '',
        notes: deal.notes || ''
      });
    } else {
      setFormData({
        title: '',
        lead_id: 'none',
        amount: '',
        stage: 'lead',
        probability: '',
        close_date: '',
        notes: ''
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [deal, open]);

  const stages = [
    { value: 'lead', label: t('deals.stages.lead'), color: 'bg-blue-100 text-blue-800', probability: 10 },
    { value: 'qualified', label: t('deals.stages.qualified'), color: 'bg-green-100 text-green-800', probability: 25 },
    { value: 'proposal', label: t('deals.stages.proposal'), color: 'bg-yellow-100 text-yellow-800', probability: 50 },
    { value: 'negotiation', label: t('deals.stages.negotiation'), color: 'bg-orange-100 text-orange-800', probability: 75 },
    { value: 'closed', label: t('deals.stages.closed'), color: 'bg-emerald-100 text-emerald-800', probability: 100 },
    { value: 'lost', label: t('deals.stages.lost'), color: 'bg-red-100 text-red-800', probability: 0 }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.required');
    }

    if (formData.amount && isNaN(parseFloat(formData.amount))) {
      newErrors.amount = t('validation.invalidNumber');
    }

    if (formData.probability) {
      const prob = parseInt(formData.probability);
      if (isNaN(prob) || prob < 0 || prob > 100) {
        newErrors.probability = t('validation.probabilityRange');
      }
    }

    if (formData.close_date && new Date(formData.close_date) < new Date()) {
      newErrors.close_date = t('validation.futureDate');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimatedValue = () => {
    const amount = parseFloat(formData.amount) || 0;
    const probability = parseInt(formData.probability) || 0;
    return (amount * probability / 100).toFixed(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t('validation.checkErrors'));
      return;
    }

    setLoading(true);

    try {
      const dealData = {
        title: formData.title.trim(),
        lead_id: formData.lead_id === 'none' ? undefined : formData.lead_id,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        stage: formData.stage,
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        close_date: formData.close_date || undefined,
        notes: formData.notes.trim() || undefined
      };

      if (deal) {
        await updateDeal(deal.id, dealData);
        toast.success(t('deals.updated'));
      } else {
        await addDeal(dealData);
        toast.success(t('deals.created'));
      }

      onClose();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-suggest probability based on stage
    if (field === 'stage') {
      const stageInfo = stages.find(s => s.value === value);
      if (stageInfo && !formData.probability) {
        setFormData(prev => ({ ...prev, probability: stageInfo.probability.toString() }));
      }
    }
  };

  const selectedStage = stages.find(s => s.value === formData.stage);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {deal ? t('deals.editDeal') : t('deals.addDeal')}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('deals.basicInfo')}</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">{t('deals.financial')}</span>
            </TabsTrigger>
            <TabsTrigger value="additional" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">{t('deals.additional')}</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <TabsContent value="basic" className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('deals.title')} *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={t('deals.titlePlaceholder')}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('deals.client')}
                </Label>
                <Select value={formData.lead_id} onValueChange={(value) => handleInputChange('lead_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('deals.selectClient')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('deals.noClient')}</SelectItem>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex items-center gap-2">
                          <span>{lead.name}</span>
                          {lead.company && <Badge variant="outline" className="text-xs">{lead.company}</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage */}
              <div className="space-y-2">
                <Label htmlFor="stage" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('deals.stage')} *
                </Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.value} value={stage.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={stage.color}>{stage.label}</Badge>
                          <span className="text-xs text-muted-foreground">({stage.probability}%)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedStage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge className={selectedStage.color}>{selectedStage.label}</Badge>
                    <span>Обычная вероятность: {selectedStage.probability}%</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              {/* Amount and Probability */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t('deals.amount')}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={errors.amount ? 'border-destructive' : ''}
                  />
                  {errors.amount && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.amount}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probability" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('deals.probability')} (%)
                  </Label>
                  <Input
                    id="probability"
                    type="number"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="100"
                    className={errors.probability ? 'border-destructive' : ''}
                  />
                  {errors.probability && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.probability}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Value */}
              {formData.amount && formData.probability && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t('deals.estimatedValue')}</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${calculateEstimatedValue()}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Рассчитано как: ${formData.amount} × {formData.probability}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              {/* Close Date */}
              <div className="space-y-2">
                <Label htmlFor="close_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('deals.closeDate')}
                </Label>
                <Input
                  id="close_date"
                  type="date"
                  value={formData.close_date}
                  onChange={(e) => handleInputChange('close_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.close_date ? 'border-destructive' : ''}
                />
                {errors.close_date && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.close_date}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('deals.notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={t('deals.notesPlaceholder')}
                  rows={4}
                />
              </div>

              {/* Summary */}
              {(formData.title || formData.amount) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('deals.summary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {formData.title && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('deals.title')}:</span>
                        <span className="font-medium">{formData.title}</span>
                      </div>
                    )}
                    {formData.amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('deals.amount')}:</span>
                        <span className="font-medium">${parseFloat(formData.amount).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedStage && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">{t('deals.stage')}:</span>
                        <Badge className={selectedStage.color}>{selectedStage.label}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {loading ? t('common.saving') : (deal ? t('common.save') : t('common.create'))}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddDealDialog;
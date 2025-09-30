import { useState, useEffect, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, DollarSign, TrendingUp, FileText, User, Calendar, Target, Package, Settings } from 'lucide-react';

interface UnifiedDealDialogProps {
  open: boolean;
  onClose: () => void;
  deal?: Deal | null;
}

const UnifiedDealDialog = ({ open, onClose, deal }: UnifiedDealDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { addDeal, updateDeal } = useDeals();
  const { leads } = useLeads();
  const { products } = useProducts();
  const { services } = useServices();
  
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    amount: '',
    stage: 'lead' as Deal['stage'],
    probability: '',
    close_date: '',
    notes: '',
    deal_type: '' as 'product' | 'service' | '',
    product_id: '',
    service_id: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const stages = [
    { value: 'lead', label: t('deals.stages.lead'), probability: 10, color: 'bg-gray-100 text-gray-800' },
    { value: 'qualified', label: t('deals.stages.qualified'), probability: 25, color: 'bg-blue-100 text-blue-800' },
    { value: 'proposal', label: t('deals.stages.proposal'), probability: 50, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'negotiation', label: t('deals.stages.negotiation'), probability: 75, color: 'bg-orange-100 text-orange-800' },
    { value: 'closed', label: t('deals.stages.closed'), probability: 100, color: 'bg-green-100 text-green-800' },
    { value: 'lost', label: t('deals.stages.lost'), probability: 0, color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        client_id: deal.client_id || '',
        amount: deal.amount?.toString() || '',
        stage: deal.stage || 'lead',
        probability: deal.probability?.toString() || '',
        close_date: deal.close_date ? new Date(deal.close_date).toISOString().split('T')[0] : '',
        notes: deal.notes || '',
        deal_type: deal.deal_type || '',
        product_id: deal.product_id || '',
        service_id: deal.service_id || ''
      });
    } else {
      setFormData({
        title: '',
        client_id: '',
        amount: '',
        stage: 'lead',
        probability: '10',
        close_date: '',
        notes: '',
        deal_type: '',
        product_id: '',
        service_id: ''
      });
    }
    setErrors({});
  }, [deal, open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }
    
    if (formData.deal_type && !formData.product_id && !formData.service_id) {
      newErrors.deal_type = 'Выберите товар или услугу';
    }
    
    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = 'Неверный формат числа';
    }
    
    if (formData.probability && (isNaN(Number(formData.probability)) || Number(formData.probability) < 0 || Number(formData.probability) > 100)) {
      newErrors.probability = 'Вероятность должна быть от 0 до 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEstimatedValue = () => {
    const amount = Number(formData.amount) || 0;
    const probability = Number(formData.probability) || 0;
    return (amount * probability / 100).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const dealData = {
        title: formData.title,
        client_id: formData.client_id || undefined,
        amount: formData.amount ? Number(formData.amount) : undefined,
        stage: formData.stage,
        probability: formData.probability ? Number(formData.probability) : undefined,
        close_date: formData.close_date || undefined,
        notes: formData.notes || undefined,
        deal_type: formData.deal_type || undefined,
        product_id: formData.product_id || undefined,
        service_id: formData.service_id || undefined
      };
      
      if (deal) {
        await updateDeal(deal.id, dealData);
        toast({
          title: 'Сделка обновлена',
          description: 'Сделка успешно обновлена'
        });
      } else {
        await addDeal(dealData);
        toast({
          title: 'Сделка создана',
          description: 'Сделка успешно создана'
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при сохранении сделки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Reset related fields when deal_type changes
    if (field === 'deal_type') {
      setFormData(prev => ({
        ...prev,
        deal_type: value as 'product' | 'service' | '',
        product_id: '',
        service_id: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Auto-suggest probability based on stage
    if (field === 'stage') {
      const selectedStage = stages.find(s => s.value === value);
      if (selectedStage) {
        setFormData(prev => ({ ...prev, probability: selectedStage.probability.toString() }));
      }
    }
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getLeadName = (clientId: string) => {
    const lead = leads.find(l => l.id === clientId);
    return lead ? `${lead.name} (${lead.company || 'Без компании'})` : '';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? (typeof product.name === 'string' ? product.name : product.name?.ru || product.name?.en || 'Товар') : '';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? (typeof service.title === 'string' ? service.title : service.title?.ru || service.title?.en || 'Услуга') : '';
  };

  const currentStage = stages.find(s => s.value === formData.stage);
  const estimatedValue = calculateEstimatedValue();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {deal ? 'Редактировать сделку' : 'Добавить сделку'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Основная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название сделки *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Введите название сделки"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="client_id">Клиент</Label>
                    <Select value={formData.client_id} onValueChange={(value) => handleInputChange('client_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name} {lead.company && `(${lead.company})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deal_type">Тип сделки</Label>
                    <Select value={formData.deal_type} onValueChange={(value) => handleInputChange('deal_type', value)}>
                      <SelectTrigger className={errors.deal_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Выберите тип сделки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Товар</SelectItem>
                        <SelectItem value="service">Услуга</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.deal_type && <p className="text-sm text-red-500 mt-1">{errors.deal_type}</p>}
                  </div>

                  {formData.deal_type === 'product' && (
                    <div>
                      <Label htmlFor="product_id">Товар</Label>
                      <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите товар" />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .filter(product => product.status === 'active' && !product.archived)
                            .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                {getProductName(product.id)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.deal_type === 'service' && (
                    <div>
                      <Label htmlFor="service_id">Услуга</Label>
                      <Select value={formData.service_id} onValueChange={(value) => handleInputChange('service_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите услугу" />
                        </SelectTrigger>
                        <SelectContent>
                          {services
                            .filter(service => service.status === 'active')
                            .map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                {getServiceName(service.id)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stage">Этап сделки *</Label>
                      <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={stage.color}>
                                  {stage.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  ({stage.probability}%)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="close_date">Дата закрытия</Label>
                      <Input
                        id="close_date"
                        type="date"
                        value={formData.close_date}
                        onChange={(e) => handleInputChange('close_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Заметки</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Добавить заметки о сделке"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Финансовые детали
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Сумма сделки</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="0.00"
                        className={errors.amount ? 'border-red-500' : ''}
                      />
                      {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                      <Label htmlFor="probability">Вероятность (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.probability}
                        onChange={(e) => handleInputChange('probability', e.target.value)}
                        placeholder="50"
                        className={errors.probability ? 'border-red-500' : ''}
                      />
                      {errors.probability && <p className="text-sm text-red-500 mt-1">{errors.probability}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Сводка по сделке
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentStage && (
                    <div>
                      <Label>Текущий этап</Label>
                      <Badge className={`w-full justify-center mt-1 ${currentStage.color}`}>
                        {currentStage.label}
                      </Badge>
                    </div>
                  )}

                  {formData.client_id && (
                    <div>
                      <Label>Выбранный клиент</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {getLeadName(formData.client_id)}
                        </div>
                      </div>
                    </div>
                  )}

                  {((formData.deal_type === 'product' && formData.product_id) || 
                    (formData.deal_type === 'service' && formData.service_id)) && (
                    <div>
                      <Label>{formData.deal_type === 'product' ? 'Выбранный товар' : 'Выбранная услуга'}</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          {formData.deal_type === 'product' ? <Package className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                          {formData.deal_type === 'product' ? getProductName(formData.product_id) : getServiceName(formData.service_id)}
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.amount || formData.probability) && (
                    <div>
                      <Label>Финансовая сводка</Label>
                      <div className="mt-1 space-y-2">
                        {formData.amount && (
                          <div className="flex justify-between text-sm">
                            <span>Стоимость сделки:</span>
                            <span className="font-medium">${Number(formData.amount).toLocaleString()}</span>
                          </div>
                        )}
                        {formData.probability && (
                          <div className="flex justify-between text-sm">
                            <span>Вероятность:</span>
                            <span className="font-medium">{formData.probability}%</span>
                          </div>
                        )}
                        {formData.amount && formData.probability && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-sm font-medium">
                              <span>Ожидаемая стоимость:</span>
                              <span className="text-green-600">${Number(estimatedValue).toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.close_date && (
                    <div>
                      <Label>Ожидаемое закрытие</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(formData.close_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : deal ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedDealDialog;
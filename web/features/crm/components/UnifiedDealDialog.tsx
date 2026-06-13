import { useState, useEffect, ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, DollarSign, TrendingUp, FileText, User, Calendar, Target, Package, Settings, CreditCard } from 'lucide-react';

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
  const { role } = useUserPermissions();
  
  // Проверяем, может ли пользователь редактировать статус оплаты
  const canEditPaymentStatus = role === 'director' || role === 'sales_manager' || role === 'accountant';
  
  const [formData, setFormData] = useState({
    title: '',
    lead_id: '',
    amount: '',
    stage: 'lead' as Deal['stage'],
    close_date: '',
    notes: '',
    deal_type: '' as 'product' | 'service' | 'both' | '',
    product_id: '',
    service_id: '',
    payment_status: 'waiting' as 'waiting' | 'paid' | 'not_realized' | 'debt',
    debt_amount: ''
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
        lead_id: deal.lead_id || '',
        amount: deal.amount?.toString() || '',
        stage: deal.stage || 'lead',
        close_date: deal.close_date ? new Date(deal.close_date).toISOString().split('T')[0] : '',
        notes: deal.notes || '',
        deal_type: deal.deal_type || '',
        product_id: deal.product_id || '',
        service_id: deal.service_id || '',
        payment_status: deal.payment_status || 'waiting',
        debt_amount: deal.debt_amount?.toString() || ''
      });
    } else {
      setFormData({
        title: '',
        lead_id: '',
        amount: '',
        stage: 'lead',
        close_date: '',
        notes: '',
        deal_type: '',
        product_id: '',
        service_id: '',
        payment_status: 'waiting',
        debt_amount: ''
      });
    }
    setErrors({});
  }, [deal, open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('deals.form.titleRequired', 'Название обязательно');
    }
    
    // Валидация только если выбран тип сделки
    if (formData.deal_type) {
      if (formData.deal_type === 'product' && !formData.product_id) {
        newErrors.deal_type = t('deals.form.selectProduct', 'Выберите товар');
      } else if (formData.deal_type === 'service' && !formData.service_id) {
        newErrors.deal_type = t('deals.form.selectService', 'Выберите услугу');
      } else if (formData.deal_type === 'both' && !formData.product_id && !formData.service_id) {
        newErrors.deal_type = t('deals.form.selectProductOrService', 'Выберите товар и/или услугу');
      }
    }
    
    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = t('deals.form.invalidNumber', 'Неверный формат числа');
    }
    
    if (formData.payment_status === 'debt' && formData.debt_amount && isNaN(Number(formData.debt_amount))) {
      newErrors.debt_amount = t('deals.form.invalidNumber', 'Неверный формат числа');
    }

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: t('deals.form.checkForm', 'Проверьте форму'),
        description: Object.values(newErrors)[0],
        variant: 'destructive'
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const dealData = {
        title: formData.title,
        lead_id: formData.lead_id || undefined,
        amount: formData.amount ? Number(formData.amount) : undefined,
        stage: formData.stage,
        close_date: formData.close_date || undefined,
        notes: formData.notes || undefined,
        deal_type: formData.deal_type || undefined,
        product_id: formData.product_id || undefined,
        service_id: formData.service_id || undefined,
        payment_status: canEditPaymentStatus ? formData.payment_status : undefined,
        debt_amount: (canEditPaymentStatus && formData.payment_status === 'debt' && formData.debt_amount) 
          ? Number(formData.debt_amount) 
          : undefined
      };
      
      if (deal) {
        await updateDeal(deal.id, dealData);
        toast({
          title: t('deals.updated', 'Сделка обновлена'),
          description: t('deals.updatedDesc', 'Сделка успешно обновлена')
        });
      } else {
        await addDeal(dealData);
        toast({
          title: t('deals.created', 'Сделка создана'),
          description: t('deals.createdDesc', 'Сделка успешно создана')
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: t('common.error', 'Ошибка'),
        description: t('deals.saveError', 'Ошибка при сохранении сделки'),
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
        deal_type: value as 'product' | 'service' | 'both' | '',
        product_id: value === 'service' ? '' : prev.product_id,
        service_id: value === 'product' ? '' : prev.service_id
      }));
    } else if (field === 'payment_status') {
      // Сбрасываем debt_amount когда payment_status не 'debt'
      setFormData(prev => ({
        ...prev,
        payment_status: value as 'waiting' | 'paid' | 'not_realized' | 'debt',
        debt_amount: value === 'debt' ? prev.debt_amount : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? `${lead.name} (${lead.company || t('deals.form.noCompany', 'Без компании')})` : '';
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {deal ? t('deals.editDeal', 'Редактировать сделку') : t('deals.addDeal', 'Добавить сделку')}
          </DialogTitle>
          <DialogDescription>
            {deal ? t('deals.form.updateDescription', 'Обновите данные сделки') : t('deals.form.createDescription', 'Заполните форму для создания сделки')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('deals.form.basicInfo', 'Основная информация')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">{t('deals.form.dealTitle', 'Название сделки')} *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder={t('deals.form.dealTitlePlaceholder', 'Введите название сделки')}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="lead_id">{t('deals.form.lead', 'Лид')}</Label>
                    <Select value={formData.lead_id} onValueChange={(value) => handleInputChange('lead_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('deals.form.selectLead', 'Выберите лид')} />
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
                    <Label htmlFor="deal_type">{t('deals.form.dealType', 'Тип сделки')}</Label>
                    <Select value={formData.deal_type} onValueChange={(value) => handleInputChange('deal_type', value)}>
                      <SelectTrigger className={errors.deal_type ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('deals.form.selectDealType', 'Выберите тип сделки')} />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="product">{t('deals.form.product', 'Товар')}</SelectItem>
                         <SelectItem value="service">{t('deals.form.service', 'Услуга')}</SelectItem>
                         <SelectItem value="both">{t('deals.form.productAndService', 'И товар и услуга')}</SelectItem>
                       </SelectContent>
                    </Select>
                    {errors.deal_type && <p className="text-sm text-red-500 mt-1">{errors.deal_type}</p>}
                  </div>

                  {(formData.deal_type === 'product' || formData.deal_type === 'both') && (
                    <div>
                      <Label htmlFor="product_id">{t('deals.form.product', 'Товар')}</Label>
                      <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('deals.form.selectProduct', 'Выберите товар')} />
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

                  {(formData.deal_type === 'service' || formData.deal_type === 'both') && (
                    <div>
                      <Label htmlFor="service_id">{t('deals.form.service', 'Услуга')}</Label>
                      <Select value={formData.service_id} onValueChange={(value) => handleInputChange('service_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('deals.form.selectService', 'Выберите услугу')} />
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
                      <Label htmlFor="stage">{t('deals.form.dealStage', 'Этап сделки')} *</Label>
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
                      <Label htmlFor="close_date">{t('deals.form.closeDate', 'Дата закрытия')}</Label>
                      <Input
                        id="close_date"
                        type="date"
                        value={formData.close_date}
                        onChange={(e) => handleInputChange('close_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">{t('deals.form.notes', 'Заметки')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder={t('deals.form.notesPlaceholder', 'Добавить заметки о сделке')}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {t('deals.form.financialDetails', 'Финансовые детали')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount">{t('deals.form.dealAmount', 'Сумма сделки')}</Label>
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
                </CardContent>
              </Card>

              {canEditPaymentStatus && (
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t('deals.form.paymentStatus', 'Статус оплаты')}
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="payment_status">{t('deals.form.paymentStatus', 'Статус оплаты')}</Label>
                      <Select 
                        value={formData.payment_status} 
                        onValueChange={(value) => handleInputChange('payment_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waiting">{t('deals.payment.waiting', 'Ожидание')}</SelectItem>
                          <SelectItem value="paid">{t('deals.payment.paid', 'Оплачено')}</SelectItem>
                          <SelectItem value="not_realized">{t('deals.payment.notRealized', 'Не реализовано')}</SelectItem>
                          <SelectItem value="debt">{t('deals.payment.debt', 'Задолженность')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.payment_status === 'debt' && (
                      <div>
                        <Label htmlFor="debt_amount">{t('deals.form.debtAmount', 'Сумма задолженности')}</Label>
                        <Input
                          id="debt_amount"
                          type="number"
                          step="0.01"
                          value={formData.debt_amount}
                          onChange={(e) => handleInputChange('debt_amount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {t('deals.form.dealSummary', 'Сводка по сделке')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentStage && (
                    <div>
                      <Label>{t('deals.form.currentStage', 'Текущий этап')}</Label>
                      <Badge className={`w-full justify-center mt-1 ${currentStage.color}`}>
                        {currentStage.label}
                      </Badge>
                    </div>
                  )}

                  {formData.lead_id && (
                    <div>
                      <Label>{t('deals.form.selectedLead', 'Выбранный лид')}</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {getLeadName(formData.lead_id)}
                        </div>
                      </div>
                    </div>
                  )}

                   {((formData.deal_type === 'product' && formData.product_id) || 
                     (formData.deal_type === 'service' && formData.service_id) ||
                     (formData.deal_type === 'both' && (formData.product_id || formData.service_id))) && (
                     <div>
                       <Label>
                         {formData.deal_type === 'product' ? t('deals.form.selectedProduct', 'Выбранный товар') : 
                          formData.deal_type === 'service' ? t('deals.form.selectedService', 'Выбранная услуга') :
                          t('deals.form.selectedProductAndService', 'Выбранные товар и услуга')}
                       </Label>
                       <div className="mt-1 space-y-1">
                         {formData.product_id && (
                           <div className="p-2 bg-muted rounded text-sm">
                             <div className="flex items-center gap-2">
                               <Package className="w-4 h-4" />
                               {getProductName(formData.product_id)}
                             </div>
                           </div>
                         )}
                         {formData.service_id && (
                           <div className="p-2 bg-muted rounded text-sm">
                             <div className="flex items-center gap-2">
                               <Settings className="w-4 h-4" />
                               {getServiceName(formData.service_id)}
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                  )}

                   {formData.amount && (
                     <div>
                       <Label>{t('deals.form.financialSummary', 'Финансовая сводка')}</Label>
                       <div className="mt-1 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{t('deals.form.dealValue', 'Стоимость сделки')}:</span>
                            <span className="font-medium">{Number(formData.amount).toLocaleString()} UZS</span>
                          </div>
                       </div>
                     </div>
                   )}

                  {formData.close_date && (
                    <div>
                      <Label>{t('deals.form.expectedClose', 'Ожидаемое закрытие')}</Label>
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
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving', 'Сохранение...') : deal ? t('common.update', 'Обновить') : t('common.create', 'Создать')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedDealDialog;
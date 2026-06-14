'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';
import { Deal } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Package, 
  Settings, 
  Calculator,
  Save,
  FileText,
  User,
  Calendar,
  Users,
  CreditCard,
  AlertCircle,
  ArrowRightLeft,
  Upload,
  X,
  File
} from 'lucide-react';

interface DealProduct {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: 'USD' | 'EUR' | 'UZS';
}

interface DealService {
  id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: 'USD' | 'EUR' | 'UZS';
}

const CreateDeal = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { role } = useUserRole();
  const { addDeal } = useDeals();
  const { leads } = useLeads();
  const { products } = useProducts();
  const { services } = useServices();
  const { engineers, accountants, salespersons, loading: employeesLoading } = useEmployeesByRole();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    lead_id: '',
    stage: 'lead' as Deal['stage'],
    close_date: '',
    notes: '',
    currency: 'UZS' as 'USD' | 'EUR' | 'UZS',
    assigned_engineer: '',
    assigned_accountant: '',
    assigned_salesperson: '',
    payment_status: 'waiting' as 'waiting' | 'paid' | 'not_realized' | 'debt',
    debt_amount: '',
    debt_currency: 'USD' as 'USD' | 'EUR' | 'UZS'
  });
  
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [dealServices, setDealServices] = useState<DealService[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Курсы валют (средние значения из sqb.uz)
  const exchangeRates = {
    USD: 12065, // Средний курс
    EUR: 14200  // Средний курс
  };
  
  // Конвертация в сумы
  const convertToUZS = (amount: number, currency: 'USD' | 'EUR' | 'UZS'): number => {
    if (currency === 'UZS') return amount;
    return amount * exchangeRates[currency];
  };

  const stages = [
    { value: 'lead', label: 'Лид', color: 'bg-gray-100 text-gray-800' },
    { value: 'qualified', label: 'Квалифицирован', color: 'bg-blue-100 text-blue-800' },
    { value: 'proposal', label: 'Предложение', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'negotiation', label: 'Переговоры', color: 'bg-orange-100 text-orange-800' },
    { value: 'closed', label: 'Закрыт', color: 'bg-green-100 text-green-800' },
    { value: 'lost', label: 'Потерян', color: 'bg-red-100 text-red-800' }
  ];

  const addProduct = () => {
    const newProduct: DealProduct = {
      id: `temp-${Date.now()}`,
      product_id: '',
      quantity: 1,
      unit_price: '' as any,
      total_price: 0,
      currency: 'UZS'
    };
    setDealProducts([...dealProducts, newProduct]);
  };

  const addService = () => {
    const newService: DealService = {
      id: `temp-${Date.now()}`,
      service_id: '',
      quantity: 1,
      unit_price: '' as any,
      total_price: 0,
      currency: 'UZS'
    };
    setDealServices([...dealServices, newService]);
  };

  const removeProduct = (id: string) => {
    setDealProducts(dealProducts.filter(p => p.id !== id));
  };

  const removeService = (id: string) => {
    setDealServices(dealServices.filter(s => s.id !== id));
  };

  const updateProduct = (id: string, field: keyof DealProduct, value: any) => {
    setDealProducts(products => 
      products.map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            const qty = updated.quantity || 0;
            const price = updated.unit_price || 0;
            updated.total_price = qty * price;
          }
          return updated;
        }
        return p;
      })
    );
  };

  const updateService = (id: string, field: keyof DealService, value: any) => {
    setDealServices(services => 
      services.map(s => {
        if (s.id === id) {
          const updated = { ...s, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            const qty = updated.quantity || 0;
            const price = updated.unit_price || 0;
            updated.total_price = qty * price;
          }
          return updated;
        }
        return s;
      })
    );
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? (typeof product.name === 'string' ? product.name : product.name?.ru || product.name?.en || 'Товар') : '';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? (typeof service.title === 'string' ? service.title : service.title?.ru || service.title?.en || 'Услуга') : '';
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? `${lead.name} (${lead.company || 'Без компании'})` : '';
  };

  const localizedName = (val: any): string =>
    typeof val === 'string' ? val : val?.ru || val?.en || val?.uz || '';

  const clientOptions = useMemo<SearchableSelectOption[]>(
    () =>
      leads
        .filter((lead) => !lead.archived)
        .map((lead) => ({
          value: lead.id,
          label: lead.name + (lead.company ? ` (${lead.company})` : ''),
          description: [lead.phone, lead.email].filter(Boolean).join(' · ') || undefined,
          keywords: [lead.phone, lead.email, lead.company, lead.city].filter(Boolean) as string[],
        })),
    [leads],
  );

  const productOptions = useMemo<SearchableSelectOption[]>(
    () =>
      products
        .filter((p: any) => p.status === 'active' && !p.archived)
        .map((p: any) => {
          const ru = localizedName(p.name);
          const en = typeof p.name === 'object' ? p.name?.en : undefined;
          const uz = typeof p.name === 'object' ? p.name?.uz : undefined;
          return {
            value: p.id,
            label: ru || en || uz || 'Товар',
            description: p.category || undefined,
            keywords: [en, uz, p.category, p.country].filter(Boolean) as string[],
          };
        }),
    [products],
  );

  const serviceOptions = useMemo<SearchableSelectOption[]>(
    () =>
      services
        .filter((s: any) => s.status === 'active')
        .map((s: any) => {
          const ru = localizedName(s.title);
          const en = typeof s.title === 'object' ? s.title?.en : undefined;
          const uz = typeof s.title === 'object' ? s.title?.uz : undefined;
          return {
            value: s.id,
            label: ru || en || uz || 'Услуга',
            description: s.category || undefined,
            keywords: [en, uz, s.category].filter(Boolean) as string[],
          };
        }),
    [services],
  );

  const calculateTotalAmount = () => {
    const productsTotal = dealProducts.reduce((sum, p) => {
      return sum + convertToUZS(p.total_price, p.currency);
    }, 0);
    const servicesTotal = dealServices.reduce((sum, s) => {
      return sum + convertToUZS(s.total_price, s.currency);
    }, 0);
    return productsTotal + servicesTotal;
  };

  const calculateProductsTotal = () => {
    return dealProducts.reduce((sum, p) => sum + convertToUZS(p.total_price, p.currency), 0);
  };

  const calculateServicesTotal = () => {
    return dealServices.reduce((sum, s) => sum + convertToUZS(s.total_price, s.currency), 0);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }
    
    // Проверяем что добавлен хотя бы один товар или услуга с выбранным элементом
    const hasSelectedProducts = dealProducts.some(p => p.product_id);
    const hasSelectedServices = dealServices.some(s => s.service_id);
    
    if (!hasSelectedProducts && !hasSelectedServices) {
      newErrors.items = 'Добавьте хотя бы один товар или услугу';
    }
    
    // Проверяем только товары, у которых выбран product_id
    dealProducts.forEach((product, index) => {
      if (product.product_id) { // Только если товар выбран
        if (product.quantity <= 0) {
          newErrors[`product_quantity_${index}`] = 'Количество должно быть больше 0';
        }
        if (product.unit_price < 0) {
          newErrors[`product_price_${index}`] = 'Цена не может быть отрицательной';
        }
      }
    });
    
    // Проверяем только услуги, у которых выбран service_id
    dealServices.forEach((service, index) => {
      if (service.service_id) { // Только если услуга выбрана
        if (service.quantity <= 0) {
          newErrors[`service_quantity_${index}`] = 'Количество должно быть больше 0';
        }
        if (service.unit_price < 0) {
          newErrors[`service_price_${index}`] = 'Цена не может быть отрицательной';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToStorage = async (dealId: string) => {
    if (uploadedFiles.length === 0) return;
    
    setUploadingFiles(true);
    try {
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${dealId}/${Date.now()}_${file.name}`;
        const filePath = `${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('deal-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('deal_documents')
          .insert({
            deal_id: dealId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user?.id
          });

        if (dbError) throw dbError;
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const hasSelectedProducts = dealProducts.some(p => p.product_id);
      const hasSelectedServices = dealServices.some(s => s.service_id);
      const totalAmount = calculateTotalAmount();
      
      const dealData = {
        title: formData.title,
        lead_id: formData.lead_id || undefined,
        amount: totalAmount > 0 ? totalAmount : undefined,
        stage: formData.stage,
        close_date: formData.close_date || undefined,
        notes: formData.notes || undefined,
        deal_type: (hasSelectedProducts && hasSelectedServices ? 'both' : hasSelectedProducts ? 'product' : 'service') as 'both' | 'product' | 'service',
        assigned_engineer: formData.assigned_engineer || undefined,
        assigned_accountant: formData.assigned_accountant || undefined,
        assigned_salesperson: formData.assigned_salesperson || undefined,
        payment_status: formData.payment_status,
        debt_amount: formData.payment_status === 'debt' && formData.debt_amount 
          ? Number(formData.debt_amount) 
          : undefined
      };
      
      const createdDeal = await addDeal(dealData);
      
      // Upload files if accountant
      if (role === 'accountant' && uploadedFiles.length > 0 && createdDeal) {
        await uploadFilesToStorage(createdDeal.id);
      }
      
      toast({
        title: 'Сделка создана',
        description: uploadedFiles.length > 0 
          ? `Сделка успешно создана с ${uploadedFiles.length} документами`
          : 'Сделка успешно создана с товарами и услугами'
      });
      
      router.push('/admin/deals');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при создании сделки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Сбрасываем debt_amount когда payment_status не 'debt'
    if (field === 'payment_status') {
      const paymentStatus = value as 'waiting' | 'paid' | 'not_realized' | 'debt';
      setFormData(prev => ({ 
        ...prev, 
        payment_status: paymentStatus,
        debt_amount: paymentStatus !== 'debt' ? '' : prev.debt_amount 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Очищаем ошибки для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Автоматически добавляем по одному товару и услуге при загрузке
  useEffect(() => {
    if (dealProducts.length === 0) {
      addProduct();
    }
    if (dealServices.length === 0) {
      addService();
    }
  }, []);

  // Автоматическое закрепление за специалистом по продажам
  useEffect(() => {
    if (role === 'salesperson' && user && !formData.assigned_salesperson) {
      setFormData(prev => ({ ...prev, assigned_salesperson: user.id }));
    }
  }, [role, user, formData.assigned_salesperson]);

  // Автоматическое заполнение лида из поздравительного окна.
  // В Next нет location.state, поэтому leadId передаётся через query-параметр (?leadId=...).
  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId && !formData.lead_id) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setFormData(prev => ({
          ...prev,
          lead_id: leadId,
          title: prev.title || `Сделка с ${lead.name}`
        }));
      }
    }
  }, [searchParams, leads, formData.lead_id]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/deals')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к сделкам
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Создать новую сделку</h1>
            <p className="text-muted-foreground">Создайте сделку с несколькими товарами и услугами</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
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
                    <Label htmlFor="lead_id">Клиент</Label>
                    <SearchableSelect
                      options={clientOptions}
                      value={formData.lead_id}
                      onChange={(value) => handleInputChange('lead_id', value)}
                      placeholder="Выберите клиента"
                      searchPlaceholder="Поиск по имени, компании, телефону..."
                      emptyMessage="Клиенты не найдены"
                      showCount
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Клиентов: {clientOptions.length}
                    </p>
                  </div>

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
                              <Badge variant="secondary" className={stage.color}>
                                {stage.label}
                              </Badge>
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

              {/* Products Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Товары
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProduct}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить товар
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dealProducts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Нет добавленных товаров
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dealProducts.map((product, index) => (
                        <div key={product.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Товар #{index + 1}</h4>
                            {dealProducts.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2">
                              <Label>Товар *</Label>
                              <SearchableSelect
                                options={productOptions}
                                value={product.product_id}
                                onChange={(value) => updateProduct(product.id, 'product_id', value)}
                                placeholder="Выберите товар"
                                searchPlaceholder="Поиск по названию, категории..."
                                emptyMessage="Товары не найдены"
                                className={errors[`product_${index}`] ? 'border-red-500' : ''}
                                showCount
                              />
                              {errors[`product_${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`product_${index}`]}</p>}
                            </div>
                            
                            <div>
                              <Label>Количество *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                                placeholder="0"
                                className={errors[`product_quantity_${index}`] ? 'border-red-500' : ''}
                              />
                              {errors[`product_quantity_${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`product_quantity_${index}`]}</p>}
                            </div>
                            
                            <div>
                              <Label>Цена за единицу</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.unit_price}
                                onChange={(e) => updateProduct(product.id, 'unit_price', e.target.value)}
                                placeholder="0"
                                className={errors[`product_price_${index}`] ? 'border-red-500' : ''}
                              />
                              {errors[`product_price_${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`product_price_${index}`]}</p>}
                            </div>

                            <div>
                              <Label>Валюта</Label>
                              <Select 
                                value={product.currency} 
                                onValueChange={(value) => updateProduct(product.id, 'currency', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UZS">Сум (UZS)</SelectItem>
                                  <SelectItem value="USD">Доллар (USD)</SelectItem>
                                  <SelectItem value="EUR">Евро (EUR)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {product.currency !== 'UZS' && product.unit_price > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                              <div className="text-sm">
                                <span className="text-muted-foreground">Конвертация: </span>
                                <span className="font-medium">
                                  {product.unit_price.toLocaleString()} {product.currency} = {convertToUZS(product.unit_price, product.currency).toLocaleString()} UZS
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-end">
                            <div className="text-right">
                              <Label className="text-sm text-muted-foreground">Итого:</Label>
                              <p className="text-lg font-semibold">{product.total_price.toLocaleString()} {product.currency}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Услуги
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addService}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить услугу
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dealServices.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Нет добавленных услуг
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dealServices.map((service, index) => (
                        <div key={service.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Услуга #{index + 1}</h4>
                            {dealServices.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeService(service.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2">
                              <Label>Услуга *</Label>
                              <SearchableSelect
                                options={serviceOptions}
                                value={service.service_id}
                                onChange={(value) => updateService(service.id, 'service_id', value)}
                                placeholder="Выберите услугу"
                                searchPlaceholder="Поиск по названию, категории..."
                                emptyMessage="Услуги не найдены"
                                className={errors[`service_${index}`] ? 'border-red-500' : ''}
                                showCount
                              />
                              {errors[`service_${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`service_${index}`]}</p>}
                            </div>
                            
                            <div>
                              <Label>Количество *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={service.quantity}
                                onChange={(e) => updateService(service.id, 'quantity', e.target.value)}
                                placeholder="0"
                                className={errors[`service_quantity_${index}`] ? 'border-red-500' : ''}
                              />
                              {errors[`service_quantity_${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`service_quantity_${index}`]}</p>}
                            </div>
                            
                            <div>
                              <Label>Цена за единицу</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={service.unit_price}
                                onChange={(e) => updateService(service.id, 'unit_price', e.target.value)}
                                placeholder="0"
                                className={errors[`service_price_${index}`] ? 'border-red-500' : ''}
                              />
                              {errors[`service_price_${index}`] && <p className="text-sm text-red-500 mt-1">{errors[`service_price_${index}`]}</p>}
                            </div>

                            <div>
                              <Label>Валюта</Label>
                              <Select 
                                value={service.currency} 
                                onValueChange={(value) => updateService(service.id, 'currency', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UZS">Сум (UZS)</SelectItem>
                                  <SelectItem value="USD">Доллар (USD)</SelectItem>
                                  <SelectItem value="EUR">Евро (EUR)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {service.currency !== 'UZS' && service.unit_price > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                              <div className="text-sm">
                                <span className="text-muted-foreground">Конвертация: </span>
                                <span className="font-medium">
                                  {service.unit_price.toLocaleString()} {service.currency} = {convertToUZS(service.unit_price, service.currency).toLocaleString()} UZS
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-end">
                            <div className="text-right">
                              <Label className="text-sm text-muted-foreground">Итого:</Label>
                              <p className="text-lg font-semibold">{service.total_price.toLocaleString()} {service.currency}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Сводка по сделке
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.lead_id && (
                    <div>
                      <Label>Клиент</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {getLeadName(formData.lead_id)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Текущий этап</Label>
                    <div className="mt-1">
                      {stages.find(s => s.value === formData.stage) && (
                        <Badge className={`w-full justify-center ${stages.find(s => s.value === formData.stage)?.color}`}>
                          {stages.find(s => s.value === formData.stage)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Финансовая сводка</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Товары ({dealProducts.length}):</span>
                        <span className="font-medium">
                          {calculateProductsTotal().toLocaleString('ru-RU', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} UZS
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Услуги ({dealServices.length}):</span>
                        <span className="font-medium">
                          {calculateServicesTotal().toLocaleString('ru-RU', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} UZS
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Общая сумма:</span>
                        <span className="text-green-600">
                          {calculateTotalAmount().toLocaleString('ru-RU', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} UZS
                        </span>
                      </div>
                    </div>
                  </div>

                  {formData.close_date && (
                    <div>
                      <Label>Дата закрытия</Label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(formData.close_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                   <Separator />

                   {/* Статус оплаты - доступен только Директору, Руководителю и Бухгалтеру */}
                   {(role === 'director' || role === 'sales_manager' || role === 'accountant') && (
                     <div>
                       <Label className="flex items-center gap-2">
                         <CreditCard className="w-4 h-4" />
                         Статус оплаты
                       </Label>
                       <div className="mt-2 space-y-3">
                         <div>
                           <Select 
                             value={formData.payment_status} 
                             onValueChange={(value) => handleInputChange('payment_status', value)}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="waiting">Ожидание</SelectItem>
                               <SelectItem value="paid">Оплачено</SelectItem>
                               <SelectItem value="not_realized">Не реализовано</SelectItem>
                               <SelectItem value="debt">Задолженность</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                          {formData.payment_status === 'debt' && (
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="debt_currency" className="text-sm text-muted-foreground">
                                  Валюта задолженности
                                </Label>
                                <Select 
                                  value={formData.debt_currency} 
                                  onValueChange={(value) => handleInputChange('debt_currency', value as 'USD' | 'EUR' | 'UZS')}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="UZS">UZS (сум)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="debt_amount" className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  Сумма задолженности
                                </Label>
                                <Input
                                  id="debt_amount"
                                  type="number"
                                  step="0.01"
                                  value={formData.debt_amount}
                                  onChange={(e) => handleInputChange('debt_amount', e.target.value)}
                                  placeholder="0.00"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          )}
                       </div>
                     </div>
                   )}

                   <Separator />

                   {/* Назначение ролей */}
                   <div>
                     <Label className="flex items-center gap-2">
                       <Users className="w-4 h-4" />
                       Назначение ролей
                     </Label>
                     <div className="mt-2 space-y-3">
                       {/* Инженер */}
                       <div>
                         <Label className="text-sm text-muted-foreground">Инженер</Label>
                         <Select 
                           value={formData.assigned_engineer} 
                           onValueChange={(value) => handleInputChange('assigned_engineer', value)}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Выберите инженера" />
                           </SelectTrigger>
                           <SelectContent>
                             {engineers.map((engineer) => (
                               <SelectItem key={engineer.id} value={engineer.id}>
                                 <div className="space-y-1">
                                   <div className="font-medium">{engineer.full_name}</div>
                                   <div className="text-sm text-muted-foreground">{engineer.email}</div>
                                 </div>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>

                       {/* Бухгалтер */}
                       <div>
                         <Label className="text-sm text-muted-foreground">Бухгалтер</Label>
                         <Select 
                           value={formData.assigned_accountant} 
                           onValueChange={(value) => handleInputChange('assigned_accountant', value)}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Выберите бухгалтера" />
                           </SelectTrigger>
                           <SelectContent>
                             {accountants.map((accountant) => (
                               <SelectItem key={accountant.id} value={accountant.id}>
                                 <div className="space-y-1">
                                   <div className="font-medium">{accountant.full_name}</div>
                                   <div className="text-sm text-muted-foreground">{accountant.email}</div>
                                 </div>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>

                       {/* Специалист по продажам */}
                       <div>
                         <Label className="text-sm text-muted-foreground">Специалист по продажам</Label>
                         <Select 
                           value={formData.assigned_salesperson} 
                           onValueChange={(value) => handleInputChange('assigned_salesperson', value)}
                           disabled={role === 'salesperson'} // Заблокировано для специалистов по продажам
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Выберите специалиста по продажам" />
                           </SelectTrigger>
                           <SelectContent>
                             {salespersons.map((salesperson) => (
                               <SelectItem key={salesperson.id} value={salesperson.id}>
                                 <div className="space-y-1">
                                   <div className="font-medium">{salesperson.full_name}</div>
                                   <div className="text-sm text-muted-foreground">{salesperson.email}</div>
                                 </div>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         {role === 'salesperson' && (
                           <p className="text-xs text-muted-foreground mt-1">
                             Автоматически закреплено за вами
                           </p>
                         )}
                      </div>
                    </div>


                    </div>

                    {/* Document Upload - Only for Accountants */}
                    {role === 'accountant' && (
                      <>
                        <Separator />
                        <div>
                          <Label className="flex items-center gap-2 mb-3">
                            <Upload className="w-4 h-4" />
                            Документы
                          </Label>
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                              <input
                                type="file"
                                id="file-upload"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <label 
                                htmlFor="file-upload" 
                                className="cursor-pointer flex flex-col items-center gap-2"
                              >
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <p className="text-sm font-medium">Загрузить документы</p>
                                <p className="text-xs text-muted-foreground">
                                  PDF, DOC, XLS, JPG, PNG (макс. 10 файлов)
                                </p>
                              </label>
                            </div>

                            {uploadedFiles.length > 0 && (
                              <div className="space-y-2">
                                {uploadedFiles.map((file, index) => (
                                  <div 
                                    key={index} 
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      <File className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}


                    {errors.items && (
                      <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                        {errors.items}
                      </div>
                    )}
                  </CardContent>
                </Card>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/deals')}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || uploadingFiles} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading || uploadingFiles ? 'Создание...' : 'Создать сделку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDeal;
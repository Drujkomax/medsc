import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react';
import { useAdminProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ProductImageUpload } from '@/components/common/ProductImageUpload';
import { ImageUpload } from '@/components/common/ImageUpload';
import { CategoryDialog } from '@/components/common/CategoryDialog';
import { useCategories } from '@/hooks/useCategories';
import { useManufacturers } from '@/hooks/useManufacturers';
import { countries } from '@/utils/countries';
import { generateSlug } from '@/lib/slugify';

const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'UZS', label: 'UZS (сум)' }
];

const statusOptions = [
  { value: 'active', label: 'Активный' },
  { value: 'draft', label: 'Черновик' }
];

const AddProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addProduct } = useAdminProducts();
  const { categories } = useCategories();
  const { manufacturers } = useManufacturers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: { ru: '', en: '', uz: '' },
    description: { ru: '', en: '', uz: '' },
    slug: '',
    category: '',
    country: '',
    manufacturer_id: '',
    icon_url: '',
    price: '',
    currency: 'USD' as 'USD' | 'EUR' | 'UZS',
    status: 'draft',
    features: { ru: [''], en: [''], uz: [''] },
    images: { cover: null, gallery: [] }
  });

  // Auto-generate slug from English name
  useEffect(() => {
    if (formData.name.en) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.name.en)
      }));
    }
  }, [formData.name.en]);

  // Log form data changes
  useEffect(() => {
    console.log('AddProduct form data changed:', formData);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form data on submit:', formData);
    
    // Минимальная валидация для черновиков
    if (!formData.name.ru.trim()) {
      console.log('Validation failed: name is empty');
      toast({
        variant: 'destructive',
        title: 'Ошибка валидации',
        description: 'Название на русском языке обязательно'
      });
      return;
    }
    
    // Полная валидация для публикации
    if (formData.status === 'active') {
      console.log('Validating for active status');
      
      if (!formData.description.ru.trim()) {
        console.log('Validation failed: description is empty');
        toast({
          variant: 'destructive',
          title: 'Ошибка валидации',
          description: 'Для публикации товара необходимо описание на русском языке'
        });
        return;
      }
      
      if (!formData.category) {
        console.log('Validation failed: category is empty');
        toast({
          variant: 'destructive',
          title: 'Ошибка валидации',
          description: 'Для публикации товара необходимо выбрать категорию'
        });
        return;
      }
      
      if (!formData.images.cover) {
        console.log('Validation failed: cover image is missing');
        toast({
          variant: 'destructive',
          title: 'Ошибка валидации',
          description: 'Для публикации товара необходимо добавить обложку'
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      console.log('Submitting product data:', formData);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug || generateSlug(formData.name.en || formData.name.ru),
        category: formData.category,
        country: formData.country,
        manufacturer_id: formData.manufacturer_id || null,
        icon_url: formData.icon_url || null,
        price: formData.price || null,
        currency: formData.currency,
        status: formData.status as 'active' | 'draft',
        features: formData.features,
        images: formData.images
      };

      console.log('Calling addProduct with data:', productData);
      const result = await addProduct(productData);
      console.log('Product added successfully:', result);

      toast({
        title: 'Успешно!',
        description: 'Товар добавлен успешно'
      });
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error adding product:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить товар'
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeature = (lang: 'ru' | 'en' | 'uz') => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: [...prev.features[lang], '']
      }
    }));
  };

  const updateFeature = (lang: 'ru' | 'en' | 'uz', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: prev.features[lang].map((feature, i) => i === index ? value : feature)
      }
    }));
  };

  const removeFeature = (lang: 'ru' | 'en' | 'uz', index: number) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: prev.features[lang].filter((_, i) => i !== index)
      }
    }));
  };

  const handleCategoryAdded = (categoryValue: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryValue
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к товарам
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Добавить товар</h1>
            <p className="text-muted-foreground">Создание нового товара в каталоге</p>
          </div>
        </div>
        
        <Button 
          type="submit" 
          form="product-form"
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Сохранить товар
        </Button>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Names */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name-ru">Название (RU) *</Label>
                    <Input
                      id="name-ru"
                      value={formData.name.ru}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: { ...prev.name, ru: e.target.value }
                      }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name-en">Название (EN)</Label>
                    <Input
                      id="name-en"
                      value={formData.name.en}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: { ...prev.name, en: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name-uz">Название (UZ)</Label>
                    <Input
                      id="name-uz"
                      value={formData.name.uz}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        name: { ...prev.name, uz: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                {/* Descriptions */}
                 <div className="space-y-4">
                    <div>
                      <Label htmlFor="desc-ru">
                        Описание (RU)
                        {formData.status === 'active' && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <Textarea
                        id="desc-ru"
                        value={formData.description.ru}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          description: { ...prev.description, ru: e.target.value }
                        }))}
                        rows={3}
                      />
                    </div>
                  <div>
                    <Label htmlFor="desc-en">Описание (EN)</Label>
                    <Textarea
                      id="desc-en"
                      value={formData.description.en}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        description: { ...prev.description, en: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="desc-uz">Описание (UZ)</Label>
                    <Textarea
                      id="desc-uz"
                      value={formData.description.uz}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        description: { ...prev.description, uz: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Изображения
                  {formData.status === 'active' && <span className="text-destructive ml-1">* (обложка обязательна)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductImageUpload
                  images={formData.images}
                  onImagesChange={(imagesOrUpdater) => {
                    if (typeof imagesOrUpdater === 'function') {
                      setFormData(prev => ({
                        ...prev,
                        images: imagesOrUpdater(prev.images)
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        images: imagesOrUpdater
                      }));
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Характеристики</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(['ru', 'en', 'uz'] as const).map((lang) => (
                  <div key={lang} className="space-y-3">
                     <div className="flex items-center justify-between">
                       <Label>
                         Характеристики ({lang.toUpperCase()})
                       </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addFeature(lang)}
                      >
                        Добавить
                      </Button>
                    </div>
                    {formData.features[lang].map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(lang, index, e.target.value)}
                          placeholder={`Характеристика ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(lang, index)}
                        >
                          Удалить
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Настройки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                   <div className="flex items-center justify-between">
                     <Label htmlFor="category">
                       Категория
                       {formData.status === 'active' && <span className="text-destructive ml-1">*</span>}
                     </Label>
                     <Button
                       type="button"
                       variant="ghost"
                       size="sm"
                       onClick={() => setCategoryDialogOpen(true)}
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       Новая категория
                     </Button>
                   </div>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      category: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.name.ru}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="manufacturer">Производитель</Label>
                  <Select
                    value={formData.manufacturer_id}
                    onValueChange={(value) => {
                      const manufacturer = manufacturers.find(m => m.id === value);
                      setFormData(prev => ({
                        ...prev,
                        manufacturer_id: value,
                        country: manufacturer?.country_code || prev.country,
                        icon_url: manufacturer?.logo_url || prev.icon_url
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите производителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="country">Страна-производитель</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      country: value
                    }))}
                    disabled={!!formData.manufacturer_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.manufacturer_id ? "Заполняется автоматически" : "Выберите страну"} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name.ru}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <ImageUpload
                    label="Иконка производителя"
                    value={formData.icon_url}
                    onChange={(url) => setFormData(prev => ({
                      ...prev,
                      icon_url: url || ''
                    }))}
                    imageType="gallery"
                    galleryIndex={999}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="priceOnRequest"
                        checked={formData.price === 'on_request'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({...prev, price: 'on_request'}));
                          } else {
                            setFormData(prev => ({...prev, price: ''}));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="priceOnRequest">Цена по запросу</Label>
                    </div>
                    
                    {formData.price !== 'on_request' && (
                      <div>
                        <Label htmlFor="price">Цена</Label>
                        <Input
                          id="price"
                          type="text"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            price: e.target.value
                          }))}
                          placeholder="Например: 24.000-88.000 или 5000"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Валюта</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value: 'USD' | 'EUR' | 'UZS') => setFormData(prev => ({
                        ...prev,
                        currency: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Статус</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      status: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  );
};

export default AddProduct;
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAdminProducts, useAdminProduct } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ProductImageUpload } from '@/components/common/ProductImageUpload';
import { ImageUpload } from '@/components/common/ImageUpload';
import { countries } from '@/utils/countries';
import { useCategories } from '@/hooks/useCategories';
import { useManufacturers } from '@/hooks/useManufacturers';
import { generateSlug } from '@/lib/slugify';

const statusOptions = [
  { value: 'active', label: 'Активный' },
  { value: 'draft', label: 'Черновик' }
];

const EditProduct = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { updateProduct } = useAdminProducts();
  const { product, loading: productLoading, error } = useAdminProduct(id || '');
  const { categories, loading: categoriesLoading } = useCategories();
  const { manufacturers } = useManufacturers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: { ru: '', en: '', uz: '' },
    description: { ru: '', en: '', uz: '' },
    slug: '',
    category: '',
    country: '',
    manufacturer_id: '',
    icon_url: '',
    price: '',
    status: 'draft',
    features: { ru: [''], en: [''], uz: [''] },
    images: { cover: null, gallery: [] }
  });

  useEffect(() => {
    if (product) {
      const productData = product as any;
      setFormData({
        name: product.name,
        description: product.description,
        slug: productData.slug || '',
        category: product.category,
        country: product.country || '',
        manufacturer_id: productData.manufacturer_id || '',
        icon_url: productData.icon_url || '',
        price: product.price || '',
        status: product.status,
        features: product.features || { ru: [''], en: [''], uz: [''] },
        images: product.images || { cover: null, gallery: [] }
      });
    }
  }, [product]);

  if (productLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Загружаем товар...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка загрузки</h2>
        <p className="text-muted-foreground">{error || 'Товар не найден'}</p>
        <Button onClick={() => navigate('/admin/products')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к товарам
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('EditProduct form data on submit:', formData);
    
    // Минимальная валидация для черновиков
    if (!formData.name.ru.trim()) {
      console.log('EditProduct validation failed: name is empty');
      toast({
        variant: 'destructive',
        title: 'Ошибка валидации',
        description: 'Название на русском языке обязательно'
      });
      return;
    }
    
    // Полная валидация для публикации
    if (formData.status === 'active') {
      console.log('EditProduct validating for active status');
      
      if (!formData.description.ru.trim()) {
        console.log('EditProduct validation failed: description is empty');
        toast({
          variant: 'destructive',
          title: 'Ошибка валидации',
          description: 'Для публикации товара необходимо описание на русском языке'
        });
        return;
      }
      
      if (!formData.category) {
        console.log('EditProduct validation failed: category is empty');
        toast({
          variant: 'destructive',
          title: 'Ошибка валидации',
          description: 'Для публикации товара необходимо выбрать категорию'
        });
        return;
      }
      
      if (!formData.images.cover) {
        console.log('EditProduct validation failed: cover image is missing');
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
      const updateData = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug || generateSlug(formData.name.en || formData.name.ru),
        category: formData.category,
        country: formData.country,
        manufacturer_id: formData.manufacturer_id || null,
        icon_url: formData.icon_url || null,
        price: formData.price || null,
        status: formData.status as 'active' | 'draft',
        features: formData.features,
        images: formData.images
      };
      console.log('EditProduct calling updateProduct with data:', updateData);
      await updateProduct(id!, updateData);

      toast({
        title: 'Успешно!',
        description: 'Товар обновлен успешно'
      });
      
      navigate('/admin/products');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить товар'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к товарам
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Редактировать товар</h1>
            <p className="text-muted-foreground">{product.name.ru}</p>
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
          Сохранить изменения
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
                      required
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
              <CardContent className="overflow-hidden">
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
                        {lang === 'ru' && ' *'}
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
                  <Label htmlFor="category">
                    Категория
                    {formData.status === 'active' && <span className="text-destructive ml-1">*</span>}
                  </Label>
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
                        <SelectItem key={category.id} value={category.value}>
                          {category.name[i18n.language as 'ru' | 'en' | 'uz'] || category.name.ru}
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите страну" />
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
                  <ImageUpload
                    label="Иконка производителя"
                    value={formData.icon_url}
                    onChange={(url) => setFormData(prev => ({
                      ...prev,
                      icon_url: url || ''
                    }))}
                    productId={id}
                    imageType="gallery"
                    galleryIndex={999}
                  />
                </div>

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
                    placeholder="Например: 24.000-88.000 EURO или 5000 USD"
                  />
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
    </div>
  );
};

export default EditProduct;
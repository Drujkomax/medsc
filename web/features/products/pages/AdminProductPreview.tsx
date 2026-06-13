import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Package, AlertTriangle, Eye, ExternalLink, CheckCircle, Globe } from "lucide-react";
import { useAdminProduct } from '@/hooks/useProducts';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { getCountryName, getCountryFlag } from '@/utils/countries';


const AdminProductPreview = () => {
  const { i18n } = useTranslation();
  const language = i18n.language as 'ru' | 'en' | 'uz' || 'ru';
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { product, loading, error } = useAdminProduct(id || '');
  const { manufacturers } = useManufacturers();
  const { categories } = useCategories();
  
  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category || c.id === category);
    if (found) return found.name.ru;

    const categoryLabels = {
      diagnostic: 'Диагностическое',
      surgical: 'Хирургическое',
      monitoring: 'Мониторинг',
      laboratory: 'Лабораторное',
      rehabilitation: 'Реабилитационное',
      dental: 'Стоматологическое',
      ophthalmology: 'Офтальмологическое',
      furniture: 'Медицинская мебель'
    };
    
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };
  
  const manufacturer = manufacturers.find(m => m.id === product?.manufacturer_id);
  const countryCode = manufacturer?.country_code || product?.country || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Загружаем товар...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground">{error || 'Товар не найден'}</p>
          <Button onClick={() => navigate('/admin/products')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к товарам
          </Button>
        </div>
      </div>
    );
  }

  // Проверяем готовность к публикации
  const isReadyToPublish = product.name.ru && 
                          product.description.ru && 
                          product.category &&
                          product.images?.cover;

  const missingFields = [];
  if (!product.name.ru) missingFields.push('Название на русском');
  if (!product.description.ru) missingFields.push('Описание на русском');
  if (!product.category) missingFields.push('Категория');
  if (!product.images?.cover) missingFields.push('Главное изображение');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Опубликован';
      case 'draft':
        return 'Черновик';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 border-l-4 border-primary">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Предпросмотр товара (Админская панель)</h2>
                <p className="text-sm text-muted-foreground">
                  Просмотр товара с правами администратора
                </p>
              </div>
            </div>
            <Badge variant={getStatusVariant(product.status)}>
              {getStatusText(product.status)}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к товарам
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
            {product.status === 'active' && (
              <Button 
                variant="outline"
                onClick={() => window.open(`/catalog/products/${product.id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть на сайте
              </Button>
            )}
          </div>
        </div>

        {/* Status Warning for Drafts */}
        {product.status === 'draft' && (
          <Card className="mb-6 border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 mb-1">
                    Товар находится в статусе "Черновик"
                  </h3>
                  {isReadyToPublish ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Товар готов к публикации. Все необходимые поля заполнены.</span>
                    </div>
                  ) : (
                    <div className="text-orange-700 text-sm">
                      <p className="mb-2">Для публикации необходимо дополнить:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {missingFields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Analytics for Admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{product.views_count || 0}</div>
              <div className="text-sm text-muted-foreground">Просмотров</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{product.quote_requests_count || 0}</div>
              <div className="text-sm text-muted-foreground">Запросов КП</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {product.views_count && product.views_count > 0 
                  ? ((product.quote_requests_count || 0) / product.views_count * 100).toFixed(1) + '%'
                  : '0%'}
              </div>
              <div className="text-sm text-muted-foreground">Конверсия</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-muted">
              {product.images?.cover || selectedImage ? (
                <img
                  src={selectedImage || product.images.cover}
                  alt={product.name[language] || 'Изображение товара'}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center flex-col">
                  <Package className="w-24 h-24 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Изображение не добавлено</p>
                </div>
              )}
            </div>

            {/* Gallery */}
            {product.images?.gallery && product.images.gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {/* Cover as first thumbnail */}
                {product.images.cover && (
                  <div 
                    className={`aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border-2 transition-colors ${
                      !selectedImage ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImage(null)}
                  >
                    <img
                      src={product.images.cover}
                      alt="Основное изображение"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                
                {/* Gallery images */}
                {product.images.gallery.map((image, index) => (
                  <div 
                    key={index} 
                    className={`aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border-2 transition-colors ${
                      selectedImage === image ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`Изображение ${index + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {product.name[language] || product.name.ru || 'Название не указано'}
              </h1>
              <div className="flex gap-2 mb-4">
                {product.category && (
                  <Badge variant="outline" className="text-sm">
                    {getCategoryLabel(product.category)}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground">
                {product.description[language] || product.description.ru || 'Описание не добавлено'}
              </p>
            </div>

            {/* Price */}
            {product.price && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    {product.price === 'on_request' ? 'Цена по запросу' : 
                     `${product.price} ${product.currency || 'USD'}`}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {product.features && product.features[language] && product.features[language].length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">✓</span>
                      </div>
                      Ключевые особенности
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {product.features[language].map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-foreground leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manufacturer and Country */}
            {(manufacturer || product.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Производитель</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {manufacturer ? (
                    <div className="space-y-4">
                      {manufacturer.logo_url && (
                        <div className="flex items-center gap-3 pb-3 border-b">
                          <img 
                            src={manufacturer.logo_url} 
                            alt={`${manufacturer.name} logo`}
                            className="h-16 w-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground min-w-[200px]">Название:</span>
                          <span className="font-medium">{manufacturer.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground min-w-[200px]">Производитель:</span>
                          <span className="font-medium">{manufacturer.legal_name || '—'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground min-w-[200px]">Страна:</span>
                          <span className="font-medium flex items-center gap-2">
                            <span className="text-xl leading-none inline-block" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>{getCountryFlag(countryCode)}</span>
                            {getCountryName(countryCode, language) || 'Не указана'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : product.country ? (
                    <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-orange-800 mb-1">
                            Производитель не указан
                          </div>
                          <div className="text-sm text-orange-700 mb-2">
                            Для этого товара не выбран производитель. Отредактируйте товар и выберите производителя из списка.
                          </div>
                          <div className="text-sm text-muted-foreground">Страна производства (указана вручную):</div>
                          <div className="font-medium flex items-center gap-2 mt-1">
                            <span className="text-xl leading-none inline-block" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>{getCountryFlag(product.country)}</span>
                            <span>{getCountryName(product.country, language)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50/50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-orange-800 mb-1">
                            Производитель и страна не указаны
                          </div>
                          <div className="text-sm text-orange-700">
                            Отредактируйте товар и выберите производителя из списка, чтобы автоматически подтянулись название, логотип и страна.
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            <span>Страна не указана</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Admin Meta Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Метаданные товара</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{product.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создан:</span>
                    <span>{new Date(product.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Обновлен:</span>
                    <span>{new Date(product.updated_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductPreview;

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit2, Package, AlertTriangle, Eye } from "lucide-react";
import { useAdminProduct } from '@/hooks/useProducts';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { getCountryName, getCountryFlag } from '@/utils/countries';

const getCategoryLabel = (category: string, language: 'ru' | 'en' | 'uz') => {
  const categoryLabels = {
    diagnostic: { ru: 'Диагностическое', en: 'Diagnostic', uz: 'Diagnostika' },
    surgical: { ru: 'Хирургическое', en: 'Surgical', uz: 'Jarrohlik' },
    monitoring: { ru: 'Мониторинг', en: 'Monitoring', uz: 'Monitoring' },
    laboratory: { ru: 'Лабораторное', en: 'Laboratory', uz: 'Laboratoriya' },
    rehabilitation: { ru: 'Реабилитационное', en: 'Rehabilitation', uz: 'Reabilitatsiya' },
    dental: { ru: 'Стоматологическое', en: 'Dental', uz: 'Stomatologiya' },
    ophthalmology: { ru: 'Офтальмологическое', en: 'Ophthalmology', uz: 'Oftalmologiya' },
    furniture: { ru: 'Медицинская мебель', en: 'Medical Furniture', uz: 'Tibbiy mebel' }
  };
  
  return categoryLabels[category as keyof typeof categoryLabels]?.[language] || category;
};

const ProductPreview = () => {
  const { i18n } = useTranslation();
  const language = i18n.language as 'ru' | 'en' | 'uz' || 'ru';
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { product, loading, error } = useAdminProduct(id || '');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
            <Button 
              variant="outline"
              onClick={() => navigate(`/catalog/products/${product.id}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Просмотр как пользователь
            </Button>
          </div>
        </div>

        {/* Статус предупреждение */}
        {product.status === 'draft' && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-1">
                    Предпросмотр черновика
                  </h3>
                  {isReadyToPublish ? (
                    <p className="text-orange-700 text-sm">
                      Товар готов к публикации. Все необходимые поля заполнены.
                    </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {product.images?.cover || selectedImage ? (
                <img
                  src={selectedImage || product.images.cover}
                  alt={product.name[language] || 'Изображение товара'}
                  className="w-full h-full object-cover"
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
                      className="w-full h-full object-cover"
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
                      className="w-full h-full object-cover"
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
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {product.status === 'draft' ? 'Черновик' : 
                   product.status === 'active' ? 'Активный' : 'Архив'}
                </Badge>
                {product.category && (
                  <Badge variant="outline" className="text-sm">
                    {getCategoryLabel(product.category, language)}
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

            {/* Country */}
            {product.country && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Страна производства</div>
                  <div className="font-medium flex items-center gap-2">
                    <span className="text-xl leading-none inline-block" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>{getCountryFlag(product.country)}</span>
                    <span>{getCountryName(product.country, language)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;

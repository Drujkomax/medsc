import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/common/ImageUpload';
import { countries } from '@/utils/countries';

const categories = [
  { value: 'diagnostic', label: { ru: 'Диагностическое', en: 'Diagnostic', uz: 'Diagnostika' } },
  { value: 'surgical', label: { ru: 'Хирургическое', en: 'Surgical', uz: 'Jarrohlik' } },
  { value: 'monitoring', label: { ru: 'Мониторинг', en: 'Monitoring', uz: 'Monitoring' } },
  { value: 'laboratory', label: { ru: 'Лабораторное', en: 'Laboratory', uz: 'Laboratoriya' } },
  { value: 'rehabilitation', label: { ru: 'Реабилитационное', en: 'Rehabilitation', uz: 'Reabilitatsiya' } },
  { value: 'dental', label: { ru: 'Стоматологическое', en: 'Dental', uz: 'Stomatologiya' } },
  { value: 'ophthalmology', label: { ru: 'Офтальмологическое', en: 'Ophthalmology', uz: 'Oftalmologiya' } },
  { value: 'furniture', label: { ru: 'Медицинская мебель', en: 'Medical Furniture', uz: 'Tibbiy mebel' } }
];

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductDialog = ({ product, open, onOpenChange }: EditProductDialogProps) => {
  const { updateProduct } = useProducts();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: { ru: '', en: '', uz: '' },
    description: { ru: '', en: '', uz: '' },
    category: '',
    country: '',
    images: { cover: null as string | null, gallery: [null, null] as (string | null)[] },
    features: { ru: [''], en: [''], uz: [''] },
    status: 'active' as 'active' | 'draft'
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        country: product.country || '',
        images: product.images || { cover: null, gallery: [null, null] },
        features: product.features || { ru: [''], en: [''], uz: [''] },
        status: product.status
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    try {
      setLoading(true);
      
      // Prepare features - filter out empty strings
      const cleanFeatures = {
        ru: formData.features.ru.filter(f => f.trim() !== ''),
        en: formData.features.en.filter(f => f.trim() !== ''),
        uz: formData.features.uz.filter(f => f.trim() !== '')
      };

      // Prepare images - filter out null values from gallery
      const cleanImages = {
        cover: formData.images.cover,
        gallery: formData.images.gallery.filter(img => img !== null) as string[]
      };

      await updateProduct(product.id, {
        ...formData,
        images: cleanImages,
        features: cleanFeatures
      });

      toast({
        title: "Товар обновлен",
        description: "Изменения успешно сохранены",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при обновлении товара",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (lang: 'ru' | 'en' | 'uz', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [lang]: prev.features[lang].map((f, i) => i === index ? value : f)
      }
    }));
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать товар</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name-ru">Название (RU)</Label>
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
                  <Label htmlFor="name-en">Name (EN)</Label>
                  <Input
                    id="name-en"
                    value={formData.name.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, en: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name-uz">Nomi (UZ)</Label>
                  <Input
                    id="name-uz"
                    value={formData.name.uz}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, uz: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>

              {/* Description fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="desc-ru">Описание (RU)</Label>
                  <Textarea
                    id="desc-ru"
                    value={formData.description.ru}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, ru: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="desc-en">Description (EN)</Label>
                  <Textarea
                    id="desc-en"
                    value={formData.description.en}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, en: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="desc-uz">Tavsif (UZ)</Label>
                  <Textarea
                    id="desc-uz"
                    value={formData.description.uz}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, uz: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>

              {/* Category and Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Категория</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label.ru}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Страна-производитель</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите страну" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg leading-none inline-block" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>{country.flag}</span>
                            <span>{country.name.ru}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Изображения товара</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImageUpload
                  label="Обложка"
                  value={formData.images.cover}
                  onChange={(url) => setFormData(prev => ({
                    ...prev,
                    images: { ...prev.images, cover: url }
                  }))}
                  productId={product?.id}
                  imageType="cover"
                />
                <ImageUpload
                  label="Изображение 2"
                  value={formData.images.gallery[0]}
                  onChange={(url) => setFormData(prev => ({
                    ...prev,
                    images: { 
                      ...prev.images, 
                      gallery: [url, prev.images.gallery[1]]
                    }
                  }))}
                  productId={product?.id}
                  imageType="gallery"
                  galleryIndex={0}
                />
                <ImageUpload
                  label="Изображение 3"
                  value={formData.images.gallery[1]}
                  onChange={(url) => setFormData(prev => ({
                    ...prev,
                    images: { 
                      ...prev.images, 
                      gallery: [prev.images.gallery[0], url]
                    }
                  }))}
                  productId={product?.id}
                  imageType="gallery"
                  galleryIndex={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Особенности товара</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(['ru', 'en', 'uz'] as const).map((lang) => (
                <div key={lang} className="space-y-3">
                  <Label className="text-sm font-medium">{lang.toUpperCase()}</Label>
                  {formData.features[lang].map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(lang, index, e.target.value)}
                        placeholder={`Особенность ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.features[lang].length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(lang, index)}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFeature(lang)}
                  >
                    + Добавить особенность
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status and Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки товара</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div>
                  <Label htmlFor="status">Статус</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'draft') => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="draft">Черновик</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить изменения
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: { ru: string; en: string; uz: string; };
    description: { ru: string; en: string; uz: string; };
    category: string;
    image: string;
    features: { ru: string[]; en: string[]; uz: string[]; };
    status: 'active' | 'draft' | 'archived';
    in_stock: boolean;
  }>({
    name: { ru: '', en: '', uz: '' },
    description: { ru: '', en: '', uz: '' },
    category: '',
    image: '',
    features: { ru: [''], en: [''], uz: [''] },
    status: 'active',
    in_stock: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        image: product.image || '',
        features: product.features || { ru: [''], en: [''], uz: [''] },
        status: product.status,
        in_stock: product.in_stock
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);

    try {
      await updateProduct(product.id, {
        ...formData,
        features: {
          ru: formData.features.ru.filter(f => f.trim()),
          en: formData.features.en.filter(f => f.trim()),
          uz: formData.features.uz.filter(f => f.trim())
        }
      });
      
      toast.success('Товар успешно обновлен');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении товара');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать товар</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Category and Image */}
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
              <Label htmlFor="image">URL изображения</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Особенности</Label>
            {(['ru', 'en', 'uz'] as const).map(lang => (
              <div key={lang} className="space-y-2">
                <Label className="text-sm">{lang.toUpperCase()}</Label>
                {formData.features[lang].map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(lang, index, e.target.value)}
                      placeholder={`Особенность ${index + 1}`}
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
                  Добавить особенность
                </Button>
              </div>
            ))}
          </div>

          {/* Status and Stock */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.in_stock}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, in_stock: checked }))}
              />
              <Label>В наличии</Label>
            </div>
            <div>
              <Label htmlFor="status">Статус</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'draft' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активный</SelectItem>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="archived">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
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
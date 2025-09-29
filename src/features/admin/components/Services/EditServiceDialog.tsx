import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useServices, Service } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

export const EditServiceDialog = ({ open, onOpenChange, service }: EditServiceDialogProps) => {
  const { t, i18n } = useTranslation();
  const { updateService, categories } = useServices();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: { ru: '', en: '', uz: '' },
    description: { ru: '', en: '', uz: '' },
    category: '',
    price: '',
    currency: 'USD',
    status: 'active' as 'active' | 'inactive',
    features: []
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: typeof service.title === 'object' ? service.title : { ru: service.title, en: '', uz: '' },
        description: typeof service.description === 'object' ? service.description : { ru: service.description, en: '', uz: '' },
        category: service.category,
        price: service.price || '',
        currency: service.currency,
        status: service.status,
        features: service.features || []
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    setLoading(true);

    try {
      await updateService(service.id, formData);
      toast({
        title: t('common.success'),
        description: t('services.serviceUpdated'),
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Ошибка при обновлении услуги',
      });
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = (nameObj: any) => {
    if (typeof nameObj === 'string') return nameObj;
    if (typeof nameObj === 'object' && nameObj !== null) {
      return nameObj[i18n.language] || nameObj['ru'] || nameObj['en'] || '';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('services.editService')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="title-ru">{t('services.serviceTitle')} (Русский)</Label>
              <Input
                id="title-ru"
                value={formData.title.ru}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  title: { ...prev.title, ru: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="title-en">{t('services.serviceTitle')} (English)</Label>
              <Input
                id="title-en"
                value={formData.title.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  title: { ...prev.title, en: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="title-uz">{t('services.serviceTitle')} (O'zbek)</Label>
              <Input
                id="title-uz"
                value={formData.title.uz}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  title: { ...prev.title, uz: e.target.value }
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="description-ru">{t('services.serviceDescription')} (Русский)</Label>
              <Textarea
                id="description-ru"
                value={formData.description.ru}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, ru: e.target.value }
                }))}
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="description-en">{t('services.serviceDescription')} (English)</Label>
              <Textarea
                id="description-en"
                value={formData.description.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, en: e.target.value }
                }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="description-uz">{t('services.serviceDescription')} (O'zbek)</Label>
              <Textarea
                id="description-uz"
                value={formData.description.uz}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: { ...prev.description, uz: e.target.value }
                }))}
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">{t('services.serviceCategory')}</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.value}>
                      {getLocalizedName(category.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">{t('services.serviceStatus')}</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('services.active')}</SelectItem>
                  <SelectItem value="inactive">{t('services.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">{t('services.servicePrice')}</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="По запросу"
              />
            </div>
            <div>
              <Label htmlFor="currency">{t('services.serviceCurrency')}</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="UZS">UZS</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
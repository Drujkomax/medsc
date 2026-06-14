import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { ProductImageUpload } from '@/components/common/ProductImageUpload';
import { useWarehouse } from '@/hooks/useWarehouse';
import { useAdminProducts } from '@/hooks/useProducts';

export const AddWarehouseItemDialog = () => {
  const [open, setOpen] = useState(false);
  const [useExistingProduct, setUseExistingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { addItem } = useWarehouse();
  const { products } = useAdminProducts();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: { ru: '', en: '', uz: '' },
    description: { ru: '', en: '', uz: '' },
    images: { cover: null as string | null, gallery: [] as string[] },
    quantity: '',
    unit: 'шт',
    location: '',
    condition: 'new' as 'new' | 'used' | 'refurbished',
    status: 'in_stock' as 'in_stock' | 'reserved' | 'in_transit' | 'sold' | 'written_off' | 'defective',
    purchase_price: '',
    selling_price: '',
    notes: '',
    minimum_stock: '',
    notify_low_stock: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData: any = {
        product_id: useExistingProduct ? selectedProductId : null,
        name: formData.name,
        description: formData.description,
        images: formData.images,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        unit: formData.unit,
        location: formData.location || null,
        condition: formData.condition,
        status: formData.status,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        selling_price: formData.selling_price ? Number(formData.selling_price) : null,
        notes: formData.notes || null,
        minimum_stock: formData.minimum_stock ? Number(formData.minimum_stock) : 0,
        notify_low_stock: formData.notify_low_stock
      };

      await addItem(itemData);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding warehouse item:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: { ru: '', en: '', uz: '' },
      description: { ru: '', en: '', uz: '' },
      images: { cover: null, gallery: [] },
      quantity: '',
      unit: 'шт',
      location: '',
      condition: 'new',
      status: 'in_stock',
      purchase_price: '',
      selling_price: '',
      notes: '',
      minimum_stock: '',
      notify_low_stock: false
    });
    setUseExistingProduct(false);
    setSelectedProductId('');
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        name: product.name,
        description: product.description || { ru: '', en: '', uz: '' },
        images: product.images || { cover: null, gallery: [] }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Добавить товар на склад
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить товар на склад</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle: Use existing product or create new */}
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant={!useExistingProduct ? "default" : "outline"}
              onClick={() => setUseExistingProduct(false)}
            >
              Новый товар
            </Button>
            <Button
              type="button"
              variant={useExistingProduct ? "default" : "outline"}
              onClick={() => setUseExistingProduct(true)}
            >
              Выбрать из каталога
            </Button>
          </div>

          {useExistingProduct ? (
            <div>
              <Label>Товар из каталога</Label>
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите товар" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name.ru}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Название (Русский)</Label>
                  <Input
                    required
                    value={formData.name.ru}
                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ru: e.target.value }})}
                  />
                </div>
                <div>
                  <Label>Название (English)</Label>
                  <Input
                    value={formData.name.en}
                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value }})}
                  />
                </div>
                <div>
                  <Label>Название (O'zbek)</Label>
                  <Input
                    value={formData.name.uz}
                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, uz: e.target.value }})}
                  />
                </div>
              </div>

              <ProductImageUpload
                images={formData.images}
                onImagesChange={(images) => {
                  const newImages = typeof images === 'function' ? images(formData.images) : images;
                  setFormData({ ...formData, images: newImages });
                }}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Количество *</Label>
              <Input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Единица измерения</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="шт">Штук</SelectItem>
                  <SelectItem value="кг">Килограмм</SelectItem>
                  <SelectItem value="л">Литр</SelectItem>
                  <SelectItem value="м">Метр</SelectItem>
                  <SelectItem value="упак">Упаковка</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Местоположение на складе</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Напр. Стеллаж A1"
              />
            </div>
            <div>
              <Label>Состояние</Label>
              <Select value={formData.condition} onValueChange={(value: any) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Новое</SelectItem>
                  <SelectItem value="used">Б/У</SelectItem>
                  <SelectItem value="refurbished">Восстановленное</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Статус</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">На складе</SelectItem>
                <SelectItem value="reserved">В резерве</SelectItem>
                <SelectItem value="in_transit">В пути</SelectItem>
                <SelectItem value="sold">Продан</SelectItem>
                <SelectItem value="written_off">Списан</SelectItem>
                <SelectItem value="defective">Брак</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Закупочная цена</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>
            <div>
              <Label>Цена продажи</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              />
            </div>
          </div>

          {/* Low Stock Notification Settings */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h3 className="font-medium text-sm">Уведомления о низких остатках</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Включить уведомления</Label>
                <p className="text-sm text-muted-foreground">
                  Получать уведомления когда количество достигнет минимума
                </p>
              </div>
              <Switch
                checked={formData.notify_low_stock}
                onCheckedChange={(checked) => setFormData({ ...formData, notify_low_stock: checked })}
              />
            </div>

            {formData.notify_low_stock && (
              <div>
                <Label>Минимальное количество</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                  placeholder="Укажите минимальное количество для уведомления"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Уведомление появится когда количество будет ≤ {formData.minimum_stock || 0} {formData.unit}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label>Заметки</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Добавление...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
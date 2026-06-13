import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ProductImageUpload } from '@/components/common/ProductImageUpload';
import { useWarehouse, WarehouseItem } from '@/hooks/useWarehouse';

interface EditWarehouseItemDialogProps {
  item: WarehouseItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditWarehouseItemDialog = ({ item, open, onOpenChange }: EditWarehouseItemDialogProps) => {
  const { updateItem } = useWarehouse();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || { ru: '', en: '', uz: '' },
    images: item.images,
    quantity: item.quantity.toString(),
    unit: item.unit,
    location: item.location || '',
    condition: item.condition,
    status: (item as any).status || 'in_stock',
    purchase_price: item.purchase_price?.toString() || '',
    selling_price: item.selling_price?.toString() || '',
    notes: item.notes || '',
    minimum_stock: (item.minimum_stock || 0).toString(),
    notify_low_stock: item.notify_low_stock || false
  });

  useEffect(() => {
    setFormData({
      name: item.name,
      description: item.description || { ru: '', en: '', uz: '' },
      images: item.images,
      quantity: item.quantity.toString(),
      unit: item.unit,
      location: item.location || '',
      condition: item.condition,
      status: (item as any).status || 'in_stock',
      purchase_price: item.purchase_price?.toString() || '',
      selling_price: item.selling_price?.toString() || '',
      notes: item.notes || '',
      minimum_stock: (item.minimum_stock || 0).toString(),
      notify_low_stock: item.notify_low_stock || false
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData: any = {
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

      await updateItem(item.id, itemData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating warehouse item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать товар на складе</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
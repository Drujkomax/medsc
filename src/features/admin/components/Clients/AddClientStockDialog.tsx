import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useClientStock } from '@/hooks/useClientStock';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouse } from '@/hooks/useWarehouse';

interface AddClientStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onAdded: () => void;
}

export default function AddClientStockDialog({ open, onOpenChange, clientId, onAdded }: AddClientStockDialogProps) {
  const { addItem } = useClientStock(clientId);
  const { products } = useProducts();
  const { items: warehouseItems } = useWarehouse();
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'product' | 'warehouse' | 'custom'>('custom');
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_item_id: '',
    custom_item_name: { ru: '', en: '', uz: '' },
    custom_item_description: '',
    quantity: '',
    unit: 'шт',
    minimum_stock: '',
    notify_low_stock: false,
    notification_threshold_days: '30',
    average_monthly_consumption: '',
    location: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: any = {
        client_id: clientId,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        unit: formData.unit,
        minimum_stock: formData.minimum_stock ? Number(formData.minimum_stock) : 0,
        notify_low_stock: formData.notify_low_stock,
        notification_threshold_days: Number(formData.notification_threshold_days),
        average_monthly_consumption: formData.average_monthly_consumption ? Number(formData.average_monthly_consumption) : null,
        location: formData.location || null,
        notes: formData.notes || null
      };

      if (sourceType === 'product') {
        data.product_id = formData.product_id;
      } else if (sourceType === 'warehouse') {
        data.warehouse_item_id = formData.warehouse_item_id;
      } else {
        data.custom_item_name = formData.custom_item_name;
        data.custom_item_description = formData.custom_item_description;
      }

      await addItem(data);
      onAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        product_id: '',
        warehouse_item_id: '',
        custom_item_name: { ru: '', en: '', uz: '' },
        custom_item_description: '',
        quantity: '',
        unit: 'шт',
        minimum_stock: '',
        notify_low_stock: false,
        notification_threshold_days: '30',
        average_monthly_consumption: '',
        location: '',
        notes: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить товар в инвентарь</DialogTitle>
          <DialogDescription>Выберите товар из каталога или добавьте новый</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="custom">Новый товар</TabsTrigger>
              <TabsTrigger value="product">Из каталога</TabsTrigger>
              <TabsTrigger value="warehouse">Со склада</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="space-y-3">
              <Label>Выберите товар из каталога</Label>
              <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите товар" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.ru || p.name.en || p.name.uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="warehouse" className="space-y-3">
              <Label>Выберите товар со склада</Label>
              <Select value={formData.warehouse_item_id} onValueChange={(v) => setFormData({ ...formData, warehouse_item_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите товар" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseItems.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name.ru || w.name.en || w.name.uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="custom" className="space-y-3">
              <div>
                <Label>Название (RU) *</Label>
                <Input
                  required={sourceType === 'custom'}
                  value={formData.custom_item_name.ru}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_item_name: { ...formData.custom_item_name, ru: e.target.value }
                  })}
                  placeholder="Расходники для аппарата"
                />
              </div>
              <div>
                <Label>Название (EN)</Label>
                <Input
                  value={formData.custom_item_name.en}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_item_name: { ...formData.custom_item_name, en: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Название (UZ)</Label>
                <Input
                  value={formData.custom_item_name.uz}
                  onChange={(e) => setFormData({
                    ...formData,
                    custom_item_name: { ...formData.custom_item_name, uz: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={formData.custom_item_description}
                  onChange={(e) => setFormData({ ...formData, custom_item_description: e.target.value })}
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Количество *</Label>
              <Input
                required
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label>Единица измерения</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Местоположение</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Кабинет №5, склад А"
            />
          </div>

          <div>
            <Label>Средний расход в месяц</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.average_monthly_consumption}
              onChange={(e) => setFormData({ ...formData, average_monthly_consumption: e.target.value })}
              placeholder="Для расчета даты окончания"
            />
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label>Уведомлять о низких остатках</Label>
              <Switch
                checked={formData.notify_low_stock}
                onCheckedChange={(v) => setFormData({ ...formData, notify_low_stock: v })}
              />
            </div>
            {formData.notify_low_stock && (
              <>
                <div>
                  <Label>Минимальный остаток</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Порог уведомления (дней)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.notification_threshold_days}
                    onChange={(e) => setFormData({ ...formData, notification_threshold_days: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <Label>Заметки</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Добавить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
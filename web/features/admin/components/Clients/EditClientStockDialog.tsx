import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useClientStock, type ClientStockItem } from '@/hooks/useClientStock';

interface EditClientStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ClientStockItem;
  onUpdated: () => void;
}

export default function EditClientStockDialog({ open, onOpenChange, item, onUpdated }: EditClientStockDialogProps) {
  const { updateItem } = useClientStock(item.client_id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    unit: 'шт',
    minimum_stock: '',
    notify_low_stock: false,
    notification_threshold_days: '30',
    average_monthly_consumption: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        quantity: item.quantity.toString(),
        unit: item.unit,
        minimum_stock: item.minimum_stock?.toString() || '',
        notify_low_stock: item.notify_low_stock || false,
        notification_threshold_days: item.notification_threshold_days?.toString() || '30',
        average_monthly_consumption: item.average_monthly_consumption?.toString() || '',
        location: item.location || '',
        notes: item.notes || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateItem(item.id, {
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        unit: formData.unit,
        minimum_stock: formData.minimum_stock ? Number(formData.minimum_stock) : 0,
        notify_low_stock: formData.notify_low_stock,
        notification_threshold_days: Number(formData.notification_threshold_days),
        average_monthly_consumption: formData.average_monthly_consumption ? Number(formData.average_monthly_consumption) : null,
        location: formData.location || null,
        notes: formData.notes || null
      });
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактировать товар</DialogTitle>
          <DialogDescription>Обновите количество и параметры</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>Единица</Label>
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
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
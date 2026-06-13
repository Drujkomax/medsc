import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWarehouse } from '@/hooks/useWarehouse';
import { Archive, DollarSign, MapPin } from 'lucide-react';

interface BulkActionsDialogProps {
  selectedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type BulkAction = 'update_price' | 'update_location' | 'archive';

export const BulkActionsDialog = ({ selectedIds, open, onOpenChange, onComplete }: BulkActionsDialogProps) => {
  const { updateItem, archiveItem } = useWarehouse();
  const [action, setAction] = useState<BulkAction>('update_price');
  const [loading, setLoading] = useState(false);
  
  const [priceData, setPriceData] = useState({
    selling_price: '',
    purchase_price: ''
  });
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (action === 'archive') {
        await Promise.all(selectedIds.map(id => archiveItem(id)));
      } else if (action === 'update_location') {
        await Promise.all(selectedIds.map(id => 
          updateItem(id, { location: location || null })
        ));
      } else if (action === 'update_price') {
        const updates: any = {};
        if (priceData.selling_price) {
          updates.selling_price = Number(priceData.selling_price);
        }
        if (priceData.purchase_price) {
          updates.purchase_price = Number(priceData.purchase_price);
        }
        await Promise.all(selectedIds.map(id => updateItem(id, updates)));
      }

      onComplete();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPriceData({ selling_price: '', purchase_price: '' });
    setLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Массовое действие для {selectedIds.length} товаров
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Выберите действие</Label>
            <Select value={action} onValueChange={(value: BulkAction) => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_price">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Обновить цены
                  </div>
                </SelectItem>
                <SelectItem value="update_location">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Изменить местоположение
                  </div>
                </SelectItem>
                <SelectItem value="archive">
                  <div className="flex items-center">
                    <Archive className="h-4 w-4 mr-2" />
                    Архивировать
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'update_price' && (
            <div className="space-y-3">
              <div>
                <Label>Цена продажи</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceData.selling_price}
                  onChange={(e) => setPriceData({ ...priceData, selling_price: e.target.value })}
                  placeholder="Оставьте пустым, чтобы не изменять"
                />
              </div>
              <div>
                <Label>Закупочная цена</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceData.purchase_price}
                  onChange={(e) => setPriceData({ ...priceData, purchase_price: e.target.value })}
                  placeholder="Оставьте пустым, чтобы не изменять"
                />
              </div>
            </div>
          )}

          {action === 'update_location' && (
            <div>
              <Label>Новое местоположение</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Напр. Стеллаж B2"
                required
              />
            </div>
          )}

          {action === 'archive' && (
            <div className="p-4 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive">
                Вы уверены, что хотите архивировать {selectedIds.length} товаров? 
                Эти товары будут скрыты из основного списка.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (action === 'update_price' && !priceData.selling_price && !priceData.purchase_price)}
            >
              {loading ? 'Применение...' : 'Применить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
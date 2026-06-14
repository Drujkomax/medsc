import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface WarehouseFilters {
  condition?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  lowStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface WarehouseFiltersProps {
  filters: WarehouseFilters;
  onFiltersChange: (filters: WarehouseFilters) => void;
  locations: string[];
}

export const WarehouseFiltersPanel = ({ filters, onFiltersChange, locations }: WarehouseFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<WarehouseFilters>(filters);
  const [open, setOpen] = useState(false);

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const resetFilters = () => {
    const emptyFilters: WarehouseFilters = {
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'sortBy' || key === 'sortOrder') return false;
    return value !== undefined && value !== '';
  }).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Фильтры
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Фильтры и сортировка</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Sort By */}
          <div className="space-y-2">
            <Label>Сортировка</Label>
            <Select
              value={localFilters.sortBy || 'created_at'}
              onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">По дате добавления</SelectItem>
                <SelectItem value="name">По названию</SelectItem>
                <SelectItem value="quantity">По количеству</SelectItem>
                <SelectItem value="selling_price">По цене продажи</SelectItem>
                <SelectItem value="purchase_price">По цене закупки</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Порядок</Label>
            <Select
              value={localFilters.sortOrder || 'desc'}
              onValueChange={(value: 'asc' | 'desc') => setLocalFilters({ ...localFilters, sortOrder: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">По возрастанию</SelectItem>
                <SelectItem value="desc">По убыванию</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition Filter */}
          <div className="space-y-2">
            <Label>Состояние</Label>
            <Select
              value={localFilters.condition || 'all'}
              onValueChange={(value) => setLocalFilters({ 
                ...localFilters, 
                condition: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все состояния" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все состояния</SelectItem>
                <SelectItem value="new">Новое</SelectItem>
                <SelectItem value="used">Б/У</SelectItem>
                <SelectItem value="refurbished">Восстановленное</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label>Местоположение</Label>
            <Select
              value={localFilters.location || 'all'}
              onValueChange={(value) => setLocalFilters({ 
                ...localFilters, 
                location: value === 'all' ? undefined : value 
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все местоположения" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все местоположения</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Диапазон цен (продажа)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="От"
                  value={localFilters.priceMin || ''}
                  onChange={(e) => setLocalFilters({ 
                    ...localFilters, 
                    priceMin: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="До"
                  value={localFilters.priceMax || ''}
                  onChange={(e) => setLocalFilters({ 
                    ...localFilters, 
                    priceMax: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </div>

          {/* Low Stock Filter */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Только с низкими остатками</Label>
              <p className="text-sm text-muted-foreground">
                Показать товары с количеством ≤ минимума
              </p>
            </div>
            <Switch
              checked={localFilters.lowStock || false}
              onCheckedChange={(checked) => setLocalFilters({ ...localFilters, lowStock: checked })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={applyFilters} className="flex-1">
              Применить
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
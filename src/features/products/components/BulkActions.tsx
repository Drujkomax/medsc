import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Archive, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';

interface BulkActionsProps {
  products: Product[];
  selectedProducts: string[];
  onSelectionChange: (productIds: string[]) => void;
  onBulkAction: (action: string, productIds: string[]) => Promise<void>;
}

export const BulkActions = ({ products, selectedProducts, onSelectionChange, onBulkAction }: BulkActionsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(products.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProducts, productId]);
    } else {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Выберите хотя бы один товар'
      });
      return;
    }

    setIsLoading(true);
    try {
      await onBulkAction(action, selectedProducts);
      onSelectionChange([]);
      
      const actionLabels = {
        'activate': 'активированы',
        'archive': 'архивированы',
        'delete': 'удалены'
      };

      toast({
        title: 'Успешно!',
        description: `${selectedProducts.length} товар(ов) ${actionLabels[action as keyof typeof actionLabels]}`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось выполнить операцию'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAllSelected = products.length > 0 && selectedProducts.length === products.length;
  const isPartialSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  return (
    <div className="space-y-4">
      {/* Bulk Selection Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            className={isPartialSelected ? "data-[state=unchecked]:bg-primary/50" : ""}
          />
          <span className="text-sm font-medium">
            {selectedProducts.length > 0 
              ? `Выбрано ${selectedProducts.length} из ${products.length} товаров`
              : `Выбрать все товары (${products.length})`
            }
          </span>
          {selectedProducts.length > 0 && (
            <Badge variant="secondary">
              {selectedProducts.length}
            </Badge>
          )}
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('activate')}
              disabled={isLoading}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Активировать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('archive')}
              disabled={isLoading}
            >
              <Archive className="w-4 h-4 mr-1" />
              Архивировать
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Удалить
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              <X className="w-4 h-4 mr-1" />
              Отмена
            </Button>
          </div>
        )}
      </div>

      {/* Individual Product Selection */}
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
              selectedProducts.includes(product.id) 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-background hover:bg-muted/30'
            }`}
          >
            <Checkbox
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={(checked) => handleProductSelect(product.id, checked as boolean)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium truncate">{product.name.ru}</span>
                <Badge 
                  variant={product.status === 'active' ? 'default' : product.status === 'draft' ? 'secondary' : 'outline'}
                  className="shrink-0"
                >
                  {product.status === 'active' ? 'Активный' : product.status === 'draft' ? 'Черновик' : 'Архив'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {product.description.ru}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
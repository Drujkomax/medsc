import { useState, useEffect } from 'react';
import { useClientStock, type ClientStockItem } from '@/hooks/useClientStock';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouse } from '@/hooks/useWarehouse';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Package, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import AddClientStockDialog from './AddClientStockDialog';
import EditClientStockDialog from './EditClientStockDialog';
import StockTransactionsDialog from './StockTransactionsDialog';

interface ClientStockTabProps {
  clientId: string;
}

export default function ClientStockTab({ clientId }: ClientStockTabProps) {
  const { items, loading, deleteItem, refetch } = useClientStock(clientId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientStockItem | null>(null);
  const [viewingTransactions, setViewingTransactions] = useState<string | null>(null);

  const getItemName = (item: ClientStockItem) => {
    if (item.custom_item_name) {
      return item.custom_item_name.ru || item.custom_item_name.en || item.custom_item_name.uz;
    }
    return 'Товар из каталога';
  };

  const getStockStatus = (item: ClientStockItem) => {
    if (item.quantity === 0) {
      return { label: 'Закончился', variant: 'destructive' as const };
    }
    if (item.notify_low_stock && item.quantity <= item.minimum_stock) {
      return { label: 'Низкий', variant: 'secondary' as const };
    }
    return { label: 'В наличии', variant: 'default' as const };
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить этот товар из инвентаря?')) {
      await deleteItem(id);
      refetch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Инвентарь клиники</h3>
          <p className="text-sm text-muted-foreground">Управление товарами и расходниками</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить товар
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет товаров в инвентаре</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Расход/мес</TableHead>
                <TableHead>Закончится</TableHead>
                <TableHead>Местоположение</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getItemName(item)}</div>
                        {item.custom_item_description && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {item.custom_item_description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.quantity}</span>
                        <span className="text-muted-foreground text-sm">{item.unit}</span>
                        {item.notify_low_stock && (
                          <span className="text-xs text-muted-foreground">
                            (мин: {item.minimum_stock})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.average_monthly_consumption ? (
                        <span className="text-sm">
                          {item.average_monthly_consumption} {item.unit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.estimated_depletion_date ? (
                        <span className="text-sm">
                          {format(new Date(item.estimated_depletion_date), 'dd.MM.yyyy')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.location || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTransactions(item.id)}
                        >
                          <Package className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <AddClientStockDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        clientId={clientId}
        onAdded={refetch}
      />

      {editingItem && (
        <EditClientStockDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onUpdated={() => {
            setEditingItem(null);
            refetch();
          }}
        />
      )}

      {viewingTransactions && (
        <StockTransactionsDialog
          open={!!viewingTransactions}
          onOpenChange={(open) => !open && setViewingTransactions(null)}
          clientStockId={viewingTransactions}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useClientStock, type StockTransaction } from '@/hooks/useClientStock';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface StockTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientStockId: string;
}

export default function StockTransactionsDialog({ open, onOpenChange, clientStockId }: StockTransactionsDialogProps) {
  const { getTransactions } = useClientStock();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientStockId) {
      loadTransactions();
    }
  }, [clientStockId]);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await getTransactions(clientStockId);
    setTransactions(data);
    setLoading(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'outgoing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'initial': return 'Начальный';
      case 'incoming': return 'Приход';
      case 'outgoing': return 'Расход';
      case 'adjustment': return 'Корректировка';
      case 'transfer': return 'Перемещение';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>История операций</DialogTitle>
          <DialogDescription>Все изменения количества товара</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div>Загрузка...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Нет операций
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>До</TableHead>
                <TableHead>После</TableHead>
                <TableHead>Примечание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell>
                    {format(new Date(t.created_at), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(t.transaction_type)}
                      <Badge variant="outline">{getTransactionLabel(t.transaction_type)}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={
                      t.transaction_type === 'incoming' ? 'text-green-600 font-semibold' :
                      t.transaction_type === 'outgoing' ? 'text-red-600 font-semibold' :
                      ''
                    }>
                      {t.transaction_type === 'incoming' ? '+' : t.transaction_type === 'outgoing' ? '-' : ''}
                      {t.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{t.quantity_before}</TableCell>
                  <TableCell className="font-semibold">{t.quantity_after}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {t.reason || t.notes || '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
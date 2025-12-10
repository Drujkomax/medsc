import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'secondary' },
  paid: { label: 'Оплачен', variant: 'default' },
  overdue: { label: 'Просрочен', variant: 'destructive' },
  cancelled: { label: 'Отменён', variant: 'outline' },
};

export default function ClinicInvoicesTab({ clientId }: { clientId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [clientId]);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <p className="text-muted-foreground">Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Счета</h3>
          <p className="text-sm text-muted-foreground">Выставленные счета</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Создать счёт
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет счетов</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№ счёта</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата выставления</TableHead>
                <TableHead>Срок оплаты</TableHead>
                <TableHead>Дата оплаты</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => {
                const status = STATUS_LABELS[invoice.status] || STATUS_LABELS.pending;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.issue_date), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date 
                        ? format(new Date(invoice.due_date), 'dd.MM.yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {invoice.paid_date 
                        ? format(new Date(invoice.paid_date), 'dd.MM.yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

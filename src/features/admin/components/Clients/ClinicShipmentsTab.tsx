import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Truck } from 'lucide-react';
import { format } from 'date-fns';

interface Shipment {
  id: string;
  shipment_number: string | null;
  status: string;
  shipped_date: string | null;
  delivered_date: string | null;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ожидает', variant: 'secondary' },
  shipped: { label: 'Отправлено', variant: 'default' },
  in_transit: { label: 'В пути', variant: 'outline' },
  delivered: { label: 'Доставлено', variant: 'default' },
  cancelled: { label: 'Отменено', variant: 'destructive' },
};

export default function ClinicShipmentsTab({ clientId }: { clientId: string }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipments();
  }, [clientId]);

  const loadShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_shipments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (err) {
      console.error('Error loading shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Загрузка...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Отгрузки</h3>
          <p className="text-sm text-muted-foreground">История отправок товаров</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Добавить отгрузку
        </Button>
      </div>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет отгрузок</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№ отгрузки</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата отправки</TableHead>
                <TableHead>Дата доставки</TableHead>
                <TableHead>Перевозчик</TableHead>
                <TableHead>Трекинг</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map(shipment => {
                const status = STATUS_LABELS[shipment.status] || STATUS_LABELS.pending;
                return (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.shipment_number || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {shipment.shipped_date 
                        ? format(new Date(shipment.shipped_date), 'dd.MM.yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {shipment.delivered_date 
                        ? format(new Date(shipment.delivered_date), 'dd.MM.yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>{shipment.carrier || '—'}</TableCell>
                    <TableCell>{shipment.tracking_number || '—'}</TableCell>
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

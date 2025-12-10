import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface Deal {
  id: string;
  title: string;
  amount: number | null;
  stage: string;
  payment_status: string | null;
  created_at: string;
  close_date: string | null;
}

const STAGE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  lead: { label: 'Лид', variant: 'secondary' },
  qualified: { label: 'Квалифицирован', variant: 'outline' },
  proposal: { label: 'Предложение', variant: 'default' },
  negotiation: { label: 'Переговоры', variant: 'default' },
  closed_won: { label: 'Закрыто (успех)', variant: 'default' },
  closed_lost: { label: 'Закрыто (провал)', variant: 'destructive' },
};

export default function ClinicDealsTab({ clientId }: { clientId: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, [clientId]);

  const loadDeals = async () => {
    try {
      // Get leads linked to this client, then get deals linked to those leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('client_id', clientId);

      if (!leads || leads.length === 0) {
        setDeals([]);
        setLoading(false);
        return;
      }

      const leadIds = leads.map(l => l.id);
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (err) {
      console.error('Error loading deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'USD',
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
          <h3 className="text-lg font-semibold">Сделки</h3>
          <p className="text-sm text-muted-foreground">Сделки связанные с клиникой</p>
        </div>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Нет сделок для этой клиники</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Стадия</TableHead>
                <TableHead>Статус оплаты</TableHead>
                <TableHead>Создано</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map(deal => {
                const stage = STAGE_LABELS[deal.stage] || STAGE_LABELS.lead;
                return (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>{formatAmount(deal.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={stage.variant}>{stage.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deal.payment_status || 'Ожидание'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(deal.created_at), 'dd.MM.yyyy')}
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

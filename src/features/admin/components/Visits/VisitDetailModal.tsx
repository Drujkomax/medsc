import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Building2, Clock } from 'lucide-react';
import VisitStageCard from './VisitStageCard';
import { getVisitDetail } from './useVisits';
import type { Visit, VisitStage } from './types';

interface Props {
  visitId: string | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_progress: { label: 'В процессе', variant: 'secondary' },
  completed:   { label: 'Завершён',   variant: 'default' },
  abandoned:   { label: 'Брошен',     variant: 'outline' },
};

const OUTCOME_LABEL: Record<string, string> = {
  success: 'Успех',
  interested: 'Интерес',
  rejected: 'Отказ',
  postponed: 'Перенос',
};

export default function VisitDetailModal({ visitId, onClose }: Props) {
  const [data, setData] = useState<{
    visit: Visit;
    stages: VisitStage[];
    rep: { id: string; full_name: string | null; email: string | null } | null;
    clinic_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visitId) return;
    setLoading(true);
    getVisitDetail(visitId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [visitId]);

  return (
    <Dialog open={!!visitId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Карточка визита</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Клиника:</span>
                <span className="font-medium">{data.clinic_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Сотрудник:</span>
                <span className="font-medium">{data.rep?.full_name ?? data.rep?.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Начат:</span>
                <span>{new Date(data.visit.started_at).toLocaleString('ru-RU')}</span>
              </div>
              {data.visit.completed_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Завершён:</span>
                  <span>{new Date(data.visit.completed_at).toLocaleString('ru-RU')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={STATUS_LABEL[data.visit.status]?.variant ?? 'outline'}>
                {STATUS_LABEL[data.visit.status]?.label ?? data.visit.status}
              </Badge>
              {data.visit.outcome && (
                <Badge variant="secondary">{OUTCOME_LABEL[data.visit.outcome] ?? data.visit.outcome}</Badge>
              )}
              {data.visit.pending_clinic && (
                <Badge variant="outline">Не из базы клиник</Badge>
              )}
            </div>

            {data.visit.outcome_comment && (
              <div className="text-sm bg-muted/50 px-3 py-2 rounded">
                <b>Итог:</b> {data.visit.outcome_comment}
              </div>
            )}

            <div className="space-y-3">
              {data.stages.length === 0 && (
                <div className="text-sm text-muted-foreground italic">Этапы не заполнены.</div>
              )}
              {data.stages.map((s) => (
                <VisitStageCard key={s.id} stage={s} />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

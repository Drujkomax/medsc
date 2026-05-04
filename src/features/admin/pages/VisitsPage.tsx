import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2, User, Clock } from 'lucide-react';
import VisitsFilters from '../components/Visits/VisitsFilters';
import VisitDetailModal from '../components/Visits/VisitDetailModal';
import { useVisits } from '../components/Visits/useVisits';
import type { Filters, VisitListRow } from '../components/Visits/types';

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_progress: { label: 'В процессе', variant: 'secondary' },
  completed:   { label: 'Завершён',   variant: 'default' },
  abandoned:   { label: 'Брошен',     variant: 'outline' },
};

const OUTCOME_LABEL: Record<string, { label: string; emoji: string }> = {
  success:    { label: 'Успех',   emoji: '✅' },
  interested: { label: 'Интерес', emoji: '🤔' },
  rejected:   { label: 'Отказ',   emoji: '❌' },
  postponed:  { label: 'Перенос', emoji: '📅' },
};

function StagesDots({ done }: { done: number }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i < done ? 'bg-primary' : 'bg-muted'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function VisitsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { rows, loading } = useVisits(filters);
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    total: rows.length,
    completed: rows.filter(r => r.status === 'completed').length,
    in_progress: rows.filter(r => r.status === 'in_progress').length,
    abandoned: rows.filter(r => r.status === 'abandoned').length,
  }), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Обход клиник
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Журнал визитов из Telegram-бота
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Всего" value={counts.total} />
        <StatCard label="Завершено" value={counts.completed} accent="text-green-600" />
        <StatCard label="В процессе" value={counts.in_progress} accent="text-amber-600" />
        <StatCard label="Брошено" value={counts.abandoned} accent="text-muted-foreground" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <VisitsFilters value={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Визитов не найдено. Когда сотрудники начнут логировать обход через бота, они появятся здесь.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <VisitRow key={row.id} row={row} onOpen={() => setOpenId(row.id)} />
          ))}
        </div>
      )}

      <VisitDetailModal visitId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function StatCard({ label, value, accent = '' }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function VisitRow({ row, onOpen }: { row: VisitListRow; onOpen: () => void }) {
  const status = STATUS_LABEL[row.status];
  const outcome = row.outcome ? OUTCOME_LABEL[row.outcome] : null;
  const time = new Date(row.started_at).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      onClick={onOpen}
      className="cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardContent className="py-3 flex items-center gap-4">
        <div className="flex flex-col items-center gap-1 min-w-[60px]">
          <StagesDots done={row.stages_done} />
          <span className="text-xs text-muted-foreground">{row.stages_done}/4</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{row.clinic_name}</span>
            {row.pending_clinic && (
              <Badge variant="outline" className="text-xs">не из базы</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {row.rep_name ?? '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {outcome && (
            <span className="text-sm" title={outcome.label}>{outcome.emoji}</span>
          )}
          <Badge variant={status?.variant ?? 'outline'}>
            {status?.label ?? row.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

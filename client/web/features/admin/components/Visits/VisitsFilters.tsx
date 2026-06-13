import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';
import type { Filters, VisitOutcome, VisitStatus } from './types';

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

const ALL = '__all__';

export default function VisitsFilters({ value, onChange }: Props) {
  const { employees } = useEmployeesByRole();

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...value, [k]: v });

  const reset = () => onChange({});

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Поиск по клинике или сотруднику..."
          value={value.search ?? ''}
          onChange={(e) => set('search', e.target.value || undefined)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          value={value.rep_id ?? ALL}
          onValueChange={(v) => set('rep_id', v === ALL ? undefined : v)}
        >
          <SelectTrigger><SelectValue placeholder="Сотрудник" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все сотрудники</SelectItem>
            {employees.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.status ?? ALL}
          onValueChange={(v) => set('status', v === ALL ? undefined : (v as VisitStatus))}
        >
          <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Любой статус</SelectItem>
            <SelectItem value="in_progress">В процессе</SelectItem>
            <SelectItem value="completed">Завершён</SelectItem>
            <SelectItem value="abandoned">Брошен</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={value.outcome ?? ALL}
          onValueChange={(v) => set('outcome', v === ALL ? undefined : (v as VisitOutcome))}
        >
          <SelectTrigger><SelectValue placeholder="Итог" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Любой итог</SelectItem>
            <SelectItem value="success">Успех</SelectItem>
            <SelectItem value="interested">Интерес</SelectItem>
            <SelectItem value="rejected">Отказ</SelectItem>
            <SelectItem value="postponed">Перенос</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            value={value.date_from ?? ''}
            onChange={(e) => set('date_from', e.target.value || undefined)}
            placeholder="От"
          />
          <Input
            type="date"
            value={value.date_to ?? ''}
            onChange={(e) => set('date_to', e.target.value || undefined)}
            placeholder="До"
          />
        </div>
      </div>

      {(value.search || value.rep_id || value.status || value.outcome || value.date_from || value.date_to) && (
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="w-4 h-4 mr-1" />
          Сбросить фильтры
        </Button>
      )}
    </div>
  );
}

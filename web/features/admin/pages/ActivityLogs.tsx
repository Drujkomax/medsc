import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  useActivityLogs,
  type ActivityLogRow,
  type ActivityLogFilters,
} from '@/hooks/useActivityLogs';

type Employee = { id: string; email: string; full_name: string | null };

const TARGET_TYPES = [
  { value: 'leads', label: 'Лиды' },
  { value: 'deals', label: 'Сделки' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'products', label: 'Товары' },
  { value: 'services', label: 'Услуги' },
  { value: 'clients', label: 'Контакты' },
  { value: 'categories', label: 'Категории' },
  { value: 'user_roles', label: 'Роли' },
  { value: 'user_invites', label: 'Приглашения' },
  { value: 'employee_custom_permissions', label: 'Права сотрудников' },
  { value: 'temporary_employees', label: 'Временные сотрудники' },
];

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  INSERT: { label: 'Создание', className: 'bg-green-100 text-green-800 border-green-200' },
  UPDATE: { label: 'Изменение', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  DELETE: { label: 'Удаление', className: 'bg-red-100 text-red-800 border-red-200' },
};

const targetLabel = (t: string | null) =>
  TARGET_TYPES.find((x) => x.value === t)?.label ?? t ?? '—';

const ActivityRow = ({ row }: { row: ActivityLogRow }) => {
  const [open, setOpen] = useState(false);
  const action = ACTION_LABELS[row.action] ?? {
    label: row.action,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const userName = row.user_full_name || row.user_email || row.user_id.slice(0, 8);

  return (
    <>
      <TableRow>
        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
          {format(new Date(row.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{userName}</span>
            {row.user_email && row.user_full_name && (
              <span className="text-xs text-muted-foreground">{row.user_email}</span>
            )}
            {row.user_role && (
              <span className="text-xs text-muted-foreground">{row.user_role}</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={action.className}>
            {action.label}
          </Badge>
        </TableCell>
        <TableCell>{targetLabel(row.target_type)}</TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {row.target_id ? row.target_id.slice(0, 8) + '…' : '—'}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {row.ip_address || '—'}
        </TableCell>
        <TableCell className="text-right">
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent />
          </Collapsible>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/40">
            <pre className="text-xs whitespace-pre-wrap break-all max-h-80 overflow-auto">
              {JSON.stringify(row.details ?? {}, null, 2)}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ActivityLogs = () => {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ActivityLogFilters>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const { rows, total, pageSize, loading, error, refetch } = useActivityLogs(filters, page);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id');
      const ids = Array.from(new Set((roles || []).map((r: any) => r.user_id)));
      if (ids.length === 0) {
        setEmployees([]);
        return;
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ids);
      setEmployees((profiles || []) as Employee[]);
    };
    fetchEmployees();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visibleEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      (e) =>
        (e.email || '').toLowerCase().includes(q) ||
        (e.full_name || '').toLowerCase().includes(q),
    );
  }, [employees, employeeSearch]);

  const updateFilter = <K extends keyof ActivityLogFilters>(
    key: K,
    value: ActivityLogFilters[K] | undefined,
  ) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    setPage(0);
    setFilters({});
    setEmployeeSearch('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-7 w-7" />
            Активность пользователей
          </h2>
          <p className="text-muted-foreground">
            Полная история действий сотрудников: создание, изменение и удаление записей. Видна
            только директору.
          </p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Пользователь</label>
              <Select
                value={filters.userId ?? 'all'}
                onValueChange={(v) => updateFilter('userId', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все пользователи" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Поиск..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  {visibleEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Раздел</label>
              <Select
                value={filters.targetType ?? 'all'}
                onValueChange={(v) => updateFilter('targetType', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все разделы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все разделы</SelectItem>
                  {TARGET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Действие</label>
              <Select
                value={filters.action ?? 'all'}
                onValueChange={(v) => updateFilter('action', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все действия" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все действия</SelectItem>
                  <SelectItem value="INSERT">Создание</SelectItem>
                  <SelectItem value="UPDATE">Изменение</SelectItem>
                  <SelectItem value="DELETE">Удаление</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">От</label>
              <Input
                type="date"
                value={filters.from ?? ''}
                onChange={(e) => updateFilter('from', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">До</label>
              <Input
                type="date"
                value={filters.to ?? ''}
                onChange={(e) =>
                  updateFilter('to', e.target.value ? `${e.target.value}T23:59:59` : undefined)
                }
              />
            </div>
          </div>

          {(filters.userId || filters.targetType || filters.action || filters.from || filters.to) && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : loading ? (
            <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Записей не найдено</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Время</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Раздел</TableHead>
                  <TableHead>ID записи</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right w-12">Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <ActivityRow key={row.id} row={row} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Всего записей: {total.toLocaleString('ru-RU')}
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >
            Назад
          </Button>
          <span>
            Стр. {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1 || loading}
          >
            Вперёд
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;

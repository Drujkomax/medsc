import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, User, Building2, Clock, Pencil, Trash2, Save, X } from 'lucide-react';
import VisitStageCard from './VisitStageCard';
import {
  getVisitDetail, updateVisit, updateVisitStage, deleteVisit, getClientsLite,
} from './useVisits';
import type { Visit, VisitStage } from './types';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Props {
  visitId: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

// director/admin can manage ANY visit; everyone else only their own.
const EDIT_ALL_ROLES = ['director', 'admin'];
const NONE = '__none__';

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_progress: { label: 'В процессе', variant: 'secondary' },
  completed:   { label: 'Завершён',   variant: 'default' },
  abandoned:   { label: 'Брошен',     variant: 'outline' },
};
const STATUS_OPTIONS: Array<[string, string]> = [
  ['in_progress', 'В процессе'], ['completed', 'Завершён'], ['abandoned', 'Брошен'],
];
const OUTCOME_LABEL: Record<string, string> = {
  success: 'Успех', interested: 'Интерес', rejected: 'Отказ', postponed: 'Перенос',
};
const OUTCOME_OPTIONS: Array<[string, string]> = [
  ['success', 'Успех'], ['interested', 'Интерес'], ['rejected', 'Отказ'], ['postponed', 'Перенос'],
];

const STAGE_LABELS: Record<string, string> = {
  arrival: '1. Подход к клинике',
  specialist: '2. Контакт со специалистом',
  briefing: '3. Брифинг',
  completion: '4. Завершение',
};

type DetailData = {
  visit: Visit;
  stages: VisitStage[];
  rep: { id: string; full_name: string | null; email: string | null } | null;
  clinic_name: string;
};

export default function VisitDetailModal({ visitId, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const { role } = useUserRole();
  const { user } = useAuth();

  const [data, setData] = useState<DetailData | null>(null);
  // director/admin manage any visit; everyone else only their own.
  const canManage =
    EDIT_ALL_ROLES.includes(role ?? '') || (!!user && !!data && data.visit.rep_id === user.id);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  // edit form state
  const [status, setStatus] = useState('in_progress');
  const [outcome, setOutcome] = useState(NONE);
  const [outcomeComment, setOutcomeComment] = useState('');
  const [clientId, setClientId] = useState(NONE);
  const [stageNotes, setStageNotes] = useState<Record<string, string>>({});

  const initForm = useCallback((d: DetailData) => {
    setStatus(d.visit.status);
    setOutcome(d.visit.outcome ?? NONE);
    setOutcomeComment(d.visit.outcome_comment ?? '');
    setClientId(d.visit.client_id ?? NONE);
    setStageNotes(Object.fromEntries(d.stages.map((s) => [s.id, s.text_note ?? ''])));
  }, []);

  const reload = useCallback(async (id: string) => {
    setLoading(true);
    const d = await getVisitDetail(id);
    setData(d);
    if (d) initForm(d);
    setLoading(false);
    return d;
  }, [initForm]);

  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
    if (!visitId) { setData(null); return; }
    reload(visitId);
  }, [visitId, reload]);

  const startEdit = async () => {
    if (clients.length === 0) {
      try { setClients(await getClientsLite()); } catch { /* non-fatal */ }
    }
    if (data) initForm(data);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateVisit(data.visit.id, {
        status: status as Visit['status'],
        outcome: outcome === NONE ? null : (outcome as Visit['outcome']),
        outcome_comment: outcomeComment.trim() || null,
        client_id: clientId === NONE ? null : clientId,
      });

      // Persist changed stage notes
      const changed = data.stages.filter(
        (s) => (s.text_note ?? '') !== (stageNotes[s.id] ?? ''),
      );
      for (const s of changed) {
        await updateVisitStage(s.id, { text_note: (stageNotes[s.id] ?? '').trim() || null });
      }

      toast({ title: 'Сохранено', description: 'Изменения визита применены.' });
      await reload(data.visit.id);
      setEditing(false);
      onChanged?.();
    } catch (err) {
      console.error('save visit failed', err);
      toast({
        title: 'Не удалось сохранить',
        description: err instanceof Error ? err.message : 'Проверьте права доступа.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await deleteVisit(data.visit.id);
      toast({ title: 'Визит удалён' });
      setConfirmDelete(false);
      onChanged?.();
      onClose();
    } catch (err) {
      console.error('delete visit failed', err);
      toast({
        title: 'Не удалось удалить',
        description: err instanceof Error ? err.message : 'Проверьте права доступа.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!visitId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-10">
            <DialogTitle>Карточка визита</DialogTitle>
            {!loading && data && canManage && !editing && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-destructive hidden sm:inline">Удалить визит?</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} disabled={saving}>
                    Отмена
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                    Да, удалить
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={startEdit}>
                    <Pencil className="w-4 h-4 mr-1" /> Редактировать
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Удалить
                  </Button>
                </div>
              )
            )}
          </div>
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

            {/* ---------------- VIEW MODE ---------------- */}
            {!editing && (
              <>
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
              </>
            )}

            {/* ---------------- EDIT MODE ---------------- */}
            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Клиника</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger><SelectValue placeholder="Выберите клинику" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>
                          {data.visit.pending_clinic
                            ? `Не из базы: ${data.visit.pending_clinic.name}`
                            : '— без привязки —'}
                        </SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Статус</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Итог</Label>
                    <Select value={outcome} onValueChange={setOutcome}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— не указан —</SelectItem>
                        {OUTCOME_OPTIONS.map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Комментарий к итогу</Label>
                  <Textarea
                    value={outcomeComment}
                    onChange={(e) => setOutcomeComment(e.target.value)}
                    rows={2}
                    placeholder="Например: договорились о повторной встрече"
                  />
                </div>

                {data.stages.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-muted-foreground">Заметки по этапам</Label>
                    {data.stages.map((s) => (
                      <div key={s.id} className="space-y-1.5">
                        <div className="text-sm font-medium">{STAGE_LABELS[s.stage_type] ?? s.stage_type}</div>
                        <Textarea
                          value={stageNotes[s.id] ?? ''}
                          onChange={(e) => setStageNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          rows={2}
                          placeholder="Заметка по этапу"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setEditing(false); initForm(data); }} disabled={saving}>
                    <X className="w-4 h-4 mr-1" /> Отмена
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Сохранить
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

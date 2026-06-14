import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { Filters, Visit, VisitListRow, VisitStage } from './types';

// Roles that see ALL visits; everyone else (salesperson, etc.) sees only their own.
const VISITS_FULL_ACCESS = ['sales_manager', 'director', 'admin'];

// Until Supabase types are regenerated after the migration, cast to `any` for the new tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface ProfileLite { id: string; full_name: string | null; email: string | null }
interface ClientLite  { id: string; name: string }

export function useVisits(filters: Filters) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isFullAccess = VISITS_FULL_ACCESS.includes(role || '');
  const [rows, setRows] = useState<VisitListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = sb
        .from('visits')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(200);

      // Salespeople see only their own visits; managers/director/admin see all.
      if (!isFullAccess && user) q = q.eq('rep_id', user.id);

      if (filters.rep_id)    q = q.eq('rep_id', filters.rep_id);
      if (filters.client_id) q = q.eq('client_id', filters.client_id);
      if (filters.status)    q = q.eq('status', filters.status);
      if (filters.outcome)   q = q.eq('outcome', filters.outcome);
      if (filters.date_from) q = q.gte('started_at', filters.date_from);
      if (filters.date_to)   q = q.lte('started_at', filters.date_to);

      const { data: visits, error } = await q;
      if (error) throw error;
      const list = (visits ?? []) as Visit[];

      const repIds    = [...new Set(list.map(v => v.rep_id))];
      const clientIds = [...new Set(list.map(v => v.client_id).filter(Boolean) as string[])];

      const [profilesRes, clientsRes, stagesRes] = await Promise.all([
        repIds.length
          ? sb.from('profiles').select('id, full_name, email').in('id', repIds)
          : Promise.resolve({ data: [] as ProfileLite[] }),
        clientIds.length
          ? sb.from('clients').select('id, name').in('id', clientIds)
          : Promise.resolve({ data: [] as ClientLite[] }),
        list.length
          ? sb
              .from('visit_stages')
              .select('visit_id')
              .in('visit_id', list.map(v => v.id))
          : Promise.resolve({ data: [] as Array<{ visit_id: string }> }),
      ]);

      const profileMap = new Map<string, ProfileLite>();
      (profilesRes.data ?? []).forEach((p: ProfileLite) => profileMap.set(p.id, p));
      const clientMap = new Map<string, ClientLite>();
      (clientsRes.data ?? []).forEach((c: ClientLite) => clientMap.set(c.id, c));
      const stageCount = new Map<string, number>();
      ((stagesRes.data ?? []) as Array<{ visit_id: string }>).forEach((s) => {
        stageCount.set(s.visit_id, (stageCount.get(s.visit_id) ?? 0) + 1);
      });

      let result: VisitListRow[] = list.map(v => {
        const profile = profileMap.get(v.rep_id);
        const client  = v.client_id ? clientMap.get(v.client_id) : null;
        return {
          ...v,
          rep_name: profile?.full_name ?? profile?.email ?? null,
          clinic_name: client?.name ?? v.pending_clinic?.name ?? '—',
          stages_done: stageCount.get(v.id) ?? 0,
        };
      });

      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(r =>
          r.clinic_name.toLowerCase().includes(query) ||
          (r.rep_name ?? '').toLowerCase().includes(query)
        );
      }

      setRows(result);
    } catch (err) {
      console.error('useVisits load failed', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user, isFullAccess]);

  useEffect(() => { load(); }, [load]);

  return { rows, loading, refetch: load };
}

export async function getVisitDetail(visitId: string): Promise<{ visit: Visit; stages: VisitStage[]; rep: ProfileLite | null; clinic_name: string } | null> {
  const { data: visit, error } = await sb
    .from('visits')
    .select('*')
    .eq('id', visitId)
    .maybeSingle();
  if (error || !visit) return null;
  const v = visit as Visit;

  const [stagesRes, repRes, clientRes] = await Promise.all([
    sb.from('visit_stages').select('*').eq('visit_id', v.id).order('completed_at', { ascending: true }),
    sb.from('profiles').select('id, full_name, email').eq('id', v.rep_id).maybeSingle(),
    v.client_id
      ? sb.from('clients').select('name').eq('id', v.client_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
  ]);

  return {
    visit: v,
    stages: ((stagesRes.data ?? []) as VisitStage[]),
    rep: (repRes.data as ProfileLite) ?? null,
    clinic_name: (clientRes.data?.name as string) ?? v.pending_clinic?.name ?? '—',
  };
}

export async function getSignedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('visits').createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  return data.signedUrl;
}

// ---------- Mutations (web-app management of visits) ----------

export interface VisitPatch {
  status?: Visit['status'];
  outcome?: Visit['outcome'];
  outcome_comment?: string | null;
  client_id?: string | null;
}

export async function updateVisit(visitId: string, patch: VisitPatch): Promise<void> {
  const { error } = await sb.from('visits').update(patch).eq('id', visitId);
  if (error) throw error;
}

export async function updateVisitStage(
  stageId: string,
  patch: { text_note?: string | null },
): Promise<void> {
  const { error } = await sb.from('visit_stages').update(patch).eq('id', stageId);
  if (error) throw error;
}

export async function deleteVisit(visitId: string): Promise<void> {
  // visit_stages cascade-delete via FK ON DELETE CASCADE.
  // .select() lets us detect RLS-blocked / no-op deletes (which return no error).
  const { data, error } = await sb.from('visits').delete().eq('id', visitId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Удаление не выполнено: недостаточно прав или визит уже удалён.');
  }
}

export async function getClientsLite(): Promise<ClientLite[]> {
  const { data, error } = await sb.from('clients').select('id, name').order('name');
  if (error) throw error;
  return (data ?? []) as ClientLite[];
}

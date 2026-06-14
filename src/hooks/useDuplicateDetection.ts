import { useMemo } from 'react';
import { Lead } from './useLeads';

export interface DuplicateGroup {
  leads: Lead[];
  duplicateType: 'name' | 'phone' | 'both';
  score: number;
}

export const useDuplicateDetection = (leads: Lead[]) => {
  const duplicateGroups = useMemo(() => {
    // Same grouping semantics as before (a group = a seed lead + every lead that
    // matches it by normalized name OR phone), but O(n) via key buckets instead
    // of the old O(n^2) lead-by-lead scan that re-normalized phones on every pair.
    const normPhone = (phone?: string) => (phone ? phone.replace(/[\s\-\(\)\+]/g, '') : '');
    const normName = (name?: string) => (name ? name.trim().toLowerCase() : '');

    const active = leads.filter((l) => !l.archived);
    const keyOf = new Map<string, { nk: string; pk: string }>();
    const byName = new Map<string, Lead[]>();
    const byPhone = new Map<string, Lead[]>();
    for (const l of active) {
      const nk = normName(l.name);
      const rawPk = normPhone(l.phone);
      const pk = rawPk.length > 5 ? rawPk : ''; // only meaningful phones
      keyOf.set(l.id, { nk, pk });
      if (nk) {
        let a = byName.get(nk);
        if (!a) byName.set(nk, (a = []));
        a.push(l);
      }
      if (pk) {
        let a = byPhone.get(pk);
        if (!a) byPhone.set(pk, (a = []));
        a.push(l);
      }
    }

    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (const lead of active) {
      if (processed.has(lead.id)) continue;
      const { nk, pk } = keyOf.get(lead.id)!;

      const matches = new Map<string, Lead>();
      const addAll = (cands?: Lead[]) => {
        if (!cands) return;
        for (const o of cands) {
          if (o.id === lead.id || processed.has(o.id)) continue;
          matches.set(o.id, o);
        }
      };
      if (nk) addAll(byName.get(nk));
      if (pk) addAll(byPhone.get(pk));
      if (matches.size === 0) continue;

      const allLeads = [lead, ...matches.values()];

      // Determine duplicate type from how the group members share keys.
      const nameCounts = new Map<string, number>();
      const phoneCounts = new Map<string, number>();
      for (const l of allLeads) {
        const k = keyOf.get(l.id)!;
        if (k.nk) nameCounts.set(k.nk, (nameCounts.get(k.nk) || 0) + 1);
        if (k.pk) phoneCounts.set(k.pk, (phoneCounts.get(k.pk) || 0) + 1);
      }
      const hasNameDuplicates = [...nameCounts.values()].some((c) => c > 1);
      const hasPhoneDuplicates = [...phoneCounts.values()].some((c) => c > 1);

      const duplicateType: 'name' | 'phone' | 'both' =
        hasNameDuplicates && hasPhoneDuplicates ? 'both' : hasNameDuplicates ? 'name' : 'phone';
      const score = duplicateType === 'both' ? 100 : duplicateType === 'phone' ? 85 : 70;

      groups.push({ leads: allLeads, duplicateType, score });
      for (const l of allLeads) processed.add(l.id);
    }

    return groups.sort((a, b) => b.score - a.score);
  }, [leads]);

  const getDuplicatesForLead = (leadId: string): Lead[] => {
    const group = duplicateGroups.find(g => g.leads.some(l => l.id === leadId));
    return group ? group.leads.filter(l => l.id !== leadId) : [];
  };

  const hasDuplicates = duplicateGroups.length > 0;

  return {
    duplicateGroups,
    getDuplicatesForLead,
    hasDuplicates,
    totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.leads.length, 0)
  };
};
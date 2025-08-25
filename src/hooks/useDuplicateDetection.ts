import { useMemo } from 'react';
import { Lead } from './useLeads';

export interface DuplicateGroup {
  leads: Lead[];
  duplicateType: 'name' | 'phone' | 'both';
  score: number;
}

export const useDuplicateDetection = (leads: Lead[]) => {
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    leads.forEach((lead) => {
      if (processed.has(lead.id) || lead.archived) return;

      const duplicates = leads.filter((otherLead) => {
        if (otherLead.id === lead.id || processed.has(otherLead.id) || otherLead.archived) {
          return false;
        }

        // Check for name match (case insensitive, trimmed)
        const nameMatch = lead.name && otherLead.name && 
          lead.name.trim().toLowerCase() === otherLead.name.trim().toLowerCase();

        // Check for phone match (normalized - remove spaces, dashes, etc.)
        const normalizePhone = (phone?: string) => 
          phone?.replace(/[\s\-\(\)\+]/g, '') || '';
        
        const phoneMatch = lead.phone && otherLead.phone && 
          normalizePhone(lead.phone) === normalizePhone(otherLead.phone) &&
          normalizePhone(lead.phone).length > 5; // Only if meaningful phone

        return nameMatch || phoneMatch;
      });

      if (duplicates.length > 0) {
        const allLeads = [lead, ...duplicates];
        
        // Determine duplicate type and score
        const hasNameDuplicates = allLeads.some(l1 => 
          allLeads.some(l2 => 
            l1.id !== l2.id && l1.name && l2.name && 
            l1.name.trim().toLowerCase() === l2.name.trim().toLowerCase()
          )
        );
        
        const hasPhoneDuplicates = allLeads.some(l1 => 
          allLeads.some(l2 => {
            if (l1.id === l2.id || !l1.phone || !l2.phone) return false;
            const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)\+]/g, '');
            return normalizePhone(l1.phone) === normalizePhone(l2.phone) && 
                   normalizePhone(l1.phone).length > 5;
          })
        );

        const duplicateType: 'name' | 'phone' | 'both' = 
          hasNameDuplicates && hasPhoneDuplicates ? 'both' :
          hasNameDuplicates ? 'name' : 'phone';

        const score = duplicateType === 'both' ? 100 : 
                     duplicateType === 'phone' ? 85 : 70;

        groups.push({
          leads: allLeads,
          duplicateType,
          score
        });

        // Mark all as processed
        allLeads.forEach(l => processed.add(l.id));
      }
    });

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
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Lead } from '@/hooks/useLeads';
import { DuplicateGroup } from '@/hooks/useDuplicateDetection';

export const useLeadMerge = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const mergeLeads = async (duplicateGroup: DuplicateGroup, onSuccess?: () => void) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо войти в систему",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const leads = duplicateGroup.leads;
      
      // Find the lead with the most complete information
      const primaryLead = selectPrimaryLead(leads);
      const duplicateLeads = leads.filter(lead => lead.id !== primaryLead.id);
      
      // Merge all information into the primary lead
      const mergedData = mergeLeadData(primaryLead, duplicateLeads);

      // Обновляем основной лид только если есть что менять (пустой patch -> no-op).
      if (Object.keys(mergedData).length > 0) {
        const { error: updateError } = await supabase
          .from('leads')
          .update(mergedData)
          .eq('id', primaryLead.id);

        if (updateError) throw updateError;
      }

      // Log the merge action for the primary lead
      const mergeDetails = {
        action: 'lead_merge',
        merged_leads: duplicateLeads.map(lead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          company: lead.company,
          stage: lead.stage,
          notes: lead.notes
        })),
        duplicate_type: duplicateGroup.duplicateType,
        score: duplicateGroup.score
      };

      const { error: logError } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          action: 'lead_merge',
          target_type: 'lead',
          target_id: primaryLead.id,
          details: mergeDetails
        });

      if (logError) console.warn('Failed to log merge action:', logError);

      const duplicateIds = duplicateLeads.map(lead => lead.id);

      // ВАЖНО: переносим связанные записи дубликатов на основной лид ДО удаления.
      // У lead_activities FK leads(id) ON DELETE CASCADE — без переноса вся
      // история (заметки/звонки/смены статуса) дубликатов была бы безвозвратно
      // удалена при merge. Сделки тоже перецепляем, чтобы не осиротить/не упереться в FK.
      const { error: activitiesError } = await supabase
        .from('lead_activities')
        .update({ lead_id: primaryLead.id })
        .in('lead_id', duplicateIds);
      if (activitiesError) throw activitiesError;

      const { error: dealsError } = await supabase
        .from('deals')
        .update({ lead_id: primaryLead.id })
        .in('lead_id', duplicateIds);
      // deals может не иметь записей/таблицы под текущей ролью — не валим merge,
      // но логируем, чтобы не терять сигнал.
      if (dealsError) console.warn('Failed to re-link deals on merge:', dealsError);

      // Delete duplicate leads (история уже перенесена на основной лид)
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) throw deleteError;

      toast({
        title: "Успешно",
        description: `Объединено ${leads.length} лидов в один. Дубликаты удалены.`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error merging leads:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось объединить лиды",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { mergeLeads, loading };
};

// Helper function to select the primary lead (most complete information)
const selectPrimaryLead = (leads: Lead[]): Lead => {
  return leads.reduce((primary, current) => {
    let primaryScore = 0;
    let currentScore = 0;

    // Score based on completeness of information
    if (primary.name?.trim()) primaryScore += 2;
    if (primary.phone?.trim()) primaryScore += 2;
    if (primary.company?.trim()) primaryScore += 1;
    if (primary.notes?.trim()) primaryScore += 1;

    if (current.name?.trim()) currentScore += 2;
    if (current.phone?.trim()) currentScore += 2;
    if (current.company?.trim()) currentScore += 1;
    if (current.notes?.trim()) currentScore += 1;

    // Prefer more recent leads if scores are equal
    if (currentScore > primaryScore) {
      return current;
    } else if (currentScore === primaryScore) {
      return new Date(current.created_at) > new Date(primary.created_at) ? current : primary;
    }
    
    return primary;
  });
};

// Возвращает ТОЛЬКО изменяемые поля для UPDATE основного лида. Раньше сюда
// попадал весь объект лида целиком (включая id, created_at, updated_at, archived…),
// что перезаписывало системные/неизменяемые колонки.
const mergeLeadData = (primary: Lead, duplicates: Lead[]): Partial<Lead> => {
  const allLeads = [primary, ...duplicates];
  const patch: Partial<Lead> = {};

  // Merge notes from all leads
  const allNotes = allLeads
    .map(lead => lead.notes?.trim())
    .filter((note): note is string => !!note && note.length > 0);

  if (allNotes.length > 1) {
    const uniqueNotes = [...new Set(allNotes)];
    patch.notes = uniqueNotes.join('\n\n--- Объединенные заметки ---\n');
  }

  // Заполняем недостающие у основного лида контактные поля из дубликатов
  const fillIfEmpty = (field: 'company' | 'phone' | 'email' | 'city' | 'position') => {
    if (primary[field]?.trim()) return;
    const donor = allLeads.find(l => l[field]?.trim());
    if (donor) patch[field] = donor[field];
  };
  (['company', 'phone', 'email', 'city', 'position'] as const).forEach(fillIfEmpty);

  // Use the most advanced stage
  const stageOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed', 'lost'];
  const stages = allLeads.map(lead => lead.stage).filter(stage => stage);
  const advancedStage = stages.reduce((best, current) => {
    const bestIndex = stageOrder.indexOf(best);
    const currentIndex = stageOrder.indexOf(current);
    return currentIndex > bestIndex ? current : best;
  }, stages[0] || 'new');

  if (advancedStage !== primary.stage) patch.stage = advancedStage;

  return patch;
};
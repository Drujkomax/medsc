export type VisitStatus = 'in_progress' | 'completed' | 'abandoned';
export type VisitOutcome = 'success' | 'interested' | 'rejected' | 'postponed';
export type StageType = 'arrival' | 'specialist' | 'briefing' | 'completion';

export interface Visit {
  id: string;
  rep_id: string;
  client_id: string | null;
  pending_clinic: { name: string; address?: string } | null;
  status: VisitStatus;
  outcome: VisitOutcome | null;
  outcome_comment: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitStage {
  id: string;
  visit_id: string;
  stage_type: StageType;
  payload: Record<string, unknown>;
  text_note: string | null;
  photo_urls: string[];
  completed_at: string;
}

export interface VisitListRow extends Visit {
  rep_name: string | null;
  clinic_name: string;
  stages_done: number;
}

export interface Filters {
  rep_id?: string;
  client_id?: string;
  status?: VisitStatus;
  outcome?: VisitOutcome;
  date_from?: string;
  date_to?: string;
  search?: string;
}

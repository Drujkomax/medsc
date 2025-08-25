-- Update the check constraint for leads stage to match the application values
ALTER TABLE leads DROP CONSTRAINT leads_stage_check;

ALTER TABLE leads ADD CONSTRAINT leads_stage_check 
CHECK (stage = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'closed'::text, 'lost'::text]));
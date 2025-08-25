-- First, update existing stage values to match the application values
UPDATE leads 
SET stage = CASE 
  WHEN stage = 'called' THEN 'contacted'
  WHEN stage = 'thinking' THEN 'qualified'
  ELSE stage
END;

-- Now drop and recreate the constraint with the correct values
ALTER TABLE leads DROP CONSTRAINT leads_stage_check;

ALTER TABLE leads ADD CONSTRAINT leads_stage_check 
CHECK (stage = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'closed'::text, 'lost'::text]));
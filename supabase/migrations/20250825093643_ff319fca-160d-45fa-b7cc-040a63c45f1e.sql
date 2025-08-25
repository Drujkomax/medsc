-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.archive_lead(lead_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.leads 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id
  WHERE id = lead_id;
END;
$$;
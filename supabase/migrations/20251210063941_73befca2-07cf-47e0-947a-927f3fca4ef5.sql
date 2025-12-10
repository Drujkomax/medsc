-- Add new contract and management fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contract_start_date date,
ADD COLUMN IF NOT EXISTS contract_end_date date,
ADD COLUMN IF NOT EXISTS contract_status text DEFAULT 'onboarding',
ADD COLUMN IF NOT EXISTS cooperation_type text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assigned_manager uuid,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- Add check constraint for contract_status using a validation trigger instead
CREATE OR REPLACE FUNCTION public.validate_client_contract_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.contract_status IS NOT NULL AND NEW.contract_status NOT IN ('active', 'onboarding', 'suspended', 'expired') THEN
    RAISE EXCEPTION 'Invalid contract_status: %. Must be one of: active, onboarding, suspended, expired', NEW.contract_status;
  END IF;
  
  IF NEW.priority IS NOT NULL AND NEW.priority NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid priority: %. Must be one of: low, medium, high', NEW.priority;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_client_fields ON public.clients;
CREATE TRIGGER validate_client_fields
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.validate_client_contract_status();

-- Create invoices table for clinics
CREATE TABLE IF NOT EXISTS public.clinic_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  description text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create shipments table for clinics
CREATE TABLE IF NOT EXISTS public.clinic_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  shipment_number text,
  status text DEFAULT 'pending',
  shipped_date date,
  delivered_date date,
  tracking_number text,
  carrier text,
  notes text,
  items jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create documents table for clinics
CREATE TABLE IF NOT EXISTS public.clinic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  category text DEFAULT 'other',
  description text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.clinic_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for clinic_invoices
CREATE POLICY "Managers can manage invoices" ON public.clinic_invoices
FOR ALL USING (has_role_level(auth.uid(), 'salesperson'::app_role));

CREATE POLICY "Accountants can view invoices" ON public.clinic_invoices
FOR SELECT USING (has_role(auth.uid(), 'accountant'::app_role));

-- RLS policies for clinic_shipments
CREATE POLICY "Managers can manage shipments" ON public.clinic_shipments
FOR ALL USING (has_role_level(auth.uid(), 'salesperson'::app_role));

-- RLS policies for clinic_documents
CREATE POLICY "Managers can manage documents" ON public.clinic_documents
FOR ALL USING (has_role_level(auth.uid(), 'salesperson'::app_role));

-- Create storage bucket for clinic documents if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-documents', 'clinic-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for clinic documents
CREATE POLICY "Managers can upload clinic documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-documents' 
  AND has_role_level(auth.uid(), 'salesperson'::app_role)
);

CREATE POLICY "Managers can view clinic documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinic-documents' 
  AND has_role_level(auth.uid(), 'salesperson'::app_role)
);

CREATE POLICY "Managers can delete clinic documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinic-documents' 
  AND has_role_level(auth.uid(), 'salesperson'::app_role)
);
-- Add archiving fields to products table
ALTER TABLE public.products 
ADD COLUMN archived boolean DEFAULT false,
ADD COLUMN archived_at timestamp with time zone,
ADD COLUMN archived_by uuid;

-- Create function for archiving products
CREATE OR REPLACE FUNCTION public.archive_product(product_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id
  WHERE id = product_id;
END;
$function$;

-- Create function for unarchiving products
CREATE OR REPLACE FUNCTION public.unarchive_product(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products 
  SET 
    archived = false,
    archived_at = null,
    archived_by = null
  WHERE id = product_id;
END;
$function$;
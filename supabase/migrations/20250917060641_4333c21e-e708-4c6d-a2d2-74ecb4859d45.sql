-- Исправляем функцию confirm_user_registration 
-- Удаляем попытку изменения auth.users, так как это системная таблица
CREATE OR REPLACE FUNCTION public.confirm_user_registration(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  -- Do not modify auth.users here. Supabase core handles email confirmations.
  -- This function exists for backward compatibility and observability only.
  result := json_build_object(
    'user_id', user_id,
    'message', 'Email confirmation managed by Supabase; no DB action performed.'
  );
  RETURN result;
END;
$$;
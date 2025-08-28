-- Fix the register_specific_director function
CREATE OR REPLACE FUNCTION public.register_specific_director(user_uuid uuid, director_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  -- Обновляем или создаем роль для конкретного пользователя
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, 'director')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'director';
  
  result := json_build_object(
    'user_id', user_uuid,
    'email', director_email,
    'role', 'director',
    'message', 'Директор успешно зарегистрирован'
  );
  
  RETURN result;
END;
$function$;
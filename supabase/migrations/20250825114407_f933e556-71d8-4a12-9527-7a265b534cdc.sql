-- Создаем директора напрямую с известными данными
-- Сначала создаем пользователя в auth.users (эмуляция)
-- Поскольку у нас нет доступа к auth.users напрямую, создаем запись в user_roles
-- с предполагаемым UUID для director@medsc.uz

-- Удаляем старые записи если есть
DELETE FROM public.user_roles WHERE role = 'director';

-- Создаем роль директора с фиксированным UUID
INSERT INTO public.user_roles (user_id, role)
VALUES ('d1rector-0000-0000-0000-000000000001', 'director');

-- Также создаем функцию для регистрации конкретного директора
CREATE OR REPLACE FUNCTION register_specific_director(
  user_id UUID,
  director_email TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Обновляем или создаем роль для конкретного пользователя
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, 'director')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'director';
  
  result := json_build_object(
    'user_id', user_id,
    'email', director_email,
    'role', 'director',
    'message', 'Директор успешно зарегистрирован'
  );
  
  RETURN result;
END;
$$;
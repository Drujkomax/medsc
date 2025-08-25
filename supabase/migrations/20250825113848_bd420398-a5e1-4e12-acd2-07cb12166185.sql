-- Создаем функцию для создания первого директора (одноразовая)
CREATE OR REPLACE FUNCTION create_first_director(
  director_email TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_id UUID;
  result JSON;
BEGIN
  -- Проверяем, нет ли уже директора в системе
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'director') THEN
    RAISE EXCEPTION 'Директор уже существует в системе';
  END IF;

  -- Создаем приглашение для директора
  INSERT INTO public.user_invites (email, role)
  VALUES (director_email, 'director')
  RETURNING id INTO invite_id;
  
  result := json_build_object(
    'invite_id', invite_id,
    'email', director_email,
    'role', 'director',
    'invite_link', '/admin/register/' || invite_id,
    'message', 'Создано приглашение для первого директора'
  );
  
  RETURN result;
END;
$$;

-- Также создаем функцию для просмотра всех приглашений (для админов)
CREATE OR REPLACE FUNCTION get_pending_invites()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role app_role,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, email, role, created_at, expires_at
  FROM public.user_invites
  WHERE NOT used AND expires_at > now()
  ORDER BY created_at DESC;
$$;
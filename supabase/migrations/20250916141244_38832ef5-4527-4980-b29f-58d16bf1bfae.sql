-- Назначение роли по приглашению и пометка инвайта использованным
CREATE OR REPLACE FUNCTION public.assign_role_from_invite(p_invite_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invite_record public.user_invites%ROWTYPE;
  result JSON;
BEGIN
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = p_invite_id AND NOT used AND expires_at > now();

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Приглашение недействительно или истекло';
  END IF;

  -- Назначаем роль пользователю (обходя RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, invite_record.role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Помечаем приглашение как использованное
  UPDATE public.user_invites SET used = true WHERE id = p_invite_id;

  -- Подтверждаем email пользователя (если требуется)
  PERFORM public.confirm_user_registration(p_user_id);

  result := json_build_object(
    'user_id', p_user_id,
    'email', invite_record.email,
    'role', invite_record.role,
    'message', 'Роль назначена и приглашение использовано'
  );

  RETURN result;
END;
$$;
-- Create RPC to apply custom permissions and temporary access during invite registration
CREATE OR REPLACE FUNCTION public.apply_invite_permissions(
  p_invite_id uuid,
  p_user_id uuid,
  p_full_access text[],
  p_view_only text[],
  p_is_temporary boolean,
  p_expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.user_invites%ROWTYPE;
  profile_email text;
BEGIN
  -- Validate invite exists
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = p_invite_id;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invite id';
  END IF;

  -- Validate that the invite email matches the registering user's profile email
  SELECT email INTO profile_email FROM public.profiles WHERE id = p_user_id;
  IF profile_email IS NULL OR lower(profile_email) <> lower(invite_record.email) THEN
    RAISE EXCEPTION 'Invite email does not match user profile email';
  END IF;

  -- Reset existing custom permissions
  DELETE FROM public.employee_custom_permissions WHERE user_id = p_user_id;

  -- Insert full access permissions
  IF array_length(p_full_access, 1) IS NOT NULL THEN
    INSERT INTO public.employee_custom_permissions (user_id, section, permission_level, created_by)
    SELECT p_user_id, unnest(p_full_access), 'full_access', COALESCE(invite_record.created_by, auth.uid());
  END IF;

  -- Insert view-only permissions
  IF array_length(p_view_only, 1) IS NOT NULL THEN
    INSERT INTO public.employee_custom_permissions (user_id, section, permission_level, created_by)
    SELECT p_user_id, unnest(p_view_only), 'view_only', COALESCE(invite_record.created_by, auth.uid());
  END IF;

  -- Handle temporary employee status
  IF p_is_temporary AND p_expires_at IS NOT NULL THEN
    INSERT INTO public.temporary_employees (user_id, expires_at, is_active, created_by)
    VALUES (p_user_id, p_expires_at, true, COALESCE(invite_record.created_by, auth.uid()))
    ON CONFLICT (user_id) DO UPDATE
      SET expires_at = EXCLUDED.expires_at,
          is_active = EXCLUDED.is_active,
          created_by = EXCLUDED.created_by;
  ELSE
    DELETE FROM public.temporary_employees WHERE user_id = p_user_id;
  END IF;
END;
$$;
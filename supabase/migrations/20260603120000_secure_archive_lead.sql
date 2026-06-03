-- Безопасность: archive_lead — это SECURITY DEFINER функция, которая раньше
-- БЕЗ какой-либо проверки прав выполняла UPDATE public.leads и брала archived_by
-- из аргумента user_id. Поскольку SECURITY DEFINER обходит RLS, любой
-- аутентифицированный пользователь мог архивировать ЛЮБОЙ лид (в т.ч. чужой)
-- и подделать archived_by (IDOR / обход RLS).
--
-- Чинит: авторизуем вызов по той же модели, что и RLS на leads:
--   * полный доступ (director / admin / sales_manager или выданный
--     employee_custom_permissions full_access) — через has_full_leads_access(); ЛИБО
--   * salesperson только для СВОИХ лидов (assigned_to = auth.uid()).
-- archived_by всегда берём из auth.uid(), аргумент user_id игнорируем
-- (оставлен только для обратной совместимости с существующими вызовами).
-- Если прав нет (UPDATE затронул 0 строк) — бросаем исключение, чтобы UI
-- показал ошибку, а не «успех».

CREATE OR REPLACE FUNCTION public.archive_lead(lead_id uuid, user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_rows integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.leads
  SET
    archived = true,
    archived_at = now(),
    archived_by = v_uid
  WHERE id = lead_id
    AND (
      public.has_full_leads_access(v_uid)
      OR (has_role(v_uid, 'salesperson'::app_role) AND assigned_to = v_uid)
    );

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Not permitted to archive lead % (or it does not exist)', lead_id
      USING ERRCODE = '42501';
  END IF;
END;
$function$;

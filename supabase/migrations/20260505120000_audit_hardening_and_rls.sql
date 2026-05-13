CREATE OR REPLACE FUNCTION public._audit_ip()
RETURNS inet
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    split_part(
      COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
      ',', 1
    ),
    ''
  )::inet;
$$;

CREATE OR REPLACE FUNCTION public._audit_ua()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('request.headers', true)::json->>'user-agent', '');
$$;


-- -----------------------------------------------------------------------------
-- 2. Schema: add IP / UA to deal_audit_log
-- -----------------------------------------------------------------------------

ALTER TABLE public.deal_audit_log
  ADD COLUMN IF NOT EXISTS ip_address inet,
  ADD COLUMN IF NOT EXISTS user_agent text;


-- -----------------------------------------------------------------------------
-- 3. Update log_user_activity (already attached to leads + user_roles)
--    to capture IP / UA into user_activity_logs.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.user_activity_logs (
    user_id, action, target_type, target_id, details, ip_address, user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE((NEW).id, (OLD).id),
    CASE
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
    END,
    public._audit_ip(),
    public._audit_ua()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


-- -----------------------------------------------------------------------------
-- 4. Update log_deal_changes to capture IP / UA
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_deal_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_role  text;
  v_changed text[] := ARRAY[]::text[];
  v_old jsonb := '{}'::jsonb;
  v_new jsonb := '{}'::jsonb; 
  v_action text;
BEGIN
  SELECT p.email INTO v_email FROM public.profiles p WHERE p.id = auth.uid();
  SELECT ur.role::text INTO v_role FROM public.user_roles ur WHERE ur.user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.deal_audit_log (
      deal_id, user_id, action_type, new_values, user_email, user_role,
      ip_address, user_agent
    ) VALUES (
      NEW.id, auth.uid(), 'created', to_jsonb(NEW), v_email, v_role,
      public._audit_ip(), public._audit_ua()
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.deal_audit_log (
      deal_id, user_id, action_type, old_values, user_email, user_role,
      ip_address, user_agent
    ) VALUES (
      OLD.id, auth.uid(), 'deleted', to_jsonb(OLD), v_email, v_role,
      public._audit_ip(), public._audit_ua()
    );
    RETURN OLD;
  END IF;

  -- UPDATE: diff watched fields
  IF OLD.title           IS DISTINCT FROM NEW.title           THEN v_changed := array_append(v_changed, 'title');           v_old := jsonb_set(v_old, '{title}',           to_jsonb(OLD.title));           v_new := jsonb_set(v_new, '{title}',           to_jsonb(NEW.title));           END IF;
  IF OLD.amount          IS DISTINCT FROM NEW.amount          THEN v_changed := array_append(v_changed, 'amount');          v_old := jsonb_set(v_old, '{amount}',          to_jsonb(OLD.amount));          v_new := jsonb_set(v_new, '{amount}',          to_jsonb(NEW.amount));          END IF;
  IF OLD.stage           IS DISTINCT FROM NEW.stage           THEN v_changed := array_append(v_changed, 'stage');           v_old := jsonb_set(v_old, '{stage}',           to_jsonb(OLD.stage));           v_new := jsonb_set(v_new, '{stage}',           to_jsonb(NEW.stage));           END IF;
  IF OLD.payment_status  IS DISTINCT FROM NEW.payment_status  THEN v_changed := array_append(v_changed, 'payment_status');  v_old := jsonb_set(v_old, '{payment_status}',  to_jsonb(OLD.payment_status));  v_new := jsonb_set(v_new, '{payment_status}',  to_jsonb(NEW.payment_status));  END IF;
  IF OLD.debt_amount     IS DISTINCT FROM NEW.debt_amount     THEN v_changed := array_append(v_changed, 'debt_amount');     v_old := jsonb_set(v_old, '{debt_amount}',     to_jsonb(OLD.debt_amount));     v_new := jsonb_set(v_new, '{debt_amount}',     to_jsonb(NEW.debt_amount));     END IF;
  IF OLD.notes           IS DISTINCT FROM NEW.notes           THEN v_changed := array_append(v_changed, 'notes');           v_old := jsonb_set(v_old, '{notes}',           to_jsonb(OLD.notes));           v_new := jsonb_set(v_new, '{notes}',           to_jsonb(NEW.notes));           END IF;
  IF OLD.probability     IS DISTINCT FROM NEW.probability     THEN v_changed := array_append(v_changed, 'probability');     v_old := jsonb_set(v_old, '{probability}',     to_jsonb(OLD.probability));     v_new := jsonb_set(v_new, '{probability}',     to_jsonb(NEW.probability));     END IF;

  IF array_length(v_changed, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  v_action := CASE
    WHEN 'stage'          = ANY(v_changed) THEN 'stage_changed'
    WHEN 'payment_status' = ANY(v_changed) THEN 'payment_status_changed'
    ELSE 'updated'
  END;

  INSERT INTO public.deal_audit_log (
    deal_id, user_id, action_type, old_values, new_values, changed_fields,
    user_email, user_role, ip_address, user_agent
  ) VALUES (
    NEW.id, auth.uid(), v_action, v_old, v_new, v_changed,
    v_email, v_role, public._audit_ip(), public._audit_ua()
  );

  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- 5. Update log_employee_activity RPC to capture IP / UA + role
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_employee_activity(
  p_action_type      text,
  p_entity_type      text DEFAULT NULL,
  p_entity_id        uuid DEFAULT NULL,
  p_details          jsonb DEFAULT '{}'::jsonb,
  p_session_duration integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'log_employee_activity requires authentication';
  END IF;

  INSERT INTO public.employee_activity (
    user_id, action_type, entity_type, entity_id, details,
    session_duration, date, ip_address, user_agent
  ) VALUES (
    auth.uid(), p_action_type, p_entity_type, p_entity_id, p_details,
    p_session_duration, CURRENT_DATE, public._audit_ip(), public._audit_ua()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- -----------------------------------------------------------------------------
-- 6. New triggers: invites, custom permissions, temporary employees
--    (user_roles + leads already covered by log_user_activity)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS log_user_invites_activity              ON public.user_invites;
DROP TRIGGER IF EXISTS log_employee_custom_permissions_activity ON public.employee_custom_permissions;
DROP TRIGGER IF EXISTS log_temporary_employees_activity        ON public.temporary_employees;

CREATE TRIGGER log_user_invites_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.user_invites
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_employee_custom_permissions_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_custom_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_temporary_employees_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.temporary_employees
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();


-- -----------------------------------------------------------------------------
-- 7. Fix deal_audit_log INSERT — was WITH CHECK (true).
--    Allow only via SECURITY DEFINER trigger (postgres bypasses RLS).
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "System can insert audit logs" ON public.deal_audit_log;

-- Authenticated users can ONLY insert rows that claim their own user_id.
-- The SECURITY DEFINER trigger bypasses RLS anyway, this just blocks
-- direct INSERTs from clients masquerading as someone else.
CREATE POLICY "Audit insert must match auth.uid"
  ON public.deal_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 8. Make audit tables immutable: revoke UPDATE / DELETE / TRUNCATE
--    from clients, and add explicit RESTRICTIVE deny policies as belt-and-braces.
-- -----------------------------------------------------------------------------

REVOKE UPDATE, DELETE, TRUNCATE ON public.user_activity_logs FROM authenticated, anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.employee_activity  FROM authenticated, anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.deal_audit_log     FROM authenticated, anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.lead_activities    FROM authenticated, anon;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_activity_logs',
    'employee_activity',
    'deal_audit_log',
    'lead_activities'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "audit_no_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "audit_no_delete_%s" ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY "audit_no_update_%s" ON public.%I AS RESTRICTIVE FOR UPDATE TO public USING (false) WITH CHECK (false)',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "audit_no_delete_%s" ON public.%I AS RESTRICTIVE FOR DELETE TO public USING (false)',
      t, t
    );
  END LOOP;
END;
$$;


-- -----------------------------------------------------------------------------
-- 9. Lock bot_state to service_role only (was USING (true), open to anon)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Edge functions can manage bot state" ON public.bot_state;

CREATE POLICY "bot_state service_role only"
  ON public.bot_state
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- -----------------------------------------------------------------------------
-- 10. Indexes to keep audit queries fast as volume grows
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_target
  ON public.user_activity_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_deal_audit_log_user_created
  ON public.deal_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deal_audit_log_deal_created
  ON public.deal_audit_log(deal_id, created_at DESC);

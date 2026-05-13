-- Throttle log_system_event to prevent runaway insert storms.
--
-- Background: a frontend resource_error listener was firing this RPC for every
-- failed <img>/<link>/<script> load. With one missing image (placeholder.svg)
-- rendered many times per page, this produced ~30-70k inserts/day into
-- system_logs AND system_alerts (1:1), pushing both tables to ~2.7 GB.
--
-- This migration:
--   1) Adds an UNLOGGED rate-limit table; identical (level, category, message,
--      user_id) tuples are dropped within a 60s window.
--   2) Stops creating a system_alerts row for every `level='error'` event.
--      Alerts now fire only for explicit security/slow-performance events,
--      and only once per 30 min per message.
--
-- Data preservation: existing rows in system_logs and system_alerts are NOT
-- touched. To reclaim space, run `SELECT public.cleanup_old_logs(30);` later.

BEGIN;

-- Fast in-memory dedup. UNLOGGED → no WAL traffic; truncated on crash, which
-- is fine for a rate-limit window.
CREATE UNLOGGED TABLE IF NOT EXISTS public._log_rate_limit (
  bucket text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);

ALTER TABLE public._log_rate_limit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._log_rate_limit FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_system_event(
  p_level text,
  p_category text,
  p_message text,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_url text DEFAULT NULL,
  p_stack_trace text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
  v_user_id uuid;
  v_bucket text;
  v_alert_recent boolean;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  v_bucket := md5(
    coalesce(p_level, '') || '|' ||
    coalesce(p_category, '') || '|' ||
    coalesce(left(p_message, 200), '') || '|' ||
    coalesce(v_user_id::text, 'anon')
  );

  -- Atomic claim of the rate-limit slot. If the slot is held and not yet
  -- expired, ON CONFLICT DO UPDATE's WHERE filter prevents the update and
  -- nothing is RETURNED → FOUND is false → we drop the event.
  INSERT INTO public._log_rate_limit AS r (bucket, expires_at)
  VALUES (v_bucket, now() + interval '60 seconds')
  ON CONFLICT (bucket) DO UPDATE
    SET expires_at = EXCLUDED.expires_at
    WHERE r.expires_at < now();

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Opportunistic cleanup so the dedup table stays small.
  IF random() < 0.005 THEN
    DELETE FROM public._log_rate_limit WHERE expires_at < now() - interval '5 minutes';
  END IF;

  INSERT INTO public.system_logs (
    level, category, message, details, user_id,
    ip_address, user_agent, url, stack_trace
  ) VALUES (
    p_level, p_category, p_message, p_details, v_user_id,
    p_ip_address, p_user_agent, p_url, p_stack_trace
  ) RETURNING id INTO log_id;

  -- Previous version created a 'high' severity alert for EVERY level='error'.
  -- That is what produced 2.86M alerts. Now alerts fire only for explicit
  -- security events or genuinely slow operations, and are deduped per message.
  IF (p_category = 'security')
     OR (p_category = 'performance' AND (p_details->>'duration')::numeric > 5000)
  THEN
    SELECT EXISTS (
      SELECT 1 FROM public.system_alerts
      WHERE description = p_message
        AND created_at > now() - interval '30 minutes'
    ) INTO v_alert_recent;

    IF NOT v_alert_recent THEN
      INSERT INTO public.system_alerts (
        alert_type, title, description, severity, details, triggered_by_log_id
      ) VALUES (
        CASE
          WHEN p_category = 'security' THEN 'security_breach'
          WHEN p_category = 'performance' THEN 'performance_issue'
          ELSE 'system_issue'
        END,
        CASE
          WHEN p_category = 'security' THEN 'Проблема безопасности: ' || p_message
          WHEN p_category = 'performance' THEN 'Проблема производительности: ' || p_message
          ELSE p_message
        END,
        p_message,
        CASE
          WHEN p_category = 'security' THEN 'critical'
          ELSE 'medium'
        END,
        p_details,
        log_id
      );
    END IF;
  END IF;

  RETURN log_id;
END;
$$;

COMMIT;

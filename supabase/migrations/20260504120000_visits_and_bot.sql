-- =====================================================================
-- Visits (обход клиник) + Telegram bot infrastructure
-- =====================================================================

-- ---------- 1. Расширяем profiles --------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ru' CHECK (language IN ('ru','uz','en')),
  ADD COLUMN IF NOT EXISTS telegram_link_code TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_code_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_telegram_id
  ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_link_code
  ON public.profiles(telegram_link_code) WHERE telegram_link_code IS NOT NULL;

-- ---------- 2. Таблица visits ------------------------------------------
CREATE TABLE IF NOT EXISTS public.visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  pending_clinic  JSONB,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                  CHECK (status IN ('in_progress','completed','abandoned')),
  outcome         TEXT CHECK (outcome IN ('success','interested','rejected','postponed')),
  outcome_comment TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_rep_id    ON public.visits(rep_id);
CREATE INDEX IF NOT EXISTS idx_visits_client_id ON public.visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_status    ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_started_at ON public.visits(started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_one_active_per_rep
  ON public.visits(rep_id) WHERE status = 'in_progress';

-- updated_at триггер (использует существующую функцию update_updated_at_column)
DROP TRIGGER IF EXISTS update_visits_updated_at ON public.visits;
CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 3. Таблица visit_stages ------------------------------------
CREATE TABLE IF NOT EXISTS public.visit_stages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id      UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  stage_type    TEXT NOT NULL CHECK (stage_type IN ('arrival','specialist','briefing','completion')),
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  text_note     TEXT,
  photo_urls    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (visit_id, stage_type)
);

CREATE INDEX IF NOT EXISTS idx_visit_stages_visit_id ON public.visit_stages(visit_id);

-- ---------- 4. Таблица bot_sessions ------------------------------------
CREATE TABLE IF NOT EXISTS public.bot_sessions (
  telegram_id  BIGINT PRIMARY KEY,
  state        TEXT NOT NULL,
  context      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 5. RPC: генерация кода привязки ----------------------------
-- Возвращает 6-символьный код, сохраняет его в profiles, TTL = 15 минут.
-- Может вызывать только владелец профиля или директор/админ.
CREATE OR REPLACE FUNCTION public.generate_telegram_link_code(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  new_code TEXT;
BEGIN
  -- Каждый может сгенерировать код для себя; директор/админ — для любого
  IF auth.uid() <> target_user_id THEN
    SELECT ur.role::text INTO caller_role
      FROM public.user_roles ur
     WHERE ur.user_id = auth.uid()
     LIMIT 1;
    IF caller_role NOT IN ('director','admin') THEN
      RAISE EXCEPTION 'Not authorized to generate code for another user';
    END IF;
  END IF;

  -- 6-значный буквенно-цифровой код (без 0/O, 1/I для читаемости)
  new_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'),
                                     '+/=01OIli', ''), 1, 6));
  IF length(new_code) < 6 THEN
    new_code := upper(substr(md5(random()::text), 1, 6));
  END IF;

  UPDATE public.profiles
     SET telegram_link_code = new_code,
         telegram_link_code_expires_at = now() + interval '15 minutes',
         updated_at = now()
   WHERE id = target_user_id;

  RETURN new_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_telegram_link_code(UUID) TO authenticated;

-- ---------- 6. Триггер: автозакрытие "забытых" визитов -----------------
-- Вызывается обычно из cron, помечает визиты in_progress > 12 часов как abandoned.
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_visits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.visits
     SET status = 'abandoned',
         updated_at = now()
   WHERE status = 'in_progress'
     AND started_at < now() - interval '12 hours';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ---------- 7. RLS для visits / visit_stages / bot_sessions ------------
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

-- visits: читать могут руководители и сам автор визита
DROP POLICY IF EXISTS "Managers can view all visits" ON public.visits;
CREATE POLICY "Managers can view all visits"
  ON public.visits FOR SELECT
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
    OR rep_id = auth.uid()
  );

-- visits: писать в visits через клиент админки нельзя — только service_role (бот)
-- (никаких INSERT/UPDATE/DELETE policies для authenticated)

-- visit_stages: SELECT по принадлежности к visit
DROP POLICY IF EXISTS "Visit stages visibility" ON public.visit_stages;
CREATE POLICY "Visit stages visibility"
  ON public.visit_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
       WHERE v.id = visit_stages.visit_id
         AND (
           public.has_role(auth.uid(), 'director'::app_role)
           OR public.has_role(auth.uid(), 'admin'::app_role)
           OR public.has_role(auth.uid(), 'sales_manager'::app_role)
           OR v.rep_id = auth.uid()
         )
    )
  );

-- bot_sessions: только service_role (никаких политик для authenticated => deny)

-- ---------- 8. Storage bucket для фото визитов -------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visits',
  'visits',
  false,
  10485760,                                 -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: SELECT для руководителей и автора визита, INSERT — только service_role
DROP POLICY IF EXISTS "Visit photos: managers and author can read" ON storage.objects;
CREATE POLICY "Visit photos: managers and author can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'visits' AND (
      public.has_role(auth.uid(), 'director'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'sales_manager'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.visits v
         WHERE v.rep_id = auth.uid()
           AND split_part(name, '/', 1) = v.id::text
      )
    )
  );

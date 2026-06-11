-- =====================================================================
-- Visits management from the web app
-- Allow managers (director / admin / sales_manager) to UPDATE and DELETE
-- visits and visit_stages. Previously only SELECT was permitted for
-- authenticated users (writes were limited to the bot via service_role).
-- INSERT stays restricted to the bot (service_role); visits are created
-- from Telegram, the web app only edits/deletes them.
-- =====================================================================

-- ---------- visits: UPDATE ----------
DROP POLICY IF EXISTS "Managers can update visits" ON public.visits;
CREATE POLICY "Managers can update visits"
  ON public.visits FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
  );

-- ---------- visits: DELETE ----------
DROP POLICY IF EXISTS "Managers can delete visits" ON public.visits;
CREATE POLICY "Managers can delete visits"
  ON public.visits FOR DELETE
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
  );

-- ---------- visit_stages: UPDATE ----------
DROP POLICY IF EXISTS "Managers can update visit stages" ON public.visit_stages;
CREATE POLICY "Managers can update visit stages"
  ON public.visit_stages FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
  );

-- ---------- visit_stages: DELETE ----------
DROP POLICY IF EXISTS "Managers can delete visit stages" ON public.visit_stages;
CREATE POLICY "Managers can delete visit stages"
  ON public.visit_stages FOR DELETE
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
  );

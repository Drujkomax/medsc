-- Откат "full leads access" для salesperson.
--
-- В коммитах b962558 / 77380bb / 5334e5a salesperson получил полный доступ
-- ко всем лидам и user_roles. По требованию: salesperson видит только лиды,
-- где он = assigned_to, ЛИБО если директор выдал ему "Полный доступ" к
-- разделу "leads" в employee_custom_permissions.
--
-- Также добавляем триггер log_user_activity на остальные таблицы
-- (tasks, products, services, deals, clients, categories) чтобы директор
-- видел действия любого пользователя в едином потоке user_activity_logs.


-- =====================================================================
-- 1. Хелпер: есть ли у юзера "полный доступ к лидам"?
--    Возвращает true для director/admin/sales_manager (как раньше),
--    либо если в employee_custom_permissions выдан full_access на 'leads'.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.has_full_leads_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'director'::app_role)
    OR has_role(_user_id, 'admin'::app_role)
    OR has_role(_user_id, 'sales_manager'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.employee_custom_permissions ecp
      WHERE ecp.user_id = _user_id
        AND ecp.section = 'leads'
        AND ecp.permission_level = 'full_access'
    );
$$;


-- =====================================================================
-- 2. leads RLS: убираем открытую полиси, ставим узкую с "escape hatch"
--    через has_full_leads_access().
-- =====================================================================

DROP POLICY IF EXISTS "Salespersons can manage all leads"             ON public.leads;
DROP POLICY IF EXISTS "Salespersons can view assigned leads"          ON public.leads;
DROP POLICY IF EXISTS "Salespersons can view only their assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Salespersons can update assigned leads"        ON public.leads;
DROP POLICY IF EXISTS "Salespersons can create their own leads"       ON public.leads;
DROP POLICY IF EXISTS "Salespersons read leads (own or full access)"  ON public.leads;
DROP POLICY IF EXISTS "Salespersons insert leads (own or full access)" ON public.leads;
DROP POLICY IF EXISTS "Salespersons update leads (own or full access)" ON public.leads;
DROP POLICY IF EXISTS "Salespersons delete leads (own or full access)" ON public.leads;

CREATE POLICY "Salespersons read leads (own or full access)"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'salesperson'::app_role)
    AND (assigned_to = auth.uid() OR public.has_full_leads_access(auth.uid()))
  );

CREATE POLICY "Salespersons insert leads (own or full access)"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'salesperson'::app_role)
    AND (assigned_to = auth.uid() OR public.has_full_leads_access(auth.uid()))
  );

CREATE POLICY "Salespersons update leads (own or full access)"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'salesperson'::app_role)
    AND (assigned_to = auth.uid() OR public.has_full_leads_access(auth.uid()))
  )
  WITH CHECK (
    has_role(auth.uid(), 'salesperson'::app_role)
    AND (assigned_to = auth.uid() OR public.has_full_leads_access(auth.uid()))
  );

CREATE POLICY "Salespersons delete leads (own or full access)"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'salesperson'::app_role)
    AND (assigned_to = auth.uid() OR public.has_full_leads_access(auth.uid()))
  );


-- =====================================================================
-- 3. user_roles SELECT: откатываем "salesperson видит всех" к "только своя
--    строка", но даём исключение если у юзера есть has_full_leads_access
--    (нужно для дропдауна "назначить лида на ..." при включённом полном
--    доступе в настройках).
--    Базовая полиси "Users can view their own roles" остаётся нетронутой.
-- =====================================================================

DROP POLICY IF EXISTS "Salespersons can view all user roles"              ON public.user_roles;
DROP POLICY IF EXISTS "Salespersons with full leads access view all roles" ON public.user_roles;

CREATE POLICY "Salespersons with full leads access view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'salesperson'::app_role)
    AND public.has_full_leads_access(auth.uid())
  );


-- =====================================================================
-- 4. Активность: триггеры log_user_activity на остальных бизнес-таблицах.
--    Лиды, user_roles, user_invites, employee_custom_permissions,
--    temporary_employees уже залогированы в предыдущих миграциях.
-- =====================================================================

DROP TRIGGER IF EXISTS log_tasks_activity              ON public.tasks;
DROP TRIGGER IF EXISTS log_deals_activity              ON public.deals;
DROP TRIGGER IF EXISTS log_products_activity           ON public.products;
DROP TRIGGER IF EXISTS log_services_activity           ON public.services;
DROP TRIGGER IF EXISTS log_clients_activity            ON public.clients;
DROP TRIGGER IF EXISTS log_categories_activity         ON public.categories;

CREATE TRIGGER log_tasks_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_deals_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_products_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_services_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_clients_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_categories_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

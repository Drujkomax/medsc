-- Update has_role_level function to include observer role
CREATE OR REPLACE FUNCTION public.has_role_level(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        (_min_role = 'user' AND ur.role IN ('user', 'observer', 'accountant', 'engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'observer' AND ur.role IN ('observer', 'accountant', 'engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'accountant' AND ur.role IN ('accountant', 'engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'engineer' AND ur.role IN ('engineer', 'salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'salesperson' AND ur.role IN ('salesperson', 'sales_manager', 'admin', 'director')) OR
        (_min_role = 'sales_manager' AND ur.role IN ('sales_manager', 'admin', 'director')) OR
        (_min_role = 'admin' AND ur.role IN ('admin', 'director')) OR
        (_min_role = 'director' AND ur.role = 'director')
      )
  )
$function$;
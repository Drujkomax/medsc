-- Создаем таблицу для хранения истории изменений сделок
CREATE TABLE IF NOT EXISTS public.deal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'stage_changed', 'payment_status_changed', 'assigned')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_email TEXT,
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.deal_audit_log ENABLE ROW LEVEL SECURITY;

-- Политика: бухгалтеры и менеджеры могут просматривать аудит
CREATE POLICY "Accountants and managers can view audit log"
ON public.deal_audit_log
FOR SELECT
USING (
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role_level(auth.uid(), 'sales_manager'::app_role)
);

-- Политика: система может вставлять записи аудита
CREATE POLICY "System can insert audit logs"
ON public.deal_audit_log
FOR INSERT
WITH CHECK (true);

-- Создаем функцию для логирования изменений сделок
CREATE OR REPLACE FUNCTION public.log_deal_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  old_vals JSONB := '{}'::JSONB;
  new_vals JSONB := '{}'::JSONB;
  action TEXT;
BEGIN
  -- Получаем email и роль пользователя
  SELECT p.email INTO user_email
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  SELECT ur.role::TEXT INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    action := 'created';
    new_vals := to_jsonb(NEW);
    
    INSERT INTO public.deal_audit_log (
      deal_id, user_id, action_type, new_values, user_email, user_role
    ) VALUES (
      NEW.id, auth.uid(), action, new_vals, user_email, user_role
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    action := 'updated';
    
    -- Определяем какие поля изменились
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      changed_fields := array_append(changed_fields, 'title');
      old_vals := jsonb_set(old_vals, '{title}', to_jsonb(OLD.title));
      new_vals := jsonb_set(new_vals, '{title}', to_jsonb(NEW.title));
    END IF;
    
    IF OLD.amount IS DISTINCT FROM NEW.amount THEN
      changed_fields := array_append(changed_fields, 'amount');
      old_vals := jsonb_set(old_vals, '{amount}', to_jsonb(OLD.amount));
      new_vals := jsonb_set(new_vals, '{amount}', to_jsonb(NEW.amount));
    END IF;
    
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      changed_fields := array_append(changed_fields, 'stage');
      old_vals := jsonb_set(old_vals, '{stage}', to_jsonb(OLD.stage));
      new_vals := jsonb_set(new_vals, '{stage}', to_jsonb(NEW.stage));
      action := 'stage_changed';
    END IF;
    
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      changed_fields := array_append(changed_fields, 'payment_status');
      old_vals := jsonb_set(old_vals, '{payment_status}', to_jsonb(OLD.payment_status));
      new_vals := jsonb_set(new_vals, '{payment_status}', to_jsonb(NEW.payment_status));
      IF action = 'updated' THEN
        action := 'payment_status_changed';
      END IF;
    END IF;
    
    IF OLD.assigned_salesperson IS DISTINCT FROM NEW.assigned_salesperson OR
       OLD.assigned_engineer IS DISTINCT FROM NEW.assigned_engineer OR
       OLD.assigned_accountant IS DISTINCT FROM NEW.assigned_accountant THEN
      changed_fields := array_append(changed_fields, 'assignments');
      old_vals := jsonb_set(old_vals, '{assignments}', jsonb_build_object(
        'salesperson', OLD.assigned_salesperson,
        'engineer', OLD.assigned_engineer,
        'accountant', OLD.assigned_accountant
      ));
      new_vals := jsonb_set(new_vals, '{assignments}', jsonb_build_object(
        'salesperson', NEW.assigned_salesperson,
        'engineer', NEW.assigned_engineer,
        'accountant', NEW.assigned_accountant
      ));
      IF action = 'updated' THEN
        action := 'assigned';
      END IF;
    END IF;
    
    IF OLD.debt_amount IS DISTINCT FROM NEW.debt_amount THEN
      changed_fields := array_append(changed_fields, 'debt_amount');
      old_vals := jsonb_set(old_vals, '{debt_amount}', to_jsonb(OLD.debt_amount));
      new_vals := jsonb_set(new_vals, '{debt_amount}', to_jsonb(NEW.debt_amount));
    END IF;
    
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      changed_fields := array_append(changed_fields, 'notes');
      old_vals := jsonb_set(old_vals, '{notes}', to_jsonb(OLD.notes));
      new_vals := jsonb_set(new_vals, '{notes}', to_jsonb(NEW.notes));
    END IF;
    
    -- Вставляем запись только если что-то изменилось
    IF array_length(changed_fields, 1) > 0 THEN
      INSERT INTO public.deal_audit_log (
        deal_id, user_id, action_type, old_values, new_values, 
        changed_fields, user_email, user_role
      ) VALUES (
        NEW.id, auth.uid(), action, old_vals, new_vals, 
        changed_fields, user_email, user_role
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    action := 'deleted';
    old_vals := to_jsonb(OLD);
    
    INSERT INTO public.deal_audit_log (
      deal_id, user_id, action_type, old_values, user_email, user_role
    ) VALUES (
      OLD.id, auth.uid(), action, old_vals, user_email, user_role
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для логирования изменений
DROP TRIGGER IF EXISTS deal_audit_trigger ON public.deals;
CREATE TRIGGER deal_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.log_deal_changes();

-- Индекс для быстрого поиска по deal_id
CREATE INDEX IF NOT EXISTS idx_deal_audit_log_deal_id ON public.deal_audit_log(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_audit_log_created_at ON public.deal_audit_log(created_at DESC);
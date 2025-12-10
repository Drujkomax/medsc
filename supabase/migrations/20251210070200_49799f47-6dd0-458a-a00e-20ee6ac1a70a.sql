-- Fix remaining trigger functions with mutable search_path

-- Fix update_clients_updated_at
CREATE OR REPLACE FUNCTION public.update_clients_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix calculate_stock_depletion_date
CREATE OR REPLACE FUNCTION public.calculate_stock_depletion_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.average_monthly_consumption IS NOT NULL AND NEW.average_monthly_consumption > 0 AND NEW.quantity > 0 THEN
    NEW.estimated_depletion_date := CURRENT_DATE + (NEW.quantity / NEW.average_monthly_consumption * 30)::INTEGER;
  ELSE
    NEW.estimated_depletion_date := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix log_stock_change
CREATE OR REPLACE FUNCTION public.log_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trans_type TEXT;
  qty_change INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    trans_type := 'initial';
    qty_change := NEW.quantity;
    
    INSERT INTO public.client_stock_transactions (
      client_stock_id, client_id, transaction_type, 
      quantity, quantity_before, quantity_after, performed_by
    ) VALUES (
      NEW.id, NEW.client_id, trans_type, 
      qty_change, 0, NEW.quantity, NEW.created_by
    );
    
  ELSIF TG_OP = 'UPDATE' AND OLD.quantity <> NEW.quantity THEN
    qty_change := NEW.quantity - OLD.quantity;
    
    IF qty_change > 0 THEN
      trans_type := 'incoming';
    ELSE
      trans_type := 'outgoing';
    END IF;
    
    INSERT INTO public.client_stock_transactions (
      client_stock_id, client_id, transaction_type, 
      quantity, quantity_before, quantity_after, performed_by
    ) VALUES (
      NEW.id, NEW.client_id, trans_type, 
      ABS(qty_change), OLD.quantity, NEW.quantity, NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix check_low_stock_alerts
CREATE OR REPLACE FUNCTION public.check_low_stock_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.notify_low_stock = true AND NEW.quantity <= NEW.minimum_stock THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.client_stock_alerts
      WHERE client_stock_id = NEW.id 
        AND alert_type IN ('low_stock', 'out_of_stock')
        AND resolved = false
    ) THEN
      INSERT INTO public.client_stock_alerts (
        client_stock_id, client_id, alert_type, severity, message
      ) VALUES (
        NEW.id, 
        NEW.client_id,
        CASE 
          WHEN NEW.quantity = 0 THEN 'out_of_stock'
          ELSE 'low_stock'
        END,
        CASE 
          WHEN NEW.quantity = 0 THEN 'critical'
          WHEN NEW.quantity <= NEW.minimum_stock * 0.5 THEN 'high'
          ELSE 'medium'
        END,
        CASE 
          WHEN NEW.quantity = 0 THEN 'Запасы закончились!'
          ELSE 'Низкий остаток: ' || NEW.quantity || ' ' || NEW.unit
        END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix log_lead_changes
CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_content TEXT;
  activity_type TEXT;
BEGIN
  -- Логируем изменение статуса
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    activity_content := 'Статус изменен с "' || 
      CASE OLD.stage 
        WHEN 'new' THEN 'Новый'
        WHEN 'contacted' THEN 'Связались'
        WHEN 'qualified' THEN 'Квалифицирован'
        WHEN 'proposal' THEN 'Предложение'
        WHEN 'negotiation' THEN 'Переговоры'
        WHEN 'closed' THEN 'Закрыт'
        WHEN 'lost' THEN 'Потерян'
        ELSE OLD.stage
      END || 
      '" на "' || 
      CASE NEW.stage 
        WHEN 'new' THEN 'Новый'
        WHEN 'contacted' THEN 'Связались'
        WHEN 'qualified' THEN 'Квалифицирован'
        WHEN 'proposal' THEN 'Предложение'
        WHEN 'negotiation' THEN 'Переговоры'
        WHEN 'closed' THEN 'Закрыт'
        WHEN 'lost' THEN 'Потерян'
        ELSE NEW.stage
      END || '"';
    
    INSERT INTO public.lead_activities (lead_id, type, content, old_value, new_value, created_by)
    VALUES (NEW.id, 'status_change', activity_content, OLD.stage, NEW.stage, auth.uid());
  END IF;
  
  -- Логируем изменение назначения
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    activity_content := CASE 
      WHEN OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
        'Лид назначен менеджеру'
      WHEN OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL THEN
        'Назначение лида снято'
      ELSE
        'Лид переназначен другому менеджеру'
    END;
    
    INSERT INTO public.lead_activities (lead_id, type, content, old_value, new_value, created_by)
    VALUES (NEW.id, 'assignment', activity_content, OLD.assigned_to::TEXT, NEW.assigned_to::TEXT, auth.uid());
  END IF;
  
  -- Логируем изменение основных полей
  IF OLD.name IS DISTINCT FROM NEW.name OR 
     OLD.phone IS DISTINCT FROM NEW.phone OR 
     OLD.company IS DISTINCT FROM NEW.company OR 
     OLD.email IS DISTINCT FROM NEW.email THEN
    
    INSERT INTO public.lead_activities (lead_id, type, content, created_by, metadata)
    VALUES (NEW.id, 'field_update', 'Информация о лиде обновлена', auth.uid(), 
      json_build_object(
        'updated_fields', json_build_object(
          'name', CASE WHEN OLD.name IS DISTINCT FROM NEW.name THEN json_build_object('old', OLD.name, 'new', NEW.name) ELSE NULL END,
          'phone', CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN json_build_object('old', OLD.phone, 'new', NEW.phone) ELSE NULL END,
          'company', CASE WHEN OLD.company IS DISTINCT FROM NEW.company THEN json_build_object('old', OLD.company, 'new', NEW.company) ELSE NULL END,
          'email', CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN json_build_object('old', OLD.email, 'new', NEW.email) ELSE NULL END
        )
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;
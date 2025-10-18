-- Обновляем функцию archive_product чтобы корректно работать с RLS
CREATE OR REPLACE FUNCTION public.archive_product(product_id uuid, user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Проверяем права пользователя
  IF NOT (has_role(user_id, 'director') OR has_role(user_id, 'admin') OR has_role(user_id, 'sales_manager')) THEN
    RAISE EXCEPTION 'У вас нет прав для архивирования товаров';
  END IF;

  -- Выполняем архивирование
  UPDATE public.products 
  SET 
    archived = true,
    archived_at = now(),
    archived_by = user_id,
    updated_at = now()
  WHERE id = product_id;
  
  -- Проверяем что обновление прошло успешно
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Товар не найден или уже архивирован';
  END IF;
END;
$function$;
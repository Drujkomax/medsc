-- Удаляем старое ограничение valid_category
ALTER TABLE public.products DROP CONSTRAINT valid_category;

-- Создаем функцию для валидации категорий
CREATE OR REPLACE FUNCTION validate_product_category(category_value text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.product_categories 
    WHERE value = category_value
  );
END;
$$ LANGUAGE plpgsql;

-- Добавляем новое ограничение, которое проверяет по таблице категорий
ALTER TABLE public.products 
ADD CONSTRAINT valid_category_dynamic 
CHECK (validate_product_category(category));
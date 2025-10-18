-- 1) Drop the immutable CHECK constraint that blocks unrelated updates
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS valid_category_dynamic;

-- 2) Create a trigger function that validates category only when needed
CREATE OR REPLACE FUNCTION public.validate_product_category_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate on INSERT
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_categories pc
      WHERE pc.value = NEW.category
    ) THEN
      RAISE EXCEPTION 'Invalid category value: "%" not found in product_categories', NEW.category
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  -- Validate on UPDATE only if category actually changed
  IF TG_OP = 'UPDATE' THEN
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.product_categories pc
        WHERE pc.value = NEW.category
      ) THEN
        RAISE EXCEPTION 'Invalid category value: "%" not found in product_categories', NEW.category
          USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Ensure the trigger exists and is unique
DROP TRIGGER IF EXISTS trg_validate_product_category ON public.products;
CREATE TRIGGER trg_validate_product_category
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_category_change();
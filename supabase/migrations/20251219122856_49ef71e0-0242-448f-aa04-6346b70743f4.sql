-- Update slugs to remove UUID suffixes, handling duplicates with numbered suffixes
DO $$
DECLARE
  product_record RECORD;
  clean_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- Process each product with UUID suffix
  FOR product_record IN 
    SELECT id, slug, name->>'en' as name_en
    FROM products 
    WHERE slug ~ '-[a-f0-9]{8}$'
    ORDER BY created_at ASC
  LOOP
    -- Get clean slug without UUID
    clean_slug := regexp_replace(product_record.slug, '-[a-f0-9]{8}$', '', 'i');
    
    -- Check if this clean slug already exists
    IF EXISTS (SELECT 1 FROM products WHERE slug = clean_slug AND id != product_record.id) THEN
      -- Find next available number
      counter := 2;
      new_slug := clean_slug || '-' || counter;
      WHILE EXISTS (SELECT 1 FROM products WHERE slug = new_slug) LOOP
        counter := counter + 1;
        new_slug := clean_slug || '-' || counter;
      END LOOP;
    ELSE
      new_slug := clean_slug;
    END IF;
    
    -- Update the product
    UPDATE products SET slug = new_slug WHERE id = product_record.id;
  END LOOP;
END $$;
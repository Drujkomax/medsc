-- Add currency field to products table
ALTER TABLE public.products 
ADD COLUMN currency text DEFAULT 'USD';

-- Add comment for currency field
COMMENT ON COLUMN public.products.currency IS 'Product price currency (USD, EUR)';

-- Create categories table for dynamic category management
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name jsonb NOT NULL, -- {ru: string, en: string, uz: string}
  value text NOT NULL UNIQUE, -- slug/key for the category
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS for product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" 
ON public.product_categories 
FOR SELECT 
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories" 
ON public.product_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.product_categories (value, name) VALUES
('diagnostic', '{"ru": "Диагностическое оборудование", "en": "Diagnostic Equipment", "uz": "Diagnostika uskunalari"}'),
('surgical', '{"ru": "Хирургическое оборудование", "en": "Surgical Equipment", "uz": "Jarrohlik uskunalari"}'),
('monitoring', '{"ru": "Мониторинг", "en": "Monitoring", "uz": "Monitoring"}'),
('laboratory', '{"ru": "Лабораторное оборудование", "en": "Laboratory Equipment", "uz": "Laboratoriya uskunalari"}'),
('rehabilitation', '{"ru": "Реабилитационное оборудование", "en": "Rehabilitation Equipment", "uz": "Reabilitatsiya uskunalari"}'),
('dental', '{"ru": "Стоматологическое оборудование", "en": "Dental Equipment", "uz": "Stomatologiya uskunalari"}'),
('ophthalmology', '{"ru": "Офтальмологическое оборудование", "en": "Ophthalmology Equipment", "uz": "Oftalmologiya uskunalari"}'),
('furniture', '{"ru": "Медицинская мебель", "en": "Medical Furniture", "uz": "Tibbiy mebel"}')
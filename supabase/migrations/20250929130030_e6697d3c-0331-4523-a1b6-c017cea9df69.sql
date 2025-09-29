-- Создание таблицы для управления услугами
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title JSONB NOT NULL,
  description JSONB NOT NULL,
  category TEXT NOT NULL,
  price TEXT,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '{"cover": null, "gallery": []}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Создание индексов
CREATE INDEX idx_services_status ON public.services(status);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_created_at ON public.services(created_at);

-- Включение Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS политики для услуг
-- Публичный доступ на чтение активных услуг
CREATE POLICY "Public can view active services" 
ON public.services 
FOR SELECT 
USING (status = 'active');

-- Менеджеры могут управлять всеми услугами
CREATE POLICY "Managers can manage all services" 
ON public.services 
FOR ALL 
USING (has_role_level(auth.uid(), 'sales_manager'::app_role));

-- Создание триггера для обновления updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Создание таблицы категорий услуг
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name JSONB NOT NULL,
  value TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Включение RLS для категорий услуг
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- RLS политики для категорий услуг
CREATE POLICY "Public can view service categories" 
ON public.service_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can manage service categories" 
ON public.service_categories 
FOR ALL 
USING (has_role_level(auth.uid(), 'sales_manager'::app_role));

-- Вставка базовых категорий услуг
INSERT INTO public.service_categories (name, value) VALUES
(
  '{"ru": "Консультации", "en": "Consultations", "uz": "Maslahatlar"}', 
  'consultations'
),
(
  '{"ru": "Техническое обслуживание", "en": "Technical Support", "uz": "Texnik xizmat"}', 
  'technical_support'
),
(
  '{"ru": "Установка и настройка", "en": "Installation", "uz": "O''rnatish va sozlash"}', 
  'installation'
),
(
  '{"ru": "Обучение персонала", "en": "Training", "uz": "Xodimlarni o''qitish"}', 
  'training'
),
(
  '{"ru": "Гарантийное обслуживание", "en": "Warranty Service", "uz": "Kafolat xizmati"}', 
  'warranty'
);

-- Создание триггера для обновления updated_at категорий
CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
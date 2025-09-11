-- Добавляем поля для квалификации лидов
ALTER TABLE public.leads ADD COLUMN budget_range text;
ALTER TABLE public.leads ADD COLUMN position text;
ALTER TABLE public.leads ADD COLUMN equipment_interest text;
ALTER TABLE public.leads ADD COLUMN timeline text;
ALTER TABLE public.leads ADD COLUMN qualification_date timestamp with time zone;
ALTER TABLE public.leads ADD COLUMN qualified_by uuid;

-- Добавляем комментарии для новых полей
COMMENT ON COLUMN public.leads.budget_range IS 'Диапазон бюджета (например: "до $10K", "$10K-50K", "свыше $100K")';
COMMENT ON COLUMN public.leads.position IS 'Должность/позиция контакта';
COMMENT ON COLUMN public.leads.equipment_interest IS 'Тип интересующего оборудования';
COMMENT ON COLUMN public.leads.timeline IS 'Сроки реализации интереса';
COMMENT ON COLUMN public.leads.qualification_date IS 'Дата квалификации лида';
COMMENT ON COLUMN public.leads.qualified_by IS 'Кто провел квалификацию';
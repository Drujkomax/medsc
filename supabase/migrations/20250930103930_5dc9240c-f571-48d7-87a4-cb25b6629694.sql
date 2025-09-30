-- Добавляем поля для назначения ролей в таблицу deals
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS assigned_engineer uuid,
ADD COLUMN IF NOT EXISTS assigned_accountant uuid,
ADD COLUMN IF NOT EXISTS assigned_salesperson uuid;
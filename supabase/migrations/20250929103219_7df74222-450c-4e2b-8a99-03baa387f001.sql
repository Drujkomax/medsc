-- Обновляем enum app_role, добавляя новые должности
ALTER TYPE public.app_role ADD VALUE 'accountant';
ALTER TYPE public.app_role ADD VALUE 'engineer';
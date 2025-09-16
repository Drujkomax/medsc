-- Обновляем роль существующего пользователя на продавца
UPDATE public.user_roles 
SET role = 'salesperson'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'makhsud@medsc.uz');

-- Подтверждаем email если не подтвержден
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
WHERE email = 'makhsud@medsc.uz';
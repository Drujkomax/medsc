-- Подтверждаем email для директора
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'director@medsc.uz';

-- Убеждаемся что у пользователя есть роль директора
INSERT INTO public.user_roles (user_id, role)
VALUES ('b5c0910a-d1b1-47c3-98f6-cb0f4eaab0c1', 'director')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'director';
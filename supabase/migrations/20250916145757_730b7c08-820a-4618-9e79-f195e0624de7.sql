-- Создаем пользователя напрямую в auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'makhsud@medsc.uz',
  crypt('msc007uz', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Получаем ID созданного пользователя и назначаем роль
WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'makhsud@medsc.uz'
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'salesperson'::app_role FROM new_user;
-- Обновляем имена сотрудников на корректные
UPDATE public.profiles 
SET full_name = 'Махсуд Ахмедов'
WHERE email = 'makhsud@medsc.uz';

UPDATE public.profiles 
SET full_name = 'Ирина Рожкова'
WHERE email = 'irinar@medsc.uz';

UPDATE public.profiles 
SET full_name = 'Дмитрий Петров'
WHERE email = 'dmitriy@medsc.uz';

UPDATE public.profiles 
SET full_name = 'Церен Батоев'
WHERE email = 'tseren@medsc.uz';

UPDATE public.profiles 
SET full_name = 'РОП Менеджер'
WHERE email = 'rop@medsc.uz';

UPDATE public.profiles 
SET full_name = 'Отдел продаж'
WHERE email = 'sales@medsc.uz';

UPDATE public.profiles 
SET full_name = 'Администратор'
WHERE email = 'admin@medsc.uz';

UPDATE public.profiles 
SET full_name = 'Директор'
WHERE email = 'director@medsc.uz';
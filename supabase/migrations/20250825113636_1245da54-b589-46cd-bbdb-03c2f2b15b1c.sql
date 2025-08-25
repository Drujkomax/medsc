-- Добавляем уникальный constraint на user_id в таблице user_roles если его нет
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Создаем таблицу для приглашений
CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  used BOOLEAN DEFAULT false
);

-- Включаем RLS для таблицы приглашений
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Политика для приглашений - только директора и админы могут создавать
CREATE POLICY "Directors and admins can manage invites" ON public.user_invites
FOR ALL USING (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'admin'));
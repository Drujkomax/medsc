# Техническое задание: Система управления контактами (Contacts Management System)

## 1. Структура базы данных

### 1.1 Таблица site_contacts (Контактная информация компании)

```sql
CREATE TABLE public.site_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основные контакты
  phone TEXT,
  email TEXT,
  address TEXT,
  working_hours TEXT,
  
  -- Социальные сети и мессенджеры
  whatsapp TEXT,
  telegram TEXT,
  instagram TEXT,
  facebook TEXT,
  youtube TEXT,
  
  -- Координаты для карты (опционально)
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~* '^\+?[0-9\s\-\(\)]+$')
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_site_contacts_updated_at
  BEFORE UPDATE ON public.site_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы
CREATE INDEX idx_site_contacts_updated_at ON public.site_contacts(updated_at DESC);

-- Должна быть только одна запись контактов
CREATE UNIQUE INDEX unique_site_contacts ON public.site_contacts((id IS NOT NULL));
```

### 1.2 Таблица contact_inquiries (Обращения/заявки с формы контактов)

```sql
CREATE TABLE public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Информация о клиенте
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Сообщение
  subject TEXT,
  message TEXT NOT NULL,
  
  -- Категория обращения
  inquiry_type TEXT DEFAULT 'general', -- 'general', 'quote', 'support', 'partnership', 'career'
  
  -- Статус обработки
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'resolved', 'closed', 'spam'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Назначение и обработка
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ответ администратора
  admin_response TEXT,
  response_sent BOOLEAN DEFAULT false,
  
  -- Источник обращения
  source TEXT DEFAULT 'website_form', -- 'website_form', 'email', 'phone', 'chat'
  referrer TEXT, -- URL страницы, откуда пришло обращение
  user_agent TEXT,
  ip_address INET,
  
  -- Метаданные
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[], -- Теги для категоризации
  
  -- Временные метки
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'spam')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_inquiry_type CHECK (inquiry_type IN ('general', 'quote', 'support', 'partnership', 'career')),
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]+$'),
  CONSTRAINT message_not_empty CHECK (char_length(trim(message)) >= 10),
  CONSTRAINT name_not_empty CHECK (char_length(trim(name)) >= 2)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы для производительности
CREATE INDEX idx_contact_inquiries_status ON public.contact_inquiries(status) WHERE status != 'closed';
CREATE INDEX idx_contact_inquiries_assigned_to ON public.contact_inquiries(assigned_to);
CREATE INDEX idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
CREATE INDEX idx_contact_inquiries_priority ON public.contact_inquiries(priority) WHERE status NOT IN ('closed', 'spam');
CREATE INDEX idx_contact_inquiries_inquiry_type ON public.contact_inquiries(inquiry_type);
CREATE INDEX idx_contact_inquiries_tags ON public.contact_inquiries USING gin(tags);

-- Полнотекстовый поиск
CREATE INDEX idx_contact_inquiries_message_search ON public.contact_inquiries 
  USING gin(to_tsvector('russian', message));
CREATE INDEX idx_contact_inquiries_name_search ON public.contact_inquiries 
  USING gin(to_tsvector('russian', name));
```

### 1.3 Таблица contact_inquiry_activities (История действий)

```sql
CREATE TABLE public.contact_inquiry_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.contact_inquiries(id) ON DELETE CASCADE,
  
  -- Тип действия
  action_type TEXT NOT NULL, -- 'status_change', 'assigned', 'responded', 'note_added', 'priority_changed'
  
  -- Детали
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  
  -- Кто выполнил
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Метаданные
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_inquiry_activities_inquiry_id ON public.contact_inquiry_activities(inquiry_id);
CREATE INDEX idx_inquiry_activities_performed_at ON public.contact_inquiry_activities(performed_at DESC);
```

### 1.4 Таблица contact_inquiry_notes (Внутренние заметки)

```sql
CREATE TABLE public.contact_inquiry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.contact_inquiries(id) ON DELETE CASCADE,
  
  -- Заметка
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true, -- Внутренняя заметка или видимая клиенту
  
  -- Автор
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) >= 1)
);

CREATE INDEX idx_inquiry_notes_inquiry_id ON public.contact_inquiry_notes(inquiry_id);
CREATE INDEX idx_inquiry_notes_created_at ON public.contact_inquiry_notes(created_at DESC);
```

## 2. RLS Политики

### 2.1 Политики для site_contacts

```sql
ALTER TABLE public.site_contacts ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения (для отображения на сайте)
CREATE POLICY "Site contacts are publicly viewable"
ON public.site_contacts
FOR SELECT
TO public
USING (true);

-- Только админы могут управлять контактами компании
CREATE POLICY "Admins can manage site contacts"
ON public.site_contacts
FOR ALL
TO authenticated
USING (has_role_level(auth.uid(), 'admin'))
WITH CHECK (has_role_level(auth.uid(), 'admin'));
```

### 2.2 Политики для contact_inquiries

```sql
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Любой может создать обращение (публичная форма)
CREATE POLICY "Anyone can submit contact inquiry"
ON public.contact_inquiries
FOR INSERT
TO public
WITH CHECK (true);

-- Админы и менеджеры могут просматривать все обращения
CREATE POLICY "Admins and managers can view all inquiries"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'));

-- Назначенные сотрудники могут видеть свои обращения
CREATE POLICY "Assigned users can view their inquiries"
ON public.contact_inquiries
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Менеджеры могут обновлять обращения
CREATE POLICY "Managers can update inquiries"
ON public.contact_inquiries
FOR UPDATE
TO authenticated
USING (has_role_level(auth.uid(), 'sales_manager'))
WITH CHECK (has_role_level(auth.uid(), 'sales_manager'));

-- Назначенные пользователи могут обновлять свои обращения
CREATE POLICY "Assigned users can update their inquiries"
ON public.contact_inquiries
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- Только админы могут удалять обращения
CREATE POLICY "Only admins can delete inquiries"
ON public.contact_inquiries
FOR DELETE
TO authenticated
USING (has_role_level(auth.uid(), 'admin'));
```

### 2.3 Политики для contact_inquiry_activities

```sql
ALTER TABLE public.contact_inquiry_activities ENABLE ROW LEVEL SECURITY;

-- Система может создавать записи активности
CREATE POLICY "System can insert activities"
ON public.contact_inquiry_activities
FOR INSERT
TO authenticated
WITH CHECK (performed_by = auth.uid());

-- Сотрудники могут просматривать активность своих обращений
CREATE POLICY "Users can view inquiry activities"
ON public.contact_inquiry_activities
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contact_inquiries ci
    WHERE ci.id = inquiry_id
      AND (has_role_level(auth.uid(), 'sales_manager') OR ci.assigned_to = auth.uid())
  )
);
```

### 2.4 Политики для contact_inquiry_notes

```sql
ALTER TABLE public.contact_inquiry_notes ENABLE ROW LEVEL SECURITY;

-- Сотрудники могут создавать заметки
CREATE POLICY "Employees can create notes"
ON public.contact_inquiry_notes
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.contact_inquiries ci
    WHERE ci.id = inquiry_id
      AND (has_role_level(auth.uid(), 'sales_manager') OR ci.assigned_to = auth.uid())
  )
);

-- Сотрудники могут просматривать заметки
CREATE POLICY "Employees can view notes"
ON public.contact_inquiry_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contact_inquiries ci
    WHERE ci.id = inquiry_id
      AND (has_role_level(auth.uid(), 'sales_manager') OR ci.assigned_to = auth.uid())
  )
);

-- Авторы могут обновлять свои заметки
CREATE POLICY "Authors can update their notes"
ON public.contact_inquiry_notes
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Авторы или админы могут удалять заметки
CREATE POLICY "Authors or admins can delete notes"
ON public.contact_inquiry_notes
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR has_role_level(auth.uid(), 'admin'));
```

## 3. SQL функции

### 3.1 Функция создания обращения с валидацией

```sql
CREATE OR REPLACE FUNCTION public.create_contact_inquiry(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_message TEXT,
  p_subject TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_inquiry_type TEXT DEFAULT 'general',
  p_source TEXT DEFAULT 'website_form',
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inquiry_id UUID;
  v_is_spam BOOLEAN := false;
BEGIN
  -- Базовая валидация
  IF char_length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Имя должно содержать минимум 2 символа';
  END IF;
  
  IF char_length(trim(p_message)) < 10 THEN
    RAISE EXCEPTION 'Сообщение должно содержать минимум 10 символов';
  END IF;
  
  -- Проверка на спам (простая проверка по частоте обращений)
  IF EXISTS (
    SELECT 1 FROM public.contact_inquiries
    WHERE (email = p_email OR ip_address = p_ip_address)
      AND created_at > now() - interval '1 hour'
      AND status != 'spam'
  ) THEN
    v_is_spam := true;
  END IF;
  
  -- Проверка на запрещенные слова в сообщении (пример)
  IF p_message ~* '(viagra|casino|bitcoin|crypto|loan)' THEN
    v_is_spam := true;
  END IF;
  
  -- Создаем обращение
  INSERT INTO public.contact_inquiries (
    name, email, phone, company, subject, message,
    inquiry_type, status, source, referrer, user_agent, ip_address
  ) VALUES (
    trim(p_name),
    NULLIF(trim(p_email), ''),
    NULLIF(trim(p_phone), ''),
    NULLIF(trim(p_company), ''),
    NULLIF(trim(p_subject), ''),
    trim(p_message),
    p_inquiry_type,
    CASE WHEN v_is_spam THEN 'spam' ELSE 'new' END,
    p_source,
    p_referrer,
    p_user_agent,
    p_ip_address
  )
  RETURNING id INTO v_inquiry_id;
  
  -- Логируем создание
  INSERT INTO public.contact_inquiry_activities (
    inquiry_id, action_type, new_value, metadata
  ) VALUES (
    v_inquiry_id,
    'created',
    'new',
    jsonb_build_object('is_spam', v_is_spam, 'source', p_source)
  );
  
  RETURN v_inquiry_id;
END;
$$;
```

### 3.2 Функция назначения обращения

```sql
CREATE OR REPLACE FUNCTION public.assign_inquiry(
  p_inquiry_id UUID,
  p_user_id UUID,
  p_assigned_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_assigned_to UUID;
  v_current_user UUID;
BEGIN
  -- Получаем текущего пользователя
  v_current_user := COALESCE(p_assigned_by, auth.uid());
  
  -- Проверяем права
  IF NOT (has_role(v_current_user, 'director') OR 
          has_role(v_current_user, 'admin') OR 
          has_role(v_current_user, 'sales_manager')) THEN
    RAISE EXCEPTION 'Недостаточно прав для назначения обращений';
  END IF;
  
  -- Получаем текущего исполнителя
  SELECT assigned_to INTO v_old_assigned_to
  FROM public.contact_inquiries
  WHERE id = p_inquiry_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Обращение не найдено';
  END IF;
  
  -- Обновляем назначение
  UPDATE public.contact_inquiries
  SET 
    assigned_to = p_user_id,
    assigned_at = now(),
    status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END,
    updated_at = now()
  WHERE id = p_inquiry_id;
  
  -- Логируем назначение
  INSERT INTO public.contact_inquiry_activities (
    inquiry_id,
    action_type,
    old_value,
    new_value,
    performed_by
  ) VALUES (
    p_inquiry_id,
    'assigned',
    v_old_assigned_to::TEXT,
    p_user_id::TEXT,
    v_current_user
  );
END;
$$;
```

### 3.3 Функция обновления статуса

```sql
CREATE OR REPLACE FUNCTION public.update_inquiry_status(
  p_inquiry_id UUID,
  p_new_status TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
  v_timestamp_field TEXT;
BEGIN
  -- Получаем текущий статус
  SELECT status INTO v_old_status
  FROM public.contact_inquiries
  WHERE id = p_inquiry_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Обращение не найдено';
  END IF;
  
  -- Определяем поле временной метки для обновления
  v_timestamp_field := CASE p_new_status
    WHEN 'in_progress' THEN 'assigned_at'
    WHEN 'resolved' THEN 'resolved_at'
    WHEN 'closed' THEN 'closed_at'
    ELSE NULL
  END;
  
  -- Обновляем статус
  IF v_timestamp_field = 'resolved_at' THEN
    UPDATE public.contact_inquiries
    SET status = p_new_status, resolved_at = now(), updated_at = now()
    WHERE id = p_inquiry_id;
  ELSIF v_timestamp_field = 'closed_at' THEN
    UPDATE public.contact_inquiries
    SET status = p_new_status, closed_at = now(), updated_at = now()
    WHERE id = p_inquiry_id;
  ELSE
    UPDATE public.contact_inquiries
    SET status = p_new_status, updated_at = now()
    WHERE id = p_inquiry_id;
  END IF;
  
  -- Логируем изменение статуса
  INSERT INTO public.contact_inquiry_activities (
    inquiry_id,
    action_type,
    old_value,
    new_value,
    comment,
    performed_by
  ) VALUES (
    p_inquiry_id,
    'status_change',
    v_old_status,
    p_new_status,
    p_comment,
    auth.uid()
  );
END;
$$;
```

### 3.4 Функция отправки ответа

```sql
CREATE OR REPLACE FUNCTION public.send_inquiry_response(
  p_inquiry_id UUID,
  p_response TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Обновляем обращение
  UPDATE public.contact_inquiries
  SET 
    admin_response = p_response,
    response_sent = true,
    responded_at = now(),
    status = CASE WHEN status = 'new' THEN 'in_progress' ELSE status END,
    updated_at = now()
  WHERE id = p_inquiry_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Обращение не найдено';
  END IF;
  
  -- Логируем отправку ответа
  INSERT INTO public.contact_inquiry_activities (
    inquiry_id,
    action_type,
    new_value,
    performed_by
  ) VALUES (
    p_inquiry_id,
    'responded',
    'Response sent',
    auth.uid()
  );
END;
$$;
```

### 3.5 Функция получения статистики обращений

```sql
CREATE OR REPLACE FUNCTION public.get_inquiry_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_inquiries INTEGER,
  new_inquiries INTEGER,
  in_progress INTEGER,
  resolved INTEGER,
  closed INTEGER,
  spam INTEGER,
  avg_response_time INTERVAL,
  avg_resolution_time INTERVAL,
  by_type JSONB,
  by_priority JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_inquiries,
    COUNT(*) FILTER (WHERE status = 'new')::INTEGER as new_inquiries,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress,
    COUNT(*) FILTER (WHERE status = 'resolved')::INTEGER as resolved,
    COUNT(*) FILTER (WHERE status = 'closed')::INTEGER as closed,
    COUNT(*) FILTER (WHERE status = 'spam')::INTEGER as spam,
    AVG(responded_at - created_at) FILTER (WHERE responded_at IS NOT NULL) as avg_response_time,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time,
    (
      SELECT jsonb_object_agg(inquiry_type, count)
      FROM (
        SELECT inquiry_type, COUNT(*) as count
        FROM public.contact_inquiries
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY inquiry_type
      ) t
    ) as by_type,
    (
      SELECT jsonb_object_agg(priority, count)
      FROM (
        SELECT priority, COUNT(*) as count
        FROM public.contact_inquiries
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY priority
      ) t
    ) as by_priority
  FROM public.contact_inquiries
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$;
```

## 4. TypeScript типы

### 4.1 Основные типы

```typescript
// src/types/contacts.ts

export interface SiteContacts {
  id: string;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface ContactInquiry {
  id: string;
  
  // Информация о клиенте
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  
  // Сообщение
  subject?: string;
  message: string;
  
  // Категория и статус
  inquiry_type: 'general' | 'quote' | 'support' | 'partnership' | 'career';
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Назначение
  assigned_to?: string;
  assigned_at?: string;
  responded_at?: string;
  resolved_at?: string;
  closed_at?: string;
  
  // Ответ
  admin_response?: string;
  response_sent: boolean;
  
  // Источник
  source: 'website_form' | 'email' | 'phone' | 'chat';
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  
  // Метаданные
  metadata?: Record<string, any>;
  tags?: string[];
  
  // Временные метки
  created_at: string;
  updated_at: string;
}

export interface ContactInquiryFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  inquiry_type?: 'general' | 'quote' | 'support' | 'partnership' | 'career';
}

export interface ContactInquiryFilters {
  search?: string;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'spam';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  inquiry_type?: 'general' | 'quote' | 'support' | 'partnership' | 'career';
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
}

export interface InquiryActivity {
  id: string;
  inquiry_id: string;
  action_type: 'status_change' | 'assigned' | 'responded' | 'note_added' | 'priority_changed' | 'created';
  old_value?: string;
  new_value?: string;
  comment?: string;
  performed_by?: string;
  performed_at: string;
  metadata?: Record<string, any>;
  // Populated
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface InquiryNote {
  id: string;
  inquiry_id: string;
  content: string;
  is_internal: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Populated
  author?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface InquiryStats {
  total_inquiries: number;
  new_inquiries: number;
  in_progress: number;
  resolved: number;
  closed: number;
  spam: number;
  avg_response_time?: string; // Interval as string
  avg_resolution_time?: string;
  by_type?: Record<string, number>;
  by_priority?: Record<string, number>;
}
```

## 5. React Hooks

### 5.1 Hook useSiteContacts

```typescript
// src/hooks/useSiteContacts.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SiteContacts } from '@/types/contacts';

export const useSiteContacts = () => {
  const [contacts, setContacts] = useState<SiteContacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('site_contacts')
        .select('*')
        .maybeSingle();

      if (fetchError) throw fetchError;

      setContacts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки контактов';
      setError(errorMessage);
      console.error('Error fetching site contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContacts = useCallback(async (contactsData: Partial<SiteContacts>) => {
    try {
      // Если записи нет, создаем новую
      if (!contacts) {
        const { data, error: insertError } = await supabase
          .from('site_contacts')
          .insert([contactsData])
          .select()
          .single();

        if (insertError) throw insertError;
        
        setContacts(data);
        return data;
      }

      // Обновляем существующую запись
      const { data, error: updateError } = await supabase
        .from('site_contacts')
        .update(contactsData)
        .eq('id', contacts.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setContacts(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления контактов';
      throw new Error(errorMessage);
    }
  }, [contacts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    updateContacts,
    refetch: fetchContacts,
  };
};
```

### 5.2 Hook useContactInquiries

```typescript
// src/hooks/useContactInquiries.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ContactInquiry, 
  ContactInquiryFilters, 
  InquiryStats,
  InquiryActivity,
  InquiryNote 
} from '@/types/contacts';

export const useContactInquiries = (filters?: ContactInquiryFilters) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<InquiryStats | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('contact_inquiries')
        .select('*');

      // Применяем фильтры
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,message.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.inquiry_type) {
        query = query.eq('inquiry_type', filters.inquiry_type);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInquiries(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки обращений';
      setError(errorMessage);
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase
        .rpc('get_inquiry_stats');

      if (statsError) throw statsError;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error fetching inquiry stats:', err);
    }
  }, []);

  const createInquiry = useCallback(async (
    inquiryData: ContactInquiryFormData,
    metadata?: {
      referrer?: string;
      user_agent?: string;
      ip_address?: string;
    }
  ) => {
    try {
      const { data, error } = await supabase.rpc('create_contact_inquiry', {
        p_name: inquiryData.name,
        p_email: inquiryData.email || null,
        p_phone: inquiryData.phone || null,
        p_message: inquiryData.message,
        p_subject: inquiryData.subject || null,
        p_company: inquiryData.company || null,
        p_inquiry_type: inquiryData.inquiry_type || 'general',
        p_source: 'website_form',
        p_referrer: metadata?.referrer || null,
        p_user_agent: metadata?.user_agent || null,
        p_ip_address: metadata?.ip_address || null,
      });

      if (error) throw error;

      await fetchInquiries();
      await fetchStats();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания обращения';
      throw new Error(errorMessage);
    }
  }, [fetchInquiries, fetchStats]);

  const assignInquiry = useCallback(async (inquiryId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('assign_inquiry', {
        p_inquiry_id: inquiryId,
        p_user_id: userId,
      });

      if (error) throw error;

      await fetchInquiries();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка назначения обращения';
      throw new Error(errorMessage);
    }
  }, [fetchInquiries]);

  const updateStatus = useCallback(async (
    inquiryId: string, 
    newStatus: ContactInquiry['status'],
    comment?: string
  ) => {
    try {
      const { error } = await supabase.rpc('update_inquiry_status', {
        p_inquiry_id: inquiryId,
        p_new_status: newStatus,
        p_comment: comment,
      });

      if (error) throw error;

      await fetchInquiries();
      await fetchStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления статуса';
      throw new Error(errorMessage);
    }
  }, [fetchInquiries, fetchStats]);

  const sendResponse = useCallback(async (inquiryId: string, response: string) => {
    try {
      const { error } = await supabase.rpc('send_inquiry_response', {
        p_inquiry_id: inquiryId,
        p_response: response,
      });

      if (error) throw error;

      await fetchInquiries();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отправки ответа';
      throw new Error(errorMessage);
    }
  }, [fetchInquiries]);

  const updatePriority = useCallback(async (
    inquiryId: string, 
    priority: ContactInquiry['priority']
  ) => {
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ priority })
        .eq('id', inquiryId);

      if (error) throw error;

      await fetchInquiries();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления приоритета';
      throw new Error(errorMessage);
    }
  }, [fetchInquiries]);

  useEffect(() => {
    fetchInquiries();
    fetchStats();
  }, [fetchInquiries, fetchStats]);

  // Real-time подписка
  useEffect(() => {
    const channel = supabase
      .channel('contact_inquiries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_inquiries',
        },
        () => {
          fetchInquiries();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInquiries, fetchStats]);

  return {
    inquiries,
    loading,
    error,
    stats,
    createInquiry,
    assignInquiry,
    updateStatus,
    sendResponse,
    updatePriority,
    refetch: fetchInquiries,
  };
};
```

### 5.3 Hook для одного обращения

```typescript
// src/hooks/useContactInquiry.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ContactInquiry, InquiryActivity, InquiryNote } from '@/types/contacts';

export const useContactInquiry = (id: string) => {
  const [inquiry, setInquiry] = useState<ContactInquiry | null>(null);
  const [activities, setActivities] = useState<InquiryActivity[]>([]);
  const [notes, setNotes] = useState<InquiryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contact_inquiries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setInquiry(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Обращение не найдено';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_inquiry_activities')
        .select(`
          *,
          user:performed_by(id, email, full_name)
        `)
        .eq('inquiry_id', id)
        .order('performed_at', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_inquiry_notes')
        .select(`
          *,
          author:created_by(id, email, full_name)
        `)
        .eq('inquiry_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  }, [id]);

  const addNote = useCallback(async (content: string, isInternal: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase
        .from('contact_inquiry_notes')
        .insert([{
          inquiry_id: id,
          content,
          is_internal: isInternal,
          created_by: user.id,
        }]);

      if (error) throw error;

      await fetchNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка добавления заметки';
      throw new Error(errorMessage);
    }
  }, [id, fetchNotes]);

  useEffect(() => {
    if (id) {
      fetchInquiry();
      fetchActivities();
      fetchNotes();
    }
  }, [id, fetchInquiry, fetchActivities, fetchNotes]);

  return {
    inquiry,
    activities,
    notes,
    loading,
    error,
    addNote,
    refetch: fetchInquiry,
  };
};
```

## 6. Валидация (Zod)

```typescript
// src/lib/validations/contact.ts

import { z } from 'zod';

export const contactInquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя должно содержать максимум 100 символов')
    .refine(
      (val) => !/[<>\"']/.test(val),
      'Имя содержит недопустимые символы'
    ),
  
  email: z
    .string()
    .trim()
    .email('Некорректный email адрес')
    .max(255, 'Email должен содержать максимум 255 символов')
    .optional()
    .or(z.literal('')),
  
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Некорректный номер телефона')
    .max(20, 'Номер телефона слишком длинный')
    .optional()
    .or(z.literal('')),
  
  company: z
    .string()
    .trim()
    .max(200, 'Название компании должно содержать максимум 200 символов')
    .optional()
    .or(z.literal('')),
  
  subject: z
    .string()
    .trim()
    .max(200, 'Тема должна содержать максимум 200 символов')
    .optional()
    .or(z.literal('')),
  
  message: z
    .string()
    .trim()
    .min(10, 'Сообщение должно содержать минимум 10 символов')
    .max(2000, 'Сообщение должно содержать максимум 2000 символов')
    .refine(
      (val) => !/[<>]/.test(val),
      'Сообщение содержит недопустимые символы'
    ),
  
  inquiry_type: z
    .enum(['general', 'quote', 'support', 'partnership', 'career'])
    .default('general'),
});

// Валидация с проверкой наличия хотя бы одного способа связи
export const contactInquirySchemaStrict = contactInquirySchema.refine(
  (data) => data.email || data.phone,
  {
    message: 'Необходимо указать хотя бы один способ связи (email или телефон)',
    path: ['email'],
  }
);

export const siteContactsSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Некорректный номер телефона')
    .optional()
    .or(z.literal('')),
  
  email: z
    .string()
    .trim()
    .email('Некорректный email адрес')
    .optional()
    .or(z.literal('')),
  
  address: z.string().trim().max(500).optional().or(z.literal('')),
  working_hours: z.string().trim().max(200).optional().or(z.literal('')),
  
  whatsapp: z.string().trim().max(50).optional().or(z.literal('')),
  telegram: z.string().trim().max(100).optional().or(z.literal('')),
  instagram: z.string().trim().max(100).optional().or(z.literal('')),
  facebook: z.string().trim().max(100).optional().or(z.literal('')),
  youtube: z.string().trim().max(100).optional().or(z.literal('')),
  
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
```

## 7. Права доступа по ролям

### Матрица прав для site_contacts

| Роль | Просмотр | Редактирование |
|------|----------|----------------|
| **Public** | ✅ | ❌ |
| **User** | ✅ | ❌ |
| **All Employees** | ✅ | ❌ |
| **Admin** | ✅ | ✅ |
| **Director** | ✅ | ✅ |

### Матрица прав для contact_inquiries

| Роль | Создание | Просмотр | Назначение | Обновление статуса | Ответ | Удаление |
|------|----------|----------|------------|-------------------|-------|----------|
| **Public** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Salesperson** | ❌ | ✅ Свои | ❌ | ✅ Свои | ✅ Свои | ❌ |
| **Sales Manager** | ❌ | ✅ Все | ✅ | ✅ | ✅ | ❌ |
| **Admin** | ❌ | ✅ Все | ✅ | ✅ | ✅ | ✅ |
| **Director** | ❌ | ✅ Все | ✅ | ✅ | ✅ | ✅ |

## 8. Краткий промпт для AI

```
Создай систему управления контактами с:

БАЗА ДАННЫХ:
- site_contacts: phone, email, address, working_hours, соцсети (whatsapp, telegram, instagram, facebook, youtube), coordinates
- contact_inquiries: name, email, phone, company, subject, message, inquiry_type, status, priority, assigned_to, timestamps, source, metadata, tags
- contact_inquiry_activities: история действий с обращениями
- contact_inquiry_notes: внутренние заметки по обращениям
- RLS: public может создавать inquiries и читать site_contacts, managers+ управляют
- Функции: create_contact_inquiry (с антиспам проверками), assign_inquiry, update_inquiry_status, send_inquiry_response, get_inquiry_stats

FRONTEND:
- Hooks: useSiteContacts, useContactInquiries(filters), useContactInquiry(id)
- Компоненты: AdminContacts (список обращений), ContactInquiryCard, ContactForm (публичная форма), SiteContactsEditor
- Фильтры: поиск, статус, приоритет, тип обращения, исполнитель, даты
- Real-time обновления

ФУНКЦИОНАЛ:
- Публичная форма контактов с валидацией
- Антиспам проверки (частота, запрещенные слова, IP)
- Статусы: new, in_progress, resolved, closed, spam
- Приоритеты: low, medium, high, urgent
- Типы: general, quote, support, partnership, career
- Назначение исполнителей
- История действий и заметки
- Отправка ответов клиентам
- Статистика (среднее время ответа/решения, распределение по типам)

ВАЛИДАЦИЯ:
- Zod схемы с проверкой на XSS
- name: min 2, max 100 символов
- message: min 10, max 2000 символов
- email или phone обязателен
- Санитизация HTML

БЕЗОПАСНОСТЬ:
- RLS policies для изоляции данных
- SECURITY DEFINER функции
- Защита от спама и флуда
- Валидация email/phone regex
- Логирование всех действий

UI: Status badges, priority colors, activity timeline, notes section, stats dashboard, skeleton loading, toast notifications, HSL semantic tokens.
```

---

Промпт сохранен в `CONTACTS_SYSTEM_PROMPT.md` с полной структурой для воспроизведения системы управления контактами.

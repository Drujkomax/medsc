# СИСТЕМА УПРАВЛЕНИЯ СОТРУДНИКАМИ - ПОЛНЫЙ ТЕХНИЧЕСКИЙ ПРОМПТ

## 👥 ОБЗОР СИСТЕМЫ

Комплексная система управления сотрудниками, ролями и правами доступа для CRM с:
- **Иерархия ролей** - 8 уровней доступа от User до Director
- **Приглашения** - система инвайтов с кастомными правами
- **Временные сотрудники** - с автоматическим истечением срока
- **Кастомные права** - гибкая система разрешений по секциям
- **Активность** - мониторинг и логирование действий
- **Безопасность** - RLS политики на уровне БД

---

## 1. СТРУКТУРА БАЗЫ ДАННЫХ

### 1.1. ENUM: app_role

```sql
CREATE TYPE app_role AS ENUM (
  'user',           -- Обычный пользователь (базовый уровень)
  'observer',       -- Наблюдатель (только чтение)
  'accountant',     -- Бухгалтер
  'engineer',       -- Инженер
  'salesperson',    -- Менеджер по продажам
  'sales_manager',  -- Руководитель отдела продаж
  'admin',          -- Администратор
  'director'        -- Директор (максимальные права)
);
```

**Иерархия ролей (от низшей к высшей):**
```
user < observer < accountant ≈ engineer ≈ salesperson < sales_manager < admin < director
```

### 1.2. Таблица: profiles

Расширенная информация о пользователях (связь с auth.users через id).

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- КРИТИЧНО: Не храним роли в profiles!
-- Роли ВСЕГДА в отдельной таблице user_roles

-- Индексы
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_full_name ON profiles(full_name);

-- Триггер обновления updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 1.3. Таблица: user_roles

Хранение ролей пользователей (один пользователь = одна роль).

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- UNIQUE чтобы у user была только одна роль
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- КРИТИЧНО: Не использовать FOREIGN KEY к auth.users
-- Причина: избежание циклических зависимостей и проблем с RLS
```

### 1.4. Таблица: user_invites

Приглашения для новых сотрудников.

```sql
CREATE TABLE user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL,
  created_by UUID, -- НЕ ССЫЛАЕТСЯ на auth.users
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  used BOOLEAN DEFAULT false,
  
  -- Дополнительные поля для кастомных прав
  custom_permissions JSONB DEFAULT '{}'::jsonb,
  is_temporary BOOLEAN DEFAULT false,
  temporary_expires_at TIMESTAMPTZ,
  
  UNIQUE(email, used) -- Можно создать новый инвайт для email если старый использован
);

-- Индексы
CREATE INDEX idx_user_invites_email ON user_invites(email);
CREATE INDEX idx_user_invites_used ON user_invites(used) WHERE used = false;
CREATE INDEX idx_user_invites_expires ON user_invites(expires_at) WHERE used = false;

-- CHECK constraint
ALTER TABLE user_invites
ADD CONSTRAINT check_temporary_expires 
CHECK (
  (is_temporary = false AND temporary_expires_at IS NULL) OR
  (is_temporary = true AND temporary_expires_at IS NOT NULL)
);
```

### 1.5. Таблица: employee_custom_permissions

Кастомные права доступа к разделам системы.

```sql
CREATE TYPE permission_level AS ENUM ('view_only', 'full_access');

CREATE TABLE employee_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section TEXT NOT NULL CHECK (section IN (
    'products',
    'services',
    'categories',
    'manufacturers',
    'leads',
    'deals',
    'tasks',
    'clients',
    'contacts',
    'analytics',
    'employees',
    'settings'
  )),
  permission_level permission_level NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, section) -- Одна секция = одно разрешение
);

-- Индексы
CREATE INDEX idx_custom_permissions_user ON employee_custom_permissions(user_id);
CREATE INDEX idx_custom_permissions_section ON employee_custom_permissions(section);
CREATE INDEX idx_custom_permissions_composite ON employee_custom_permissions(user_id, section);

-- Триггер обновления
CREATE TRIGGER update_custom_permissions_updated_at
BEFORE UPDATE ON employee_custom_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 1.6. Таблица: temporary_employees

Временные сотрудники с автоматическим истечением доступа.

```sql
CREATE TABLE temporary_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CHECK (expires_at > created_at)
);

-- Индексы
CREATE INDEX idx_temporary_employees_user ON temporary_employees(user_id);
CREATE INDEX idx_temporary_employees_expires ON temporary_employees(expires_at) 
  WHERE is_active = true;
CREATE INDEX idx_temporary_employees_active ON temporary_employees(is_active);
```

### 1.7. Таблица: employee_activity (из Analytics)

```sql
-- См. ANALYTICS_SYSTEM_PROMPT.md для полной структуры
-- Здесь только основные поля для контекста

CREATE TABLE employee_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. RLS ПОЛИТИКИ

### 2.1. profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свой профиль
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Пользователи могут вставлять свой профиль
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Salesperson+ видят профили других сотрудников
CREATE POLICY "Employees can view other profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  has_role_level(auth.uid(), 'salesperson')
);

-- Accountants видят все профили
CREATE POLICY "Accountants can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'accountant'));
```

### 2.2. user_roles

```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свою роль
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Только Directors и Admins управляют ролями
CREATE POLICY "Directors can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'director'))
WITH CHECK (has_role(auth.uid(), 'director'));

CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
```

### 2.3. user_invites

```sql
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Directors и Admins управляют приглашениями
CREATE POLICY "Directors and admins can manage invites"
ON user_invites FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
)
WITH CHECK (
  has_role(auth.uid(), 'director') OR
  has_role(auth.uid(), 'admin')
);

-- Публичный доступ для валидации инвайта (без auth)
-- Реализуется через SECURITY DEFINER функцию validate_invite
```

### 2.4. employee_custom_permissions

```sql
ALTER TABLE employee_custom_permissions ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свои права
CREATE POLICY "Users can view own permissions"
ON employee_custom_permissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Только Directors управляют кастомными правами
CREATE POLICY "Directors can manage custom permissions"
ON employee_custom_permissions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'director'))
WITH CHECK (has_role(auth.uid(), 'director'));
```

### 2.5. temporary_employees

```sql
ALTER TABLE temporary_employees ENABLE ROW LEVEL SECURITY;

-- Пользователи видят свой статус
CREATE POLICY "Users can view own temporary status"
ON temporary_employees FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Directors управляют временными сотрудниками
CREATE POLICY "Directors can manage temporary employees"
ON temporary_employees FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'director'))
WITH CHECK (has_role(auth.uid(), 'director'));
```

---

## 3. SQL ФУНКЦИИ

### 3.1. Функция: has_role

Проверка конкретной роли пользователя.

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### 3.2. Функция: has_role_level

Проверка минимального уровня роли (иерархия).

```sql
CREATE OR REPLACE FUNCTION has_role_level(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        (_min_role = 'user' AND ur.role IN (
          'user', 'observer', 'accountant', 'engineer', 
          'salesperson', 'sales_manager', 'admin', 'director'
        )) OR
        (_min_role = 'observer' AND ur.role IN (
          'observer', 'accountant', 'engineer', 'salesperson', 
          'sales_manager', 'admin', 'director'
        )) OR
        (_min_role = 'accountant' AND ur.role IN (
          'accountant', 'engineer', 'salesperson', 
          'sales_manager', 'admin', 'director'
        )) OR
        (_min_role = 'engineer' AND ur.role IN (
          'engineer', 'salesperson', 'sales_manager', 
          'admin', 'director'
        )) OR
        (_min_role = 'salesperson' AND ur.role IN (
          'salesperson', 'sales_manager', 'admin', 'director'
        )) OR
        (_min_role = 'sales_manager' AND ur.role IN (
          'sales_manager', 'admin', 'director'
        )) OR
        (_min_role = 'admin' AND ur.role IN (
          'admin', 'director'
        )) OR
        (_min_role = 'director' AND ur.role = 'director')
      )
  )
$$;
```

### 3.3. Функция: get_user_role

Получение роли пользователя.

```sql
CREATE OR REPLACE FUNCTION get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1
$$;
```

### 3.4. Функция: has_custom_permission

Проверка кастомных прав на секцию.

```sql
CREATE OR REPLACE FUNCTION has_custom_permission(
  _user_id UUID,
  _section TEXT,
  _required_level TEXT DEFAULT 'view_only'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_custom_permissions ecp
    LEFT JOIN public.temporary_employees te ON te.user_id = ecp.user_id
    WHERE ecp.user_id = _user_id
      AND ecp.section = _section
      AND (
        (_required_level = 'view_only' AND ecp.permission_level IN ('view_only', 'full_access')) OR
        (_required_level = 'full_access' AND ecp.permission_level = 'full_access')
      )
      -- Проверка что временный сотрудник не истек
      AND (te.id IS NULL OR (te.expires_at > now() AND te.is_active = true))
  )
$$;
```

### 3.5. Функция: is_temporary_employee_active

Проверка активности временного сотрудника.

```sql
CREATE OR REPLACE FUNCTION is_temporary_employee_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.temporary_employees
    WHERE user_id = _user_id
      AND expires_at > now()
      AND is_active = true
  )
$$;
```

### 3.6. Функция: create_user_invite

Создание приглашения для нового сотрудника.

```sql
CREATE OR REPLACE FUNCTION create_user_invite(
  invite_email TEXT,
  invite_role app_role
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_id UUID;
  result JSON;
BEGIN
  -- Проверка прав (только Director и Admin)
  IF NOT (
    has_role(auth.uid(), 'director') OR 
    has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'Недостаточно прав для создания приглашений';
  END IF;

  -- Валидация email
  IF invite_email IS NULL OR invite_email = '' THEN
    RAISE EXCEPTION 'Email обязателен';
  END IF;
  
  IF invite_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Некорректный формат email';
  END IF;

  -- Проверка что пользователь с таким email не существует
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = lower(invite_email)) THEN
    RAISE EXCEPTION 'Пользователь с email "%" уже существует', invite_email;
  END IF;
  
  -- Проверка что нет активных приглашений
  IF EXISTS (
    SELECT 1 FROM public.user_invites 
    WHERE lower(email) = lower(invite_email) 
      AND used = false 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Активное приглашение для "%" уже существует', invite_email;
  END IF;

  -- Создание приглашения
  INSERT INTO public.user_invites (email, role, created_by)
  VALUES (invite_email, invite_role, auth.uid())
  RETURNING id INTO invite_id;
  
  result := json_build_object(
    'invite_id', invite_id,
    'email', invite_email,
    'role', invite_role,
    'invite_link', '/admin/register/' || invite_id,
    'expires_at', (now() + interval '7 days')::TEXT
  );
  
  RETURN result;
END;
$$;
```

### 3.7. Функция: validate_invite

Валидация приглашения (публичная, без auth).

```sql
CREATE OR REPLACE FUNCTION validate_invite(p_invite_id UUID)
RETURNS TABLE(
  email TEXT,
  role app_role,
  id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ui.email, ui.role, ui.id
  FROM public.user_invites ui
  WHERE ui.id = p_invite_id
    AND NOT ui.used
    AND ui.expires_at > now();
END;
$$;
```

### 3.8. Функция: assign_role_from_invite

Назначение роли после регистрации по инвайту.

```sql
CREATE OR REPLACE FUNCTION assign_role_from_invite(
  p_invite_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.user_invites%ROWTYPE;
  result JSON;
BEGIN
  -- Получаем приглашение
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = p_invite_id 
    AND NOT used 
    AND expires_at > now();

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Приглашение недействительно или истекло';
  END IF;

  -- Проверка соответствия email
  DECLARE
    profile_email TEXT;
  BEGIN
    SELECT email INTO profile_email 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF profile_email IS NULL OR lower(profile_email) != lower(invite_record.email) THEN
      RAISE EXCEPTION 'Email приглашения не соответствует профилю пользователя';
    END IF;
  END;

  -- Назначение роли (UPSERT)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, invite_record.role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = EXCLUDED.role;

  -- Отметка приглашения как использованного
  UPDATE public.user_invites 
  SET used = true 
  WHERE id = p_invite_id;

  result := json_build_object(
    'user_id', p_user_id,
    'email', invite_record.email,
    'role', invite_record.role,
    'message', 'Роль успешно назначена'
  );

  RETURN result;
END;
$$;
```

### 3.9. Функция: apply_invite_permissions

Применение кастомных прав из инвайта.

```sql
CREATE OR REPLACE FUNCTION apply_invite_permissions(
  p_invite_id UUID,
  p_user_id UUID,
  p_full_access TEXT[],
  p_view_only TEXT[],
  p_is_temporary BOOLEAN,
  p_expires_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.user_invites%ROWTYPE;
  profile_email TEXT;
BEGIN
  -- Валидация инвайта
  SELECT * INTO invite_record
  FROM public.user_invites
  WHERE id = p_invite_id;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Приглашение не найдено';
  END IF;

  -- Валидация email
  SELECT email INTO profile_email 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF profile_email IS NULL OR lower(profile_email) != lower(invite_record.email) THEN
    RAISE EXCEPTION 'Email приглашения не соответствует профилю';
  END IF;

  -- Очистка существующих прав
  DELETE FROM public.employee_custom_permissions 
  WHERE user_id = p_user_id;

  -- Применение full_access прав
  IF array_length(p_full_access, 1) IS NOT NULL THEN
    INSERT INTO public.employee_custom_permissions (
      user_id, section, permission_level, created_by
    )
    SELECT 
      p_user_id, 
      unnest(p_full_access), 
      'full_access'::permission_level, 
      COALESCE(invite_record.created_by, auth.uid());
  END IF;

  -- Применение view_only прав
  IF array_length(p_view_only, 1) IS NOT NULL THEN
    INSERT INTO public.employee_custom_permissions (
      user_id, section, permission_level, created_by
    )
    SELECT 
      p_user_id, 
      unnest(p_view_only), 
      'view_only'::permission_level, 
      COALESCE(invite_record.created_by, auth.uid());
  END IF;

  -- Обработка временного статуса
  IF p_is_temporary AND p_expires_at IS NOT NULL THEN
    INSERT INTO public.temporary_employees (
      user_id, expires_at, is_active, created_by
    )
    VALUES (
      p_user_id, 
      p_expires_at, 
      true, 
      COALESCE(invite_record.created_by, auth.uid())
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      expires_at = EXCLUDED.expires_at,
      is_active = EXCLUDED.is_active,
      created_by = EXCLUDED.created_by;
  ELSE
    DELETE FROM public.temporary_employees 
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
```

### 3.10. Функция: get_employees_with_roles

Получение списка сотрудников с ролями.

```sql
CREATE OR REPLACE FUNCTION get_employees_with_roles()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id AS id,
    p.email,
    COALESCE(p.full_name, p.email) AS full_name,
    ur.role
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE 
    has_role_level(auth.uid(), 'salesperson') OR
    has_role(auth.uid(), 'accountant')
  ORDER BY 
    -- Сортировка по иерархии ролей
    CASE ur.role
      WHEN 'director' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'sales_manager' THEN 3
      WHEN 'salesperson' THEN 4
      WHEN 'accountant' THEN 5
      WHEN 'engineer' THEN 6
      WHEN 'observer' THEN 7
      WHEN 'user' THEN 8
    END,
    p.full_name;
$$;
```

### 3.11. Функция: create_first_director

Создание первого директора в системе.

```sql
CREATE OR REPLACE FUNCTION create_first_director(director_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_id UUID;
  result JSON;
BEGIN
  -- Проверка что директора еще нет
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'director') THEN
    RAISE EXCEPTION 'Директор уже существует в системе';
  END IF;

  -- Валидация email
  IF director_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Некорректный формат email';
  END IF;

  -- Создание приглашения
  INSERT INTO public.user_invites (email, role)
  VALUES (director_email, 'director')
  RETURNING id INTO invite_id;
  
  result := json_build_object(
    'invite_id', invite_id,
    'email', director_email,
    'role', 'director',
    'invite_link', '/admin/register/' || invite_id,
    'message', 'Создано приглашение для первого директора'
  );
  
  RETURN result;
END;
$$;
```

### 3.12. Функция: deactivate_temporary_employee

Деактивация временного сотрудника.

```sql
CREATE OR REPLACE FUNCTION deactivate_temporary_employee(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверка прав
  IF NOT has_role(auth.uid(), 'director') THEN
    RAISE EXCEPTION 'Недостаточно прав';
  END IF;

  UPDATE public.temporary_employees
  SET is_active = false
  WHERE user_id = p_user_id;
  
  -- Удаление кастомных прав
  DELETE FROM public.employee_custom_permissions
  WHERE user_id = p_user_id;
END;
$$;
```

---

## 4. ТРИГГЕРЫ

### 4.1. Триггер: handle_new_user_profile

Создание профиля при регистрации пользователя.

```sql
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- UPSERT для избежания дубликатов
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  
  RETURN NEW;
END;
$$;

-- Создание триггера на auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_profile();
```

### 4.2. Триггер: auto_expire_temporary_employees

Автоматическая деактивация истекших временных сотрудников.

```sql
CREATE OR REPLACE FUNCTION auto_expire_temporary_employees()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.temporary_employees
  SET is_active = false
  WHERE expires_at <= now()
    AND is_active = true;
END;
$$;

-- Можно вызывать через pg_cron или периодически из edge function
```

---

## 5. TYPESCRIPT ТИПЫ

```typescript
// Роли
export type AppRole =
  | 'user'
  | 'observer'
  | 'accountant'
  | 'engineer'
  | 'salesperson'
  | 'sales_manager'
  | 'admin'
  | 'director';

// Уровни разрешений
export type PermissionLevel = 'view_only' | 'full_access';

// Секции системы
export type SystemSection =
  | 'products'
  | 'services'
  | 'categories'
  | 'manufacturers'
  | 'leads'
  | 'deals'
  | 'tasks'
  | 'clients'
  | 'contacts'
  | 'analytics'
  | 'employees'
  | 'settings';

// Профиль пользователя
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Роль пользователя
export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// Сотрудник с ролью
export interface EmployeeWithRole {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: AppRole;
  is_temporary?: boolean;
  expires_at?: string;
  custom_permissions?: CustomPermission[];
}

// Приглашение
export interface UserInvite {
  id: string;
  email: string;
  role: AppRole;
  created_by?: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  custom_permissions?: Record<string, any>;
  is_temporary: boolean;
  temporary_expires_at?: string;
}

// Кастомное разрешение
export interface CustomPermission {
  id: string;
  user_id: string;
  section: SystemSection;
  permission_level: PermissionLevel;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Временный сотрудник
export interface TemporaryEmployee {
  id: string;
  user_id: string;
  expires_at: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

// Данные формы приглашения
export interface InviteFormData {
  email: string;
  role: AppRole;
  isTemporary: boolean;
  expiresAt?: Date;
  customPermissions: {
    fullAccess: SystemSection[];
    viewOnly: SystemSection[];
  };
}

// Данные формы редактирования сотрудника
export interface EmployeeFormData {
  full_name: string;
  role: AppRole;
  isTemporary: boolean;
  expiresAt?: Date;
  customPermissions: {
    fullAccess: SystemSection[];
    viewOnly: SystemSection[];
  };
}

// Статистика сотрудников
export interface EmployeeStats {
  total: number;
  byRole: Record<AppRole, number>;
  temporary: number;
  active: number;
}

// Иерархия ролей
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  user: 0,
  observer: 1,
  accountant: 2,
  engineer: 2,
  salesperson: 2,
  sales_manager: 3,
  admin: 4,
  director: 5,
};

// Переводы ролей
export const ROLE_TRANSLATIONS: Record<AppRole, { ru: string; en: string; uz: string }> = {
  user: { ru: 'Пользователь', en: 'User', uz: 'Foydalanuvchi' },
  observer: { ru: 'Наблюдатель', en: 'Observer', uz: 'Kuzatuvchi' },
  accountant: { ru: 'Бухгалтер', en: 'Accountant', uz: 'Buxgalter' },
  engineer: { ru: 'Инженер', en: 'Engineer', uz: 'Muhandis' },
  salesperson: { ru: 'Менеджер по продажам', en: 'Salesperson', uz: 'Sotuvchi' },
  sales_manager: { ru: 'Руководитель отдела продаж', en: 'Sales Manager', uz: 'Savdo bo\'limi rahbari' },
  admin: { ru: 'Администратор', en: 'Administrator', uz: 'Administrator' },
  director: { ru: 'Директор', en: 'Director', uz: 'Direktor' },
};

// Доступные секции
export const AVAILABLE_SECTIONS: SystemSection[] = [
  'products',
  'services',
  'categories',
  'manufacturers',
  'leads',
  'deals',
  'tasks',
  'clients',
  'contacts',
  'analytics',
  'employees',
  'settings',
];
```

---

## 6. REACT HOOKS

### 6.1. useAuth Hook

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получить текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Подписка на изменения auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
```

### 6.2. useUserRole Hook

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { AppRole } from '@/types/employees';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: user.id,
        });

        if (error) throw error;
        setRole(data);
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    // Real-time обновление ролей
    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { role, loading };
};
```

### 6.3. useUserPermissions Hook

```typescript
import { useUserRole } from './useUserRole';
import { ROLE_HIERARCHY } from '@/types/employees';
import type { AppRole, SystemSection } from '@/types/employees';

export const useUserPermissions = () => {
  const { role, loading } = useUserRole();

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    return role === requiredRole;
  };

  const hasRoleLevel = (minRole: AppRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
  };

  const hasPermission = (section: SystemSection): boolean => {
    if (!role) return false;

    // Директора и админы имеют доступ ко всему
    if (role === 'director' || role === 'admin') return true;

    // Определяем доступ по роли и секции
    const permissions: Record<SystemSection, AppRole[]> = {
      products: ['salesperson', 'sales_manager', 'observer'],
      services: ['salesperson', 'sales_manager', 'observer'],
      categories: ['sales_manager'],
      manufacturers: ['sales_manager'],
      leads: ['salesperson', 'sales_manager'],
      deals: ['salesperson', 'sales_manager', 'accountant'],
      tasks: ['salesperson', 'sales_manager', 'engineer', 'accountant'],
      clients: ['salesperson', 'sales_manager'],
      contacts: ['sales_manager'],
      analytics: ['sales_manager', 'observer'],
      employees: ['sales_manager'],
      settings: ['sales_manager'],
    };

    return permissions[section]?.includes(role) ?? false;
  };

  return {
    role,
    loading,
    hasRole,
    hasRoleLevel,
    hasPermission,
  };
};
```

### 6.4. useCustomPermissions Hook

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CustomPermission } from '@/types/employees';

export const useCustomPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<CustomPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('employee_custom_permissions')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        setPermissions(data || []);
      } catch (error) {
        console.error('Error fetching custom permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();

    // Real-time updates
    const channel = supabase
      .channel('custom-permissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_custom_permissions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPermissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasCustomPermission = (
    section: string,
    level: 'view_only' | 'full_access' = 'view_only'
  ): boolean => {
    const permission = permissions.find((p) => p.section === section);
    if (!permission) return false;

    if (level === 'view_only') {
      return ['view_only', 'full_access'].includes(permission.permission_level);
    }

    return permission.permission_level === 'full_access';
  };

  return { permissions, loading, hasCustomPermission };
};
```

### 6.5. useEmployees Hook

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmployeeWithRole, UserInvite } from '@/types/employees';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<EmployeeWithRole[]>([]);
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка сотрудников
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_employees_with_roles');
      
      if (error) throw error;
      
      // Загружаем временных сотрудников
      const { data: tempEmployees } = await supabase
        .from('temporary_employees')
        .select('*')
        .eq('is_active', true);
      
      // Загружаем кастомные права
      const { data: customPerms } = await supabase
        .from('employee_custom_permissions')
        .select('*');
      
      // Объединяем данные
      const enrichedEmployees = data.map((emp: any) => ({
        ...emp,
        is_temporary: tempEmployees?.some((te) => te.user_id === emp.id),
        expires_at: tempEmployees?.find((te) => te.user_id === emp.id)?.expires_at,
        custom_permissions: customPerms?.filter((cp) => cp.user_id === emp.id) || [],
      }));
      
      setEmployees(enrichedEmployees);
    } catch (error: any) {
      toast.error('Ошибка загрузки сотрудников');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка приглашений
  const loadInvites = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pending_invites');
      
      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
      console.error('Error loading invites:', error);
    }
  };

  // Создание приглашения
  const createInvite = async (formData: InviteFormData) => {
    try {
      const { data, error } = await supabase.rpc('create_user_invite', {
        invite_email: formData.email,
        invite_role: formData.role,
      });

      if (error) throw error;

      // Если есть кастомные права, обновляем запись
      if (
        formData.customPermissions.fullAccess.length > 0 ||
        formData.customPermissions.viewOnly.length > 0
      ) {
        await supabase
          .from('user_invites')
          .update({
            custom_permissions: formData.customPermissions,
            is_temporary: formData.isTemporary,
            temporary_expires_at: formData.expiresAt?.toISOString(),
          })
          .eq('id', data.invite_id);
      }

      toast.success(`Приглашение отправлено на ${formData.email}`);
      await loadInvites();
      
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка создания приглашения');
      throw error;
    }
  };

  // Удаление приглашения
  const deleteInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast.success('Приглашение удалено');
      await loadInvites();
    } catch (error: any) {
      toast.error('Ошибка удаления приглашения');
      throw error;
    }
  };

  // Обновление роли сотрудника
  const updateEmployeeRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Роль обновлена');
      await loadEmployees();
    } catch (error: any) {
      toast.error('Ошибка обновления роли');
      throw error;
    }
  };

  // Деактивация временного сотрудника
  const deactivateTemporaryEmployee = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('deactivate_temporary_employee', {
        p_user_id: userId,
      });

      if (error) throw error;

      toast.success('Сотрудник деактивирован');
      await loadEmployees();
    } catch (error: any) {
      toast.error('Ошибка деактивации сотрудника');
      throw error;
    }
  };

  useEffect(() => {
    loadEmployees();
    loadInvites();

    // Real-time updates
    const employeesChannel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => loadEmployees()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadEmployees()
      )
      .subscribe();

    const invitesChannel = supabase
      .channel('invites-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_invites' },
        () => loadInvites()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(employeesChannel);
      supabase.removeChannel(invitesChannel);
    };
  }, []);

  return {
    employees,
    invites,
    loading,
    createInvite,
    deleteInvite,
    updateEmployeeRole,
    deactivateTemporaryEmployee,
    refresh: () => {
      loadEmployees();
      loadInvites();
    },
  };
};
```

---

## 7. КОМПОНЕНТЫ

### 7.1. Employees.tsx (Главная страница)

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Users, Mail } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import EmployeeCard from '../components/EmployeeCard';
import InviteCard from '../components/InviteCard';
import CreateInviteDialog from '../components/CreateInviteDialog';
import EmployeeStats from '../components/EmployeeStats';

const Employees = () => {
  const { hasRole, hasRoleLevel } = useUserPermissions();
  const { employees, invites, loading } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Проверка прав доступа
  if (!hasRoleLevel('sales_manager')) {
    return (
      <div className="text-center p-8">
        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Нет доступа</h3>
        <p className="text-muted-foreground">
          У вас нет прав для управления сотрудниками
        </p>
      </div>
    );
  }

  const canManageRoles = hasRole('director') || hasRole('admin');

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Сотрудники</h1>
          <p className="text-muted-foreground">
            Управление командой и правами доступа
          </p>
        </div>
        {canManageRoles && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Пригласить сотрудника
          </Button>
        )}
      </div>

      {/* Статистика */}
      <EmployeeStats employees={employees} />

      {/* Табы */}
      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Сотрудники ({employees.length})
          </TabsTrigger>
          {canManageRoles && (
            <TabsTrigger value="invites">
              <Mail className="h-4 w-4 mr-2" />
              Приглашения ({invites.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Вкладка сотрудников */}
        <TabsContent value="employees" className="space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Список сотрудников */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <EmployeeCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Сотрудники не найдены</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Вкладка приглашений */}
        {canManageRoles && (
          <TabsContent value="invites" className="space-y-4">
            {invites.length === 0 ? (
              <div className="text-center p-8">
                <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Нет активных приглашений</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {invites.map((invite) => (
                  <InviteCard key={invite.id} invite={invite} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Диалог создания приглашения */}
      {canManageRoles && (
        <CreateInviteDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
        />
      )}
    </div>
  );
};

export default Employees;
```

### 7.2. EmployeeCard.tsx

Карточка сотрудника с возможностью редактирования.

### 7.3. CreateInviteDialog.tsx

Диалог создания приглашения с выбором роли и кастомных прав.

### 7.4. CustomPermissionsForm.tsx

Форма настройки кастомных прав доступа.

---

## 8. МАТРИЦА ДОСТУПА

### 8.1. Базовые действия

| Роль | View Employees | Create Invite | Edit Role | Edit Permissions | Delete User |
|------|----------------|---------------|-----------|------------------|-------------|
| **User** | Own | ❌ | ❌ | ❌ | ❌ |
| **Observer** | All | ❌ | ❌ | ❌ | ❌ |
| **Accountant** | All | ❌ | ❌ | ❌ | ❌ |
| **Engineer** | Team | ❌ | ❌ | ❌ | ❌ |
| **Salesperson** | Team | ❌ | ❌ | ❌ | ❌ |
| **Sales Manager** | All | ❌ | ❌ | ❌ | ❌ |
| **Admin** | All | ✅ | ✅ (below Admin) | ✅ | ✅ (below Admin) |
| **Director** | All | ✅ | ✅ (All) | ✅ | ✅ (All) |

### 8.2. Матрица по секциям системы

| Section | User | Observer | Accountant | Engineer | Salesperson | Sales Manager | Admin | Director |
|---------|------|----------|------------|----------|-------------|---------------|-------|----------|
| **Products** | ❌ | View | View | ❌ | Full | Full | Full | Full |
| **Services** | ❌ | View | View | ❌ | Full | Full | Full | Full |
| **Categories** | ❌ | ❌ | ❌ | ❌ | ❌ | Full | Full | Full |
| **Manufacturers** | ❌ | ❌ | ❌ | ❌ | ❌ | Full | Full | Full |
| **Leads** | ❌ | ❌ | ❌ | ❌ | Own | Full | Full | Full |
| **Deals** | ❌ | ❌ | View | ❌ | Full | Full | Full | Full |
| **Tasks** | ❌ | ❌ | Assigned | Assigned | Assigned | Full | Full | Full |
| **Clients** | ❌ | ❌ | ❌ | ❌ | Own | Full | Full | Full |
| **Contacts** | ❌ | ❌ | ❌ | ❌ | ❌ | Full | Full | Full |
| **Analytics** | ❌ | View | View | ❌ | Own | Full | Full | Full |
| **Employees** | ❌ | ❌ | ❌ | ❌ | ❌ | View | Full | Full |
| **Settings** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Full | Full |

---

## 9. БИЗНЕС-ЛОГИКА

### 9.1. Создание первого директора

```typescript
// Специальный эндпоинт для инициализации системы
const initializeSystem = async (directorEmail: string) => {
  // Проверка что система пустая
  const { data: existingDirector } = await supabase
    .from('user_roles')
    .select('id')
    .eq('role', 'director')
    .single();

  if (existingDirector) {
    throw new Error('Система уже инициализирована');
  }

  // Создание приглашения для директора
  const { data, error } = await supabase.rpc('create_first_director', {
    director_email: directorEmail,
  });

  if (error) throw error;
  return data;
};
```

### 9.2. Регистрация по инвайту

```typescript
// 1. Валидация инвайта (публично, без auth)
const validateInvite = async (inviteId: string) => {
  const { data, error } = await supabase.rpc('validate_invite', {
    p_invite_id: inviteId,
  });

  if (error || !data || data.length === 0) {
    throw new Error('Приглашение недействительно или истекло');
  }

  return data[0];
};

// 2. Регистрация пользователя
const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;
  return data;
};

// 3. Назначение роли после регистрации
const assignRoleFromInvite = async (inviteId: string, userId: string) => {
  const { data, error } = await supabase.rpc('assign_role_from_invite', {
    p_invite_id: inviteId,
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
};

// 4. Применение кастомных прав (если есть)
const applyCustomPermissions = async (
  inviteId: string,
  userId: string,
  invite: UserInvite
) => {
  if (!invite.custom_permissions) return;

  const { error } = await supabase.rpc('apply_invite_permissions', {
    p_invite_id: inviteId,
    p_user_id: userId,
    p_full_access: invite.custom_permissions.fullAccess || [],
    p_view_only: invite.custom_permissions.viewOnly || [],
    p_is_temporary: invite.is_temporary,
    p_expires_at: invite.temporary_expires_at,
  });

  if (error) throw error;
};
```

### 9.3. Временные сотрудники - автоистечение

```sql
-- Edge Function или Cron Job для проверки истекших временных сотрудников
-- Запускать каждые 15 минут

SELECT auto_expire_temporary_employees();
```

### 9.4. Иерархия разрешений

**Принцип:** Роль выше в иерархии наследует все права ниже + дополнительные.

```typescript
const getRolePermissions = (role: AppRole): SystemSection[] => {
  const basePermissions: Record<AppRole, SystemSection[]> = {
    user: [],
    observer: ['products', 'services', 'analytics'],
    accountant: ['products', 'services', 'deals', 'tasks', 'analytics'],
    engineer: ['tasks'],
    salesperson: ['products', 'services', 'leads', 'deals', 'clients', 'tasks'],
    sales_manager: [
      'products', 'services', 'categories', 'manufacturers',
      'leads', 'deals', 'clients', 'contacts', 'tasks',
      'analytics', 'employees'
    ],
    admin: [...ALL_SECTIONS],
    director: [...ALL_SECTIONS],
  };

  return basePermissions[role] || [];
};
```

---

## 10. ВАЛИДАЦИЯ И БЕЗОПАСНОСТЬ

### 10.1. Клиентская валидация (Zod)

```typescript
import { z } from 'zod';

// Валидация email
export const emailSchema = z
  .string()
  .email('Некорректный формат email')
  .min(5, 'Email слишком короткий')
  .max(255, 'Email слишком длинный')
  .transform((val) => val.toLowerCase().trim());

// Валидация приглашения
export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum([
    'user', 'observer', 'accountant', 'engineer',
    'salesperson', 'sales_manager', 'admin', 'director'
  ]),
  isTemporary: z.boolean(),
  expiresAt: z.date().optional(),
  customPermissions: z.object({
    fullAccess: z.array(z.string()),
    viewOnly: z.array(z.string()),
  }),
}).refine(
  (data) => !data.isTemporary || data.expiresAt,
  {
    message: 'Дата истечения обязательна для временных сотрудников',
    path: ['expiresAt'],
  }
).refine(
  (data) => !data.expiresAt || data.expiresAt > new Date(),
  {
    message: 'Дата истечения должна быть в будущем',
    path: ['expiresAt'],
  }
);

// Валидация редактирования сотрудника
export const employeeEditSchema = z.object({
  full_name: z.string().min(2).max(100),
  role: z.enum([...]),
  isTemporary: z.boolean(),
  expiresAt: z.date().optional(),
  customPermissions: z.object({
    fullAccess: z.array(z.string()),
    viewOnly: z.array(z.string()),
  }),
});
```

### 10.2. Серверная безопасность

**КРИТИЧНО:**
1. ❌ **НЕ ХРАНИТЬ** роли в `profiles` или `auth.users.raw_user_meta_data`
2. ✅ **ВСЕГДА** использовать отдельную таблицу `user_roles`
3. ✅ **SECURITY DEFINER** на всех функциях проверки ролей
4. ✅ **RLS** на всех таблицах
5. ✅ **Валидация** в функциях перед выполнением действий

**Причины:**
- Защита от privilege escalation attacks
- Невозможность модификации через API
- Централизованное управление
- Audit trail через логи БД

### 10.3. Защита от атак

**SQL Injection:**
```typescript
// ❌ НЕПРАВИЛЬНО
await supabase.from('user_roles')
  .insert({ user_id: userId, role: userInput });

// ✅ ПРАВИЛЬНО - через RPC с валидацией
await supabase.rpc('assign_role_from_invite', {
  p_invite_id: inviteId,
  p_user_id: userId
});
```

**Privilege Escalation:**
```sql
-- В функции assign_role_from_invite ВСЕГДА проверяем:
1. Валидность инвайта (не использован, не истек)
2. Соответствие email пользователя и инвайта
3. Права вызывающего (для direct role assignment)
```

**Session Hijacking:**
```typescript
// Периодическая проверка валидности роли
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase.rpc('get_user_role', {
      _user_id: user.id
    });
    
    if (data !== currentRole) {
      // Роль изменилась - перезагрузить
      window.location.reload();
    }
  }, 60000); // Каждую минуту

  return () => clearInterval(interval);
}, []);
```

---

## 11. ПРОИЗВОДИТЕЛЬНОСТЬ

### 11.1. Индексирование

Все критичные запросы индексированы (см. раздел 1).

### 11.2. Кэширование

```typescript
import { useQuery } from '@tanstack/react-query';

export const useEmployeesQuery = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_employees_with_roles');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000,
  });
};
```

### 11.3. Real-time оптимизация

```typescript
// Подписка только на релевантные изменения
const channel = supabase
  .channel('my-roles')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_roles',
      filter: `user_id=eq.${user.id}` // Только свои роли
    },
    handleRoleChange
  )
  .subscribe();
```

---

## 12. КРАТКИЙ ПРОМПТ ДЛЯ AI

```
Создай систему управления сотрудниками для CRM с:

DATABASE:
- ENUM app_role: user, observer, accountant, engineer, salesperson, sales_manager, admin, director
- profiles: id, email, full_name, avatar_url (НЕ ХРАНИТ РОЛИ!)
- user_roles: user_id UNIQUE, role app_role
- user_invites: email, role, created_by, expires_at, used, custom_permissions JSONB, is_temporary
- employee_custom_permissions: user_id, section, permission_level (view_only/full_access)
- temporary_employees: user_id UNIQUE, expires_at, is_active

ФУНКЦИИ (SECURITY DEFINER):
- has_role(user_id, role) → boolean
- has_role_level(user_id, min_role) → boolean (иерархия)
- has_custom_permission(user_id, section, level) → boolean
- create_user_invite(email, role) → json
- validate_invite(invite_id) → table (публичная)
- assign_role_from_invite(invite_id, user_id) → json
- apply_invite_permissions(invite_id, user_id, full_access[], view_only[], is_temporary, expires_at)
- get_employees_with_roles() → table
- deactivate_temporary_employee(user_id)

RLS:
- user_roles: пользователи видят свою, Directors/Admins управляют
- user_invites: только Directors/Admins
- employee_custom_permissions: пользователи видят свои, Directors управляют
- temporary_employees: пользователи видят статус, Directors управляют

ТРИГГЕР:
- handle_new_user_profile() на auth.users INSERT → создает profiles

КОМПОНЕНТЫ:
- Employees.tsx: табы сотрудники/приглашения
- EmployeeCard: карточка с ролью, временным статусом, кастомными правами
- CreateInviteDialog: форма с role select, временность, кастомные права
- CustomPermissionsForm: чекбоксы full_access/view_only по секциям

HOOKS:
- useAuth: user, loading, signOut
- useUserRole: role, loading, real-time
- useUserPermissions: hasRole, hasRoleLevel, hasPermission
- useCustomPermissions: permissions, hasCustomPermission
- useEmployees: CRUD для сотрудников и инвайтов

ИЕРАРХИЯ:
user(0) < observer(1) < accountant/engineer/salesperson(2) < sales_manager(3) < admin(4) < director(5)

БЕЗОПАСНОСТЬ:
- НЕ хранить роли в profiles!
- Всегда SECURITY DEFINER для проверки ролей
- RLS на всех таблицах
- Валидация email и прав в функциях
```

---

**Конец документа**

-- ============================================================================
-- Clean schema — a normal Postgres DB for one real Express backend.
-- NO RLS, NO auth schema, NO SECURITY DEFINER permission functions.
-- Same business tables + data shape as the Supabase project; authorization
-- and business logic live in the Express app, not in the database.
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── identity ────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT,
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- one row per role a user holds (mirrors Supabase user_roles)
CREATE TABLE user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN
               ('user','observer','accountant','engineer','salesperson','sales_manager','admin','director')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE employee_custom_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section          TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view_only' CHECK (permission_level IN ('view_only','full_access')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, section)
);

CREATE TABLE temporary_employees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── catalog ─────────────────────────────────────────────────────────────────
CREATE TABLE product_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       JSONB NOT NULL,            -- {ru,en,uz}
  value      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 JSONB NOT NULL,  -- {ru,en,uz}
  description          JSONB NOT NULL,  -- {ru,en,uz}
  category             TEXT NOT NULL REFERENCES product_categories(value),
  images               JSONB DEFAULT '[]'::jsonb,
  features             JSONB,
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  in_stock             BOOLEAN NOT NULL DEFAULT true,
  price                TEXT,
  currency             TEXT DEFAULT 'USD' CHECK (currency IN ('USD','EUR','UZS')),
  country              TEXT,
  archived             BOOLEAN NOT NULL DEFAULT false,
  views_count          INTEGER NOT NULL DEFAULT 0,
  quote_requests_count INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES users(id),
  updated_by           UUID REFERENCES users(id)
);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);

-- ── CRM ─────────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  company      TEXT,
  notes        TEXT,
  last_contact TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES users(id)
);

CREATE TABLE leads (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  email              TEXT,
  phone              TEXT,
  company            TEXT,
  city               TEXT,
  position           TEXT,
  stage              TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','called','thinking','successful','lost')),
  assigned_to        UUID REFERENCES users(id),
  assigned_by        UUID REFERENCES users(id),
  source             TEXT DEFAULT 'website_form',
  value              NUMERIC(12,2),
  budget_range       TEXT,
  equipment_interest TEXT,
  timeline           TEXT,
  notes              TEXT,
  archived           BOOLEAN NOT NULL DEFAULT false,
  archived_at        TIMESTAMPTZ,
  archived_by        UUID REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ
);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_stage ON leads(stage);

CREATE TABLE lead_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('note','status_change','contact','system','field_update','assignment')),
  content    TEXT NOT NULL,
  old_value  TEXT,
  new_value  TEXT,
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);

CREATE TABLE deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount      NUMERIC(12,2),
  stage       TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','qualified','proposal','negotiation','closed','lost')),
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),
  close_date  TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES users(id)
);

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  assignee_id  UUID REFERENCES users(id),
  client_id    UUID REFERENCES clients(id) ON DELETE CASCADE,
  deal_id      UUID REFERENCES deals(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  comments     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES users(id)
);

-- ── public site ─────────────────────────────────────────────────────────────
CREATE TABLE site_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT, email TEXT, address TEXT, working_hours TEXT,
  telegram      TEXT, whatsapp TEXT, facebook TEXT, instagram TEXT, youtube TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT, email TEXT, message TEXT,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shared updated_at trigger (the one piece of DB logic worth keeping)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','product_categories','products','clients','leads','deals','tasks','site_contacts','contact_inquiries'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

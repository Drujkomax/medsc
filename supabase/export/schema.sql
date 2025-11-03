-- Supabase export for MSC Heal Hub schema (tables, views, policies, triggers)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'called', 'thinking', 'successful', 'lost')),
  assigned_to UUID REFERENCES public.user_roles(user_id),
  source TEXT,
  value DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all leads" 
ON public.leads 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all lead notes" 
ON public.lead_notes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_leads_stage ON public.leads(stage);

CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);

CREATE INDEX idx_leads_created_at ON public.leads(created_at);

CREATE INDEX idx_lead_notes_lead_id ON public.lead_notes(lead_id);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name JSONB NOT NULL, -- {ru: "", en: "", uz: ""}
  description JSONB NOT NULL, -- {ru: "", en: "", uz: ""}
  category TEXT NOT NULL,
  image TEXT,
  features JSONB, -- {ru: [], en: [], uz: []}
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all products" 
ON public.products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE product_category AS ENUM (
  'diagnostic',
  'surgical', 
  'monitoring',
  'laboratory',
  'rehabilitation',
  'dental',
  'ophthalmology',
  'furniture'
);

ALTER TABLE public.products 
ADD CONSTRAINT valid_category 
CHECK (category IN ('diagnostic', 'surgical', 'monitoring', 'laboratory', 'rehabilitation', 'dental', 'ophthalmology', 'furniture'));

CREATE POLICY "Allow anonymous users to submit leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  source = 'website_form' AND 
  stage = 'new'
);

CREATE POLICY "Allow users to view leads" 
ON public.leads 
FOR SELECT 
USING (true);

ALTER TABLE public.products 
ADD COLUMN country TEXT;

DROP POLICY IF EXISTS "Allow users to view leads" ON public.leads;

CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view assigned leads" 
ON public.leads 
FOR SELECT 
TO authenticated
USING (assigned_to = auth.uid());

ALTER TYPE app_role ADD VALUE 'director';

ALTER TYPE app_role ADD VALUE 'sales_manager';

ALTER TYPE app_role ADD VALUE 'salesperson';

CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leads ADD COLUMN assigned_by uuid;

DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;

DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

DROP POLICY IF EXISTS "Users can view assigned leads" ON public.leads;

CREATE POLICY "Directors and admins can manage all leads" 
ON public.leads 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "Salespersons can view assigned leads" 
ON public.leads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'salesperson'::app_role) AND assigned_to = auth.uid()
);

CREATE POLICY "Salespersons can update assigned leads" 
ON public.leads 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'salesperson'::app_role) AND assigned_to = auth.uid()
);

CREATE POLICY "Directors can view all activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "Users can create their own activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

CREATE POLICY "Directors can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'director'::app_role));

CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);

CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

CREATE INDEX idx_leads_assigned_by ON public.leads(assigned_by);

CREATE TRIGGER log_leads_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

CREATE TRIGGER log_user_roles_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_user_activity();

DROP POLICY IF EXISTS "Directors and admins can manage all leads" ON public.leads;

DROP POLICY IF EXISTS "Allow anonymous users to submit leads" ON public.leads;

CREATE POLICY "Directors and sales managers can manage all leads" 
ON public.leads 
FOR ALL 
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Allow anonymous users to submit leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  (source = 'website_form'::text) AND (stage = 'new'::text)
);

DROP POLICY IF EXISTS "Directors can manage all roles" ON public.user_roles;

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_by ON public.leads(assigned_by);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

CREATE INDEX IF NOT EXISTS idx_leads_archived ON public.leads(archived);

CREATE INDEX IF NOT EXISTS idx_leads_name_phone ON public.leads(name, phone);

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  used BOOLEAN DEFAULT false
);

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors and admins can manage invites" ON public.user_invites
FOR ALL USING (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'admin'));



CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_contact TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed', 'lost')),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  close_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team's clients" ON public.clients
  FOR SELECT USING (
    has_role_level(auth.uid(), 'salesperson')
  );

CREATE POLICY "Users can create clients" ON public.clients
  FOR INSERT WITH CHECK (
    has_role_level(auth.uid(), 'salesperson') AND auth.uid() = created_by
  );

CREATE POLICY "Users can update their team's clients" ON public.clients
  FOR UPDATE USING (
    has_role_level(auth.uid(), 'salesperson')
  );

CREATE POLICY "Admins can delete clients" ON public.clients
  FOR DELETE USING (
    has_role_level(auth.uid(), 'admin')
  );

CREATE POLICY "Users can view their team's deals" ON public.deals
  FOR SELECT USING (
    has_role_level(auth.uid(), 'salesperson')
  );

CREATE POLICY "Users can create deals" ON public.deals
  FOR INSERT WITH CHECK (
    has_role_level(auth.uid(), 'salesperson') AND auth.uid() = created_by
  );

CREATE POLICY "Users can update their team's deals" ON public.deals
  FOR UPDATE USING (
    has_role_level(auth.uid(), 'salesperson')
  );

CREATE POLICY "Admins can delete deals" ON public.deals
  FOR DELETE USING (
    has_role_level(auth.uid(), 'admin')
  );

CREATE POLICY "Users can view their assigned tasks" ON public.tasks
  FOR SELECT USING (
    assignee_id = auth.uid() OR has_role_level(auth.uid(), 'sales_manager')
  );

CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    has_role_level(auth.uid(), 'salesperson') AND auth.uid() = created_by
  );

CREATE POLICY "Users can update their tasks" ON public.tasks
  FOR UPDATE USING (
    assignee_id = auth.uid() OR has_role_level(auth.uid(), 'sales_manager')
  );

CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE USING (
    has_role_level(auth.uid(), 'admin')
  );

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Allow anonymous lead submissions from website"
ON public.leads
FOR INSERT
WITH CHECK (
  (auth.role() = 'anon' AND source = 'website_form' AND stage = 'new')
  OR
  (auth.uid() IS NOT NULL)
);

ALTER TABLE public.leads 
ALTER COLUMN source SET DEFAULT 'website_form';

ALTER TABLE public.products 
ADD COLUMN price DECIMAL(10,2) CHECK (price >= 0);

CREATE INDEX idx_products_price ON public.products(price);

COMMENT ON COLUMN public.products.price IS 'Product price in USD';

ALTER TABLE public.products 
ALTER COLUMN price TYPE text;

COMMENT ON COLUMN public.products.price IS 'Product price - can be a single value or range (e.g., "24.000-88.000 EURO", "5000 USD")';

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_price_check;

ALTER TABLE public.products 
ALTER COLUMN price TYPE text USING price::text;

ALTER TABLE public.products 
ADD COLUMN currency text DEFAULT 'USD';

COMMENT ON COLUMN public.products.currency IS 'Product price currency (USD, EUR)';

CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name jsonb NOT NULL, -- {ru: string, en: string, uz: string}
  value text NOT NULL UNIQUE, -- slug/key for the category
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
ON public.product_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.product_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_currency_check;

ALTER TABLE public.products 
ADD CONSTRAINT products_currency_check 
CHECK (currency IN ('USD', 'EUR', 'UZS'));

COMMENT ON COLUMN public.products.currency IS 'Product price currency (USD, EUR, UZS)';

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE NOT VALID;

DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;

CREATE POLICY "Admins and directors can manage categories" 
ON public.product_categories 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'director'::app_role)
);

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

CREATE POLICY "Admins and directors can manage all products" 
ON public.products 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'director'::app_role)
);

DROP POLICY IF EXISTS "Admins and directors can manage categories" ON public.product_categories;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.product_categories;

CREATE POLICY "Managers can manage categories" 
ON public.product_categories 
FOR ALL 
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'sales_manager'::app_role)
);

CREATE POLICY "Categories are viewable by authenticated users" 
ON public.product_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and directors can manage all products" ON public.products;

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "Managers can manage products" 
ON public.products 
FOR ALL 
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'sales_manager'::app_role)
);

ALTER TABLE public.products 
ADD COLUMN archived boolean DEFAULT false,
ADD COLUMN archived_at timestamp with time zone,
ADD COLUMN archived_by uuid;

ALTER TABLE public.products 
ADD COLUMN views_count integer DEFAULT 0,
ADD COLUMN quote_requests_count integer DEFAULT 0;

CREATE INDEX idx_products_views_count ON public.products(views_count);

CREATE INDEX idx_products_quote_requests_count ON public.products(quote_requests_count);



ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS revenue_attributed DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS competitor_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.employee_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'product_edit', 'lead_update', etc.
  entity_type TEXT, -- 'product', 'lead', 'deal', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  session_duration INTEGER, -- in minutes for logout events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

CREATE INDEX IF NOT EXISTS idx_employee_activity_user_date ON public.employee_activity(user_id, date);

CREATE INDEX IF NOT EXISTS idx_employee_activity_action_date ON public.employee_activity(action_type, date);

CREATE INDEX IF NOT EXISTS idx_employee_activity_entity ON public.employee_activity(entity_type, entity_id);

ALTER TABLE public.employee_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own activity logs" ON public.employee_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Directors and admins can view all activity logs" ON public.employee_activity
  FOR SELECT USING (
    has_role(auth.uid(), 'director'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sales managers can view their team activity" ON public.employee_activity
  FOR SELECT USING (
    has_role(auth.uid(), 'sales_manager'::app_role) OR
    has_role(auth.uid(), 'director'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TABLE IF NOT EXISTS public.conversion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count INTEGER DEFAULT 0,
  quote_requests_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN views_count > 0 THEN quote_requests_count::decimal / views_count::decimal
      ELSE 0.0000
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, date)
);

ALTER TABLE public.conversion_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversion analytics viewable by managers" ON public.conversion_analytics
  FOR SELECT USING (
    has_role_level(auth.uid(), 'sales_manager'::app_role)
  );

CREATE POLICY "Conversion analytics manageable by managers" ON public.conversion_analytics
  FOR ALL USING (
    has_role_level(auth.uid(), 'sales_manager'::app_role)
  );

CREATE TRIGGER update_conversion_analytics_updated_at
  BEFORE UPDATE ON public.conversion_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.employee_activity 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

CREATE POLICY "Products viewable by authenticated users and website visitors"
ON public.products
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  OR
  (auth.role() = 'anon' AND status = 'active' AND NOT archived)
);

CREATE POLICY "Public product catalog access"
ON public.products
FOR SELECT
USING (
  auth.role() = 'anon' 
  AND status = 'active' 
  AND NOT archived
);

CREATE OR REPLACE VIEW public.public_products AS
SELECT 
  id,
  name,
  description,
  category,
  images,
  features,
  in_stock,
  created_at,
  country
FROM public.products
WHERE status = 'active' AND NOT archived;

ALTER VIEW public.public_products OWNER TO postgres;

CREATE POLICY "Public products view access"
ON public.products
FOR SELECT
USING (
  auth.role() = 'anon' 
  AND status = 'active' 
  AND NOT archived
);

DROP VIEW IF EXISTS public.public_products;

DROP POLICY IF EXISTS "Public product catalog access" ON public.products;

DROP POLICY IF EXISTS "Public products view access" ON public.products;

CREATE POLICY "Anonymous users see basic product info"
ON public.products
FOR SELECT
USING (
  auth.role() = 'anon' 
  AND status = 'active' 
  AND NOT archived
);

CREATE POLICY "Authenticated users see all products"
ON public.products
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Products viewable by authenticated users and website visitors" ON public.products;

DROP POLICY IF EXISTS "Anonymous users see basic product info" ON public.products;

DROP POLICY IF EXISTS "Authenticated users see all products" ON public.products;

CREATE POLICY "Anonymous product access"
ON public.products
FOR SELECT
USING (
  auth.role() = 'anon' 
  AND status = 'active' 
  AND NOT archived
);

CREATE POLICY "Authenticated product access"
ON public.products
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anonymous product access" ON public.products;

DROP POLICY IF EXISTS "Authenticated product access" ON public.products;

CREATE POLICY "Public catalog access"
ON public.products
FOR SELECT
USING (status = 'active' AND NOT archived);

ALTER TABLE public.products DROP CONSTRAINT valid_category;


ALTER TABLE public.products 
ADD CONSTRAINT valid_category_dynamic 
CHECK (validate_product_category(category));

DROP POLICY IF EXISTS "Salespersons can view assigned leads" ON public.leads;

CREATE POLICY "Salespersons can view only their assigned leads" 
ON public.leads 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND
  (
    (has_role(auth.uid(), 'salesperson'::app_role) AND assigned_to = auth.uid())
    OR
    has_role_level(auth.uid(), 'sales_manager'::app_role)
  )
);

CREATE POLICY "Block anonymous lead access" 
ON public.leads 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
);

CREATE TABLE IF NOT EXISTS public.director_setup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone NULL
);

ALTER TABLE public.director_setup_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System only access to setup tokens" 
ON public.director_setup_tokens 
FOR ALL 
USING (false);

CREATE OR REPLACE VIEW public.public_products AS
SELECT 
  id,
  name,
  description,
  category,
  in_stock,
  images,
  views_count,
  created_at,
  updated_at,
  country,
  status
FROM public.products
WHERE status = 'active' AND NOT archived;

ALTER VIEW public.public_products SET (security_barrier = true);

CREATE POLICY "Public catalog with limited data" 
ON public.public_products 
FOR SELECT 
USING (true);

CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info', -- error, warn, info, debug
  category TEXT NOT NULL, -- auth, api, business, performance, security
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  url TEXT,
  stack_trace TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_logs_level ON public.system_logs(level);

CREATE INDEX idx_system_logs_category ON public.system_logs(category);

CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at);

CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);

CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- critical_error, performance_issue, security_breach, high_activity
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'active', -- active, acknowledged, resolved
  details JSONB DEFAULT '{}',
  triggered_by_log_id UUID REFERENCES public.system_logs(id),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_alerts_status ON public.system_alerts(status);

CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);

CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors and admins can view all logs" 
ON public.system_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs" 
ON public.system_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Directors and admins can manage alerts" 
ON public.system_alerts 
FOR ALL 
USING (has_role(auth.uid(), 'director') OR has_role(auth.uid(), 'admin'));

CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'status_change', 'contact', 'system', 'field_update', 'assignment')),
  content TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);

CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

CREATE INDEX idx_lead_activities_type ON public.lead_activities(type);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead activities they have access to" 
ON public.lead_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND (
      has_role_level(auth.uid(), 'sales_manager'::app_role) OR
      (has_role(auth.uid(), 'salesperson'::app_role) AND l.assigned_to = auth.uid())
    )
  )
);

CREATE POLICY "Users can create activities for their leads" 
ON public.lead_activities 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND (
      has_role_level(auth.uid(), 'sales_manager'::app_role) OR
      (has_role(auth.uid(), 'salesperson'::app_role) AND l.assigned_to = auth.uid())
    )
  )
  AND auth.uid() = created_by
);

CREATE TRIGGER lead_changes_log_trigger
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lead_changes();

ALTER TABLE public.leads ADD COLUMN budget_range text;

ALTER TABLE public.leads ADD COLUMN position text;

ALTER TABLE public.leads ADD COLUMN equipment_interest text;

ALTER TABLE public.leads ADD COLUMN timeline text;

ALTER TABLE public.leads ADD COLUMN qualification_date timestamp with time zone;

ALTER TABLE public.leads ADD COLUMN qualified_by uuid;

COMMENT ON COLUMN public.leads.budget_range IS 'Диапазон бюджета (например: "до $10K", "$10K-50K", "свыше $100K")';

COMMENT ON COLUMN public.leads.position IS 'Должность/позиция контакта';

COMMENT ON COLUMN public.leads.equipment_interest IS 'Тип интересующего оборудования';

COMMENT ON COLUMN public.leads.timeline IS 'Сроки реализации интереса';

COMMENT ON COLUMN public.leads.qualification_date IS 'Дата квалификации лида';

COMMENT ON COLUMN public.leads.qualified_by IS 'Кто провел квалификацию';

DROP POLICY IF EXISTS "Allow anonymous lead submissions from website" ON public.leads;

CREATE POLICY "Allow website lead submissions" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  (auth.role() = 'anon' AND source = 'website_form' AND stage = 'new') OR
  (auth.uid() IS NOT NULL)
);

DROP POLICY IF EXISTS "Block anonymous lead access" ON public.leads;

DROP POLICY IF EXISTS "Allow website lead submissions" ON public.leads;

CREATE POLICY "Allow website lead submissions with read access" 
ON public.leads 
FOR ALL
USING (
  (auth.uid() IS NOT NULL) OR 
  (source = 'website_form' AND stage = 'new')
)
WITH CHECK (
  (auth.uid() IS NOT NULL) OR 
  (source = 'website_form' AND stage = 'new')
);

DROP POLICY IF EXISTS "Allow website lead submissions with read access" ON public.leads;

CREATE POLICY "Allow website form submissions only" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NULL) AND 
  (source = 'website_form') AND 
  (stage = 'new')
);

WITH new_user AS (
  SELECT id FROM auth.users WHERE email = 'makhsud@medsc.uz'
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'salesperson'::app_role FROM new_user;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_profile();

CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage categories" 
ON public.categories 
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE POLICY IF NOT EXISTS "Salespersons can create their own leads"
ON public.leads
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'salesperson')
  AND assigned_to = auth.uid()
  AND source <> 'website_form'
);

CREATE POLICY "Salespersons can create their own leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'salesperson'::app_role)
  AND assigned_to = auth.uid()
  AND source <> 'website_form'
);

ALTER TABLE public.leads ADD COLUMN city text;

DROP POLICY IF EXISTS "Users can view their team's clients" ON public.clients;

DROP POLICY IF EXISTS "Users can create clients" ON public.clients;

DROP POLICY IF EXISTS "Users can update their team's clients" ON public.clients;

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

CREATE POLICY "Users can view only their own clients"
ON public.clients FOR SELECT 
USING (
  created_by = auth.uid() OR 
  has_role_level(auth.uid(), 'sales_manager'::app_role)
);

CREATE POLICY "Users can create their own clients"
ON public.clients FOR INSERT 
WITH CHECK (
  has_role_level(auth.uid(), 'salesperson'::app_role) AND 
  created_by = auth.uid()
);

CREATE POLICY "Users can update only their own clients"
ON public.clients FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  has_role_level(auth.uid(), 'sales_manager'::app_role)
);

CREATE POLICY "Admins and directors can delete clients"
ON public.clients FOR DELETE 
USING (
  has_role_level(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Restrict profile access to authorized users"
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id OR 
  has_role_level(auth.uid(), 'salesperson'::app_role)
);

COMMENT ON POLICY "Restrict profile access to authorized users" ON public.profiles IS 
'Allows users to see their own profile and authorized sales staff to see employee profiles for CRM functionality';

CREATE TABLE public.site_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT,
  email TEXT,
  address TEXT,
  working_hours TEXT,
  telegram TEXT,
  whatsapp TEXT,
  facebook TEXT,
  instagram TEXT,
  youtube TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site contacts" 
ON public.site_contacts 
FOR ALL 
USING (has_role_level(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_contacts_updated_at
BEFORE UPDATE ON public.site_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous contact form submissions" ON public.contact_inquiries;

DROP POLICY IF EXISTS "Admins can view all contact inquiries" ON public.contact_inquiries;

DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;

CREATE POLICY "Allow anonymous contact form submissions" 
ON public.contact_inquiries 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Admins can view all contact inquiries" 
ON public.contact_inquiries 
FOR SELECT 
USING (has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
USING (has_role_level(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_contact_inquiries_updated_at ON public.contact_inquiries;

CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_inquiries_updated_at();

DROP POLICY IF EXISTS "Restrict profile access to authorized users" ON public.profiles;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view employee profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = id OR 
    has_role_level(auth.uid(), 'salesperson'::app_role)
  )
);

DROP POLICY IF EXISTS "Admins can manage site contacts" ON public.site_contacts;

CREATE POLICY "Public can view site contacts" 
ON public.site_contacts 
FOR SELECT 
USING (true);

ALTER TABLE public.tasks 
ADD COLUMN recurrence_type text DEFAULT 'none' CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN recurrence_interval integer DEFAULT 1 CHECK (recurrence_interval > 0),
ADD COLUMN recurrence_end_date timestamp with time zone,
ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

ALTER TYPE public.app_role ADD VALUE 'accountant';

ALTER TYPE public.app_role ADD VALUE 'engineer';

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;

DROP POLICY IF EXISTS "Users can view their assigned tasks" ON public.tasks;

CREATE POLICY "Only directors and managers can create tasks" ON public.tasks
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role)
);

CREATE POLICY "Task update permissions" ON public.tasks
FOR UPDATE USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  (
    (has_role(auth.uid(), 'salesperson'::app_role) OR 
     has_role(auth.uid(), 'accountant'::app_role) OR 
     has_role(auth.uid(), 'engineer'::app_role)) AND 
    assignee_id = auth.uid()
  )
);

CREATE POLICY "All employees can view tasks" ON public.tasks
FOR SELECT USING (
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'salesperson'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role) OR
  has_role(auth.uid(), 'engineer'::app_role) OR
  assignee_id = auth.uid()
);

DROP POLICY IF EXISTS "Only directors and managers can create tasks" ON public.tasks;

DROP POLICY IF EXISTS "Task update permissions" ON public.tasks;

DROP POLICY IF EXISTS "All employees can view tasks" ON public.tasks;

DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

CREATE POLICY "Only directors and managers can create tasks" ON public.tasks
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Task update permissions" ON public.tasks
FOR UPDATE USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  (
    (has_role(auth.uid(), 'salesperson'::app_role) OR 
     has_role(auth.uid(), 'accountant'::app_role) OR 
     has_role(auth.uid(), 'engineer'::app_role)) AND 
    assignee_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete tasks" ON public.tasks
FOR DELETE USING (
  has_role(auth.uid(), 'director'::app_role) OR
  has_role(auth.uid(), 'sales_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'accountant' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'accountant';

ALTER TABLE public.tasks ADD COLUMN comments TEXT;

CREATE POLICY "Managers can update tasks"
ON public.tasks
FOR UPDATE
USING (
  has_role(auth.uid(), 'director'::app_role)
  OR has_role(auth.uid(), 'sales_manager'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (true);

CREATE POLICY "Assignee can update own tasks"
ON public.tasks
FOR UPDATE
USING (
  (
    has_role(auth.uid(), 'salesperson'::app_role)
    OR has_role(auth.uid(), 'accountant'::app_role)
    OR has_role(auth.uid(), 'engineer'::app_role)
  )
  AND (assignee_id = auth.uid())
)
WITH CHECK (assignee_id = auth.uid());

CREATE POLICY "Employees can mark tasks completed"
ON public.tasks
FOR UPDATE
USING (
  has_role(auth.uid(), 'salesperson'::app_role)
  OR has_role(auth.uid(), 'accountant'::app_role)
  OR has_role(auth.uid(), 'engineer'::app_role)
)
WITH CHECK (status = 'completed');

CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title JSONB NOT NULL,
  description JSONB NOT NULL,
  category TEXT NOT NULL,
  price TEXT,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '{"cover": null, "gallery": []}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_services_status ON public.services(status);

CREATE INDEX idx_services_category ON public.services(category);

CREATE INDEX idx_services_created_at ON public.services(created_at);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services" 
ON public.services 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Managers can manage all services" 
ON public.services 
FOR ALL 
USING (has_role_level(auth.uid(), 'sales_manager'::app_role));

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name JSONB NOT NULL,
  value TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view service categories" 
ON public.service_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Managers can manage service categories" 
ON public.service_categories 
FOR ALL 
USING (has_role_level(auth.uid(), 'sales_manager'::app_role));

CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.deals 
ADD COLUMN deal_type TEXT CHECK (deal_type IN ('product', 'service')),
ADD COLUMN product_id UUID REFERENCES public.products(id),
ADD COLUMN service_id UUID REFERENCES public.services(id);

ALTER TABLE public.deals 
ADD CONSTRAINT deals_product_or_service_check 
CHECK (
  (deal_type = 'product' AND product_id IS NOT NULL AND service_id IS NULL) OR
  (deal_type = 'service' AND service_id IS NOT NULL AND product_id IS NULL) OR
  (deal_type IS NULL AND product_id IS NULL AND service_id IS NULL)
);

CREATE INDEX idx_deals_product_id ON public.deals(product_id);

CREATE INDEX idx_deals_service_id ON public.deals(service_id);

CREATE INDEX idx_deals_deal_type ON public.deals(deal_type);

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_client_id_fkey;

ALTER TABLE public.deals RENAME COLUMN client_id TO lead_id;

ALTER TABLE public.deals 
ADD CONSTRAINT deals_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE TABLE public.deal_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deal_id, product_id)
);

CREATE TABLE public.deal_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_price, 0)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(deal_id, service_id)
);

ALTER TABLE public.deal_products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deal_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deal products" 
ON public.deal_products 
FOR SELECT 
USING (has_role_level(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Users can create deal products" 
ON public.deal_products 
FOR INSERT 
WITH CHECK (has_role_level(auth.uid(), 'salesperson'::app_role));

CREATE POLICY "Users can update deal products" 
ON public.deal_products 
FOR UPDATE 
USING (has_role_level(auth.uid(), 'salesperson'::app_role));

CREATE POLICY "Admins can delete deal products" 
ON public.deal_products 
FOR DELETE 
USING (has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view deal services" 
ON public.deal_services 
FOR SELECT 
USING (has_role_level(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Users can create deal services" 
ON public.deal_services 
FOR INSERT 
WITH CHECK (has_role_level(auth.uid(), 'salesperson'::app_role));

CREATE POLICY "Users can update deal services" 
ON public.deal_services 
FOR UPDATE 
USING (has_role_level(auth.uid(), 'salesperson'::app_role));

CREATE POLICY "Admins can delete deal services" 
ON public.deal_services 
FOR DELETE 
USING (has_role_level(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_deal_products_updated_at
  BEFORE UPDATE ON public.deal_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_services_updated_at
  BEFORE UPDATE ON public.deal_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deal_products_deal_id ON public.deal_products(deal_id);

CREATE INDEX idx_deal_products_product_id ON public.deal_products(product_id);

CREATE INDEX idx_deal_services_deal_id ON public.deal_services(deal_id);

CREATE INDEX idx_deal_services_service_id ON public.deal_services(service_id);

ALTER TABLE public.deals
DROP CONSTRAINT IF EXISTS deals_product_or_service_check;

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_deal_type_check;

ALTER TABLE public.deals ADD CONSTRAINT deals_deal_type_check 
CHECK (deal_type IN ('product', 'service', 'both') OR deal_type IS NULL);

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS assigned_engineer uuid,
ADD COLUMN IF NOT EXISTS assigned_accountant uuid,
ADD COLUMN IF NOT EXISTS assigned_salesperson uuid;

ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'waiting' CHECK (payment_status IN ('waiting', 'paid', 'not_realized', 'debt')),
ADD COLUMN IF NOT EXISTS debt_amount numeric;

COMMENT ON COLUMN public.deals.payment_status IS 'Статус оплаты: waiting (Ожидание), paid (Оплачено), not_realized (Не реализовано), debt (Задолженность)';

COMMENT ON COLUMN public.deals.debt_amount IS 'Сумма задолженности (заполняется только когда payment_status = debt)';

CREATE TABLE public.employee_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('full_access', 'view_only', 'no_access')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, section)
);

CREATE TABLE public.temporary_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.employee_custom_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can manage custom permissions"
ON public.employee_custom_permissions
FOR ALL
USING (has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "Users can view their own permissions"
ON public.employee_custom_permissions
FOR SELECT
USING (auth.uid() = user_id);

ALTER TABLE public.temporary_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors can manage temporary employees"
ON public.temporary_employees
FOR ALL
USING (has_role(auth.uid(), 'director'::app_role));

CREATE POLICY "Users can view their own temporary status"
ON public.temporary_employees
FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_employee_custom_permissions_updated_at
BEFORE UPDATE ON public.employee_custom_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_employee_custom_permissions_user_id ON public.employee_custom_permissions(user_id);

CREATE INDEX idx_employee_custom_permissions_section ON public.employee_custom_permissions(section);

CREATE INDEX idx_temporary_employees_user_id ON public.temporary_employees(user_id);

CREATE INDEX idx_temporary_employees_expires_at ON public.temporary_employees(expires_at);

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'observer' 
    AND enumtypid = 'app_role'::regtype
  ) THEN
    EXECUTE 'ALTER TYPE app_role ADD VALUE ''observer''';

ALTER TABLE public.tasks 
ADD COLUMN assignee_ids uuid[] DEFAULT '{}';

DROP POLICY IF EXISTS "Assignee can update own tasks" ON public.tasks;

CREATE POLICY "All employees can view tasks" 
ON public.tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'salesperson'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role(auth.uid(), 'engineer'::app_role) OR 
  assignee_id = auth.uid() OR
  auth.uid() = ANY(assignee_ids)
);

CREATE POLICY "Assignee can update own tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  (has_role(auth.uid(), 'salesperson'::app_role) OR 
   has_role(auth.uid(), 'accountant'::app_role) OR 
   has_role(auth.uid(), 'engineer'::app_role)) AND 
  (assignee_id = auth.uid() OR auth.uid() = ANY(assignee_ids))
)
WITH CHECK (
  assignee_id = auth.uid() OR auth.uid() = ANY(assignee_ids)
);

CREATE POLICY "Observers can view product drafts"
ON public.products
FOR SELECT
USING (
  public.has_role(auth.uid(), 'observer')
  AND status = 'draft'
);

CREATE POLICY "Observers can view archived products"
ON public.products
FOR SELECT
USING (
  public.has_role(auth.uid(), 'observer')
  AND archived = true
);

CREATE POLICY "Observers can view all products"
ON public.products
FOR SELECT
USING (
  public.has_role(auth.uid(), 'observer'::app_role)
);

DROP POLICY IF EXISTS "Observers can view product drafts" ON public.products;

DROP POLICY IF EXISTS "Observers can view archived products" ON public.products;

CREATE POLICY "Accountants can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Accountants can view all employee profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

DROP POLICY IF EXISTS "Users can create deals" ON public.deals;

CREATE POLICY "Users can create deals"
ON public.deals
FOR INSERT
WITH CHECK (
  (has_role_level(auth.uid(), 'salesperson'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
  AND auth.uid() = created_by
);

CREATE TABLE IF NOT EXISTS public.deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accountants and managers can view deal documents"
ON public.deal_documents
FOR SELECT
USING (
  has_role(auth.uid(), 'accountant'::app_role) 
  OR has_role_level(auth.uid(), 'sales_manager'::app_role)
);

CREATE POLICY "Accountants can upload deal documents"
ON public.deal_documents
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'accountant'::app_role)
  AND auth.uid() = uploaded_by
);

CREATE POLICY "Accountants can delete their deal documents"
ON public.deal_documents
FOR DELETE
USING (
  has_role(auth.uid(), 'accountant'::app_role)
  AND auth.uid() = uploaded_by
);

CREATE TRIGGER update_deal_documents_updated_at
BEFORE UPDATE ON public.deal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.deal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted', 'stage_changed', 'payment_status_changed', 'assigned')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_email TEXT,
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accountants and managers can view audit log"
ON public.deal_audit_log
FOR SELECT
USING (
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role_level(auth.uid(), 'sales_manager'::app_role)
);

CREATE POLICY "System can insert audit logs"
ON public.deal_audit_log
FOR INSERT
WITH CHECK (true);

DROP TRIGGER IF EXISTS deal_audit_trigger ON public.deals;

CREATE TRIGGER deal_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.log_deal_changes();

CREATE INDEX IF NOT EXISTS idx_deal_audit_log_deal_id ON public.deal_audit_log(deal_id);

CREATE INDEX IF NOT EXISTS idx_deal_audit_log_created_at ON public.deal_audit_log(created_at DESC);

DROP POLICY IF EXISTS "Users can update their team's deals" ON public.deals;

CREATE POLICY "Users can update their team's deals"
ON public.deals
FOR UPDATE
USING (
  has_role_level(auth.uid(), 'salesperson'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role)
)
WITH CHECK (
  has_role_level(auth.uid(), 'salesperson'::app_role) OR
  has_role(auth.uid(), 'accountant'::app_role)
);

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS name_length,
  DROP CONSTRAINT IF EXISTS phone_length,
  DROP CONSTRAINT IF EXISTS company_length,
  DROP CONSTRAINT IF EXISTS notes_length;

ALTER TABLE public.leads
  ADD CONSTRAINT name_length CHECK (length(name) <= 100),
  ADD CONSTRAINT phone_length CHECK (length(phone) <= 20),
  ADD CONSTRAINT company_length CHECK (length(company) <= 200),
  ADD CONSTRAINT notes_length CHECK (length(notes) <= 1000);

ALTER TABLE public.products 
ADD COLUMN manufacturer_name text,
ADD COLUMN icon_url text;

CREATE TABLE public.manufacturers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name JSONB NOT NULL,
  country_code TEXT NOT NULL,
  logo_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manufacturers are publicly viewable"
ON public.manufacturers
FOR SELECT
USING (true);

CREATE POLICY "Managers can manage manufacturers"
ON public.manufacturers
FOR ALL
USING (
  has_role(auth.uid(), 'director'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sales_manager'::app_role)
);

CREATE TRIGGER update_manufacturers_updated_at
BEFORE UPDATE ON public.manufacturers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products
ADD COLUMN manufacturer_id UUID REFERENCES public.manufacturers(id) ON DELETE SET NULL;

CREATE INDEX idx_products_manufacturer_id ON public.products(manufacturer_id);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_quality TEXT CHECK (lead_quality IN ('A', 'B', 'C'));

COMMENT ON COLUMN public.leads.lead_quality IS 'Качество лида: A - целевой, B - потенциальный, C - мусор';

ALTER TABLE public.manufacturers 
ADD COLUMN legal_name TEXT;

COMMENT ON COLUMN public.manufacturers.legal_name IS 'Юридическое наименование производителя';

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS valid_category_dynamic;

DROP TRIGGER IF EXISTS trg_validate_product_category ON public.products;

CREATE TRIGGER trg_validate_product_category
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_category_change();

ALTER TABLE public.leads 
ADD COLUMN lead_created_date timestamp with time zone;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can read notification templates"
ON public.notification_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'director'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'director'::app_role)
);
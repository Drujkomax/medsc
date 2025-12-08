-- Create warehouse activity logs table
CREATE TABLE public.warehouse_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_item_id uuid REFERENCES public.warehouse_items(id) ON DELETE SET NULL,
  item_name jsonb NOT NULL,
  action_type text NOT NULL, -- 'added', 'updated', 'deleted', 'archived'
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  changes jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouse_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Managers can view warehouse logs" 
ON public.warehouse_activity_logs 
FOR SELECT 
USING (has_role_level(auth.uid(), 'salesperson'::app_role));

CREATE POLICY "System can insert warehouse logs" 
ON public.warehouse_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_warehouse_logs_item ON public.warehouse_activity_logs(warehouse_item_id);
CREATE INDEX idx_warehouse_logs_created ON public.warehouse_activity_logs(created_at DESC);
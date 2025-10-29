-- Enable RLS on notification_templates table
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (system/edge functions) to read templates
CREATE POLICY "System can read notification templates"
ON public.notification_templates
FOR SELECT
TO authenticated
USING (true);

-- Allow admins and directors to manage templates
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
-- Create contacts configuration table
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

-- Enable RLS
ALTER TABLE public.site_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contact management
CREATE POLICY "Admins can manage site contacts" 
ON public.site_contacts 
FOR ALL 
USING (has_role_level(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_site_contacts_updated_at
BEFORE UPDATE ON public.site_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact data
INSERT INTO public.site_contacts (phone, email, address, working_hours, telegram, whatsapp, facebook, instagram, youtube)
VALUES (
  '+998 90 123 45 67',
  'info@msc-uzbekistan.com', 
  'Ташкент, Узбекистан',
  'Пн-Пт: 9:00-18:00',
  '@msc_uzbekistan',
  '+998901234567',
  'MSC Uzbekistan',
  '@msc_uzbekistan',
  'MSC Uzbekistan Channel'
);
-- Add fields to deals table for linking to products or services
ALTER TABLE public.deals 
ADD COLUMN deal_type TEXT CHECK (deal_type IN ('product', 'service')),
ADD COLUMN product_id UUID REFERENCES public.products(id),
ADD COLUMN service_id UUID REFERENCES public.services(id);

-- Add constraint to ensure only one of product_id or service_id is set
ALTER TABLE public.deals 
ADD CONSTRAINT deals_product_or_service_check 
CHECK (
  (deal_type = 'product' AND product_id IS NOT NULL AND service_id IS NULL) OR
  (deal_type = 'service' AND service_id IS NOT NULL AND product_id IS NULL) OR
  (deal_type IS NULL AND product_id IS NULL AND service_id IS NULL)
);

-- Create indexes for better performance
CREATE INDEX idx_deals_product_id ON public.deals(product_id);
CREATE INDEX idx_deals_service_id ON public.deals(service_id);
CREATE INDEX idx_deals_deal_type ON public.deals(deal_type);
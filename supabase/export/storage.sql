-- Supabase export for MSC Heal Hub storage buckets and policies
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Accountants and managers can view deal documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deal-documents'
  AND (
    has_role(auth.uid(), 'accountant'::app_role)
    OR has_role_level(auth.uid(), 'sales_manager'::app_role)
  )
);

CREATE POLICY "Accountants can upload deal documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents'
  AND has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Accountants can delete their deal documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'deal-documents'
  AND has_role(auth.uid(), 'accountant'::app_role)
);


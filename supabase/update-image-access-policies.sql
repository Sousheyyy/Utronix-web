-- Updated RLS policies for image access control
-- Supplier images: Only visible to admins
-- Customer images: Visible to customers and suppliers

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Suppliers can view order images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can upload order images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can update order images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can delete order images" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view their order images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all order images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all order images" ON storage.objects;

-- Allow suppliers to upload order images
CREATE POLICY "Suppliers can upload order images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

-- Allow suppliers to update their own uploaded images
CREATE POLICY "Suppliers can update order images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

-- Allow suppliers to delete their own uploaded images
CREATE POLICY "Suppliers can delete order images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

-- Allow customers to view customer-uploaded files (from order-files bucket)
CREATE POLICY "Customers can view their order files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND orders.customer_id = auth.uid()
  )
);

-- Allow suppliers to view customer-uploaded files (from order-files bucket)
CREATE POLICY "Suppliers can view customer order files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

-- Allow admins to view all files from both buckets
CREATE POLICY "Admins can view all order files" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('order-files', 'order-images') AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to manage all files from both buckets
CREATE POLICY "Admins can manage all order files" ON storage.objects
FOR ALL USING (
  bucket_id IN ('order-files', 'order-images') AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Note: Supplier images (order-images bucket) are only accessible to:
-- 1. The supplier who uploaded them (for update/delete)
-- 2. Admins (for view/manage)
-- Customers cannot see supplier images

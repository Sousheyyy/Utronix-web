-- Simple setup for order-images storage bucket and policies
-- This script creates more permissive RLS policies for supplier image uploads

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Suppliers can view order images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can upload order images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can update order images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can delete order images" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view their order images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all order images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all order images" ON storage.objects;

-- Allow suppliers to view all order images (for now, can be restricted later)
CREATE POLICY "Suppliers can view order images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

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

-- Allow suppliers to update order images
CREATE POLICY "Suppliers can update order images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

-- Allow suppliers to delete order images
CREATE POLICY "Suppliers can delete order images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'supplier'
  )
);

-- Allow customers to view order images for their own orders
CREATE POLICY "Customers can view their order images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'customer'
  )
);

-- Allow admins to view all order images
CREATE POLICY "Admins can view all order images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow admins to manage all order images
CREATE POLICY "Admins can manage all order images" ON storage.objects
FOR ALL USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

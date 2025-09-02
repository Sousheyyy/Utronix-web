-- Setup order-images storage bucket and policies
-- This script creates the storage bucket and RLS policies for supplier image uploads

-- Note: The bucket creation needs to be done through Supabase Dashboard or CLI
-- The bucket name should be 'order-images'

-- Add RLS policies for order-images bucket
-- Allow suppliers to view images for orders they have quoted on
CREATE POLICY "Suppliers can view order images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.supplier_quotes ON orders.id = supplier_quotes.order_id
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND supplier_quotes.supplier_id = auth.uid()
  )
);

-- Allow suppliers to upload images for orders they have quoted on
CREATE POLICY "Suppliers can upload order images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-images' AND
  (
    -- Allow if supplier has quoted on this order
    EXISTS (
      SELECT 1 FROM public.orders
      JOIN public.supplier_quotes ON orders.id = supplier_quotes.order_id
      WHERE orders.id::text = (storage.foldername(name))[1]
      AND supplier_quotes.supplier_id = auth.uid()
    )
    OR
    -- Allow if user is a supplier (for testing purposes)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  )
);

-- Allow suppliers to update images for orders they have quoted on
CREATE POLICY "Suppliers can update order images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.supplier_quotes ON orders.id = supplier_quotes.order_id
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND supplier_quotes.supplier_id = auth.uid()
  )
);

-- Allow suppliers to delete images for orders they have quoted on
CREATE POLICY "Suppliers can delete order images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.orders
    JOIN public.supplier_quotes ON orders.id = supplier_quotes.order_id
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND supplier_quotes.supplier_id = auth.uid()
  )
);

-- Allow customers to view images for their own orders
CREATE POLICY "Customers can view their order images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-images' AND
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND orders.customer_id = auth.uid()
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

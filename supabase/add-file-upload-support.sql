-- Add file upload support to orders table
-- This script adds columns for storing file upload information

-- Add file upload columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS uploaded_files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS files_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add comments to the columns for documentation
COMMENT ON COLUMN public.orders.uploaded_files IS 'JSON array of uploaded file information including name, size, type, and URL';
COMMENT ON COLUMN public.orders.files_uploaded_at IS 'Timestamp when files were uploaded';

-- Create storage bucket for order files if it doesn't exist
-- Note: This needs to be done through Supabase dashboard or CLI
-- The bucket name should be 'order-files'

-- Add RLS policies for file access
-- Allow users to view files for their own orders
CREATE POLICY "Users can view files for their own orders" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND orders.customer_id = auth.uid()
  )
);

-- Allow users to upload files for their own orders
CREATE POLICY "Users can upload files for their own orders" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND orders.customer_id = auth.uid()
  )
);

-- Allow users to update files for their own orders
CREATE POLICY "Users can update files for their own orders" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND orders.customer_id = auth.uid()
  )
);

-- Allow users to delete files for their own orders
CREATE POLICY "Users can delete files for their own orders" ON storage.objects
FOR DELETE USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND orders.customer_id = auth.uid()
  )
);

-- Allow admins to view all files
CREATE POLICY "Admins can view all files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow suppliers to view files for orders they have quoted on
CREATE POLICY "Suppliers can view files for quoted orders" ON storage.objects
FOR SELECT USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM public.orders 
    JOIN public.supplier_quotes ON orders.id = supplier_quotes.order_id
    WHERE orders.id::text = (storage.foldername(name))[1]
    AND supplier_quotes.supplier_id = auth.uid()
  )
);

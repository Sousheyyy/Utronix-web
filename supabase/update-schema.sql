-- Update existing database schema to add new supplier fields
-- Run this script if you have an existing database

-- Add new columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS supplier_image_url TEXT,
ADD COLUMN IF NOT EXISTS supplier_completed_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for order images if it doesn't exist
-- Note: This needs to be done through Supabase dashboard or CLI
-- The bucket name should be 'order-images'

-- Add policy for suppliers to update orders they have quoted on
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Suppliers can update orders they have quoted on'
  ) THEN
    CREATE POLICY "Suppliers can update orders they have quoted on" ON public.orders
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.supplier_quotes 
          WHERE order_id = id AND supplier_id = auth.uid()
        )
      );
  END IF;
END $$;

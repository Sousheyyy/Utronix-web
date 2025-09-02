-- Fix missing columns in orders table
-- This script adds all the columns that the frontend expects

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns one by one to avoid any issues
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_link TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS supplier_image_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS supplier_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comments to the columns for documentation
COMMENT ON COLUMN public.orders.product_link IS 'Link to the product (e.g., Amazon, AliExpress)';
COMMENT ON COLUMN public.orders.delivery_address IS 'Delivery address for the order';
COMMENT ON COLUMN public.orders.phone_number IS 'Contact phone number for the order';
COMMENT ON COLUMN public.orders.supplier_image_url IS 'URL of image uploaded by supplier';
COMMENT ON COLUMN public.orders.supplier_completed_at IS 'Timestamp when supplier marked order as completed';

-- Verify all columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

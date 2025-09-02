-- Add delivery address and phone number fields to orders table

-- Add delivery_address column
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add phone_number column
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comments to the columns for documentation
COMMENT ON COLUMN public.orders.delivery_address IS 'Delivery address for the order';
COMMENT ON COLUMN public.orders.phone_number IS 'Contact phone number for the order';


-- Fix admin_margin field to allow larger profit values
-- The current DECIMAL(5,2) only allows up to 999.99, which is too small for large orders

-- Update the admin_margin column to allow larger values
ALTER TABLE public.orders 
ALTER COLUMN admin_margin TYPE DECIMAL(10,2);

-- Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name = 'admin_margin'
AND table_schema = 'public';

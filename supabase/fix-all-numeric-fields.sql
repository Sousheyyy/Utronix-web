-- Comprehensive fix for all numeric fields in orders table
-- This ensures all decimal fields can handle large values

-- First, let's see the current structure
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND data_type IN ('numeric', 'decimal')
ORDER BY ordinal_position;

-- Update all numeric fields to have adequate precision
-- supplier_price: DECIMAL(10,2) - allows up to 99,999,999.99
ALTER TABLE public.orders 
ALTER COLUMN supplier_price TYPE DECIMAL(10,2);

-- final_price: DECIMAL(10,2) - allows up to 99,999,999.99  
ALTER TABLE public.orders 
ALTER COLUMN final_price TYPE DECIMAL(10,2);

-- admin_margin: DECIMAL(10,2) - allows up to 99,999,999.99
ALTER TABLE public.orders 
ALTER COLUMN admin_margin TYPE DECIMAL(10,2);

-- Verify the changes
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND data_type IN ('numeric', 'decimal')
ORDER BY ordinal_position;

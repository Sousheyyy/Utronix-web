-- Add global order numbering system
-- This creates a sequential order number for each order that's easy to identify

-- Add order_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1000;

-- Create a function to generate the next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the next value from the sequence
    next_number := nextval('public.order_number_seq');
    
    -- Ensure the number is unique (in case of concurrent inserts)
    WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = next_number) LOOP
        next_number := nextval('public.order_number_seq');
    END LOOP;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set order_number when a new order is created
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set order_number if it's not already set
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

-- Create the trigger
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Update existing orders that don't have order numbers
-- This will assign numbers to existing orders
DO $$
DECLARE
    order_record RECORD;
    current_number INTEGER := 1000;
BEGIN
    -- Get all orders without order numbers, ordered by creation date
    FOR order_record IN 
        SELECT id FROM public.orders 
        WHERE order_number IS NULL 
        ORDER BY created_at ASC
    LOOP
        -- Update the order with the next number
        UPDATE public.orders 
        SET order_number = current_number 
        WHERE id = order_record.id;
        
        current_number := current_number + 1;
    END LOOP;
    
    -- Update the sequence to start from the next available number
    IF current_number > 1000 THEN
        PERFORM setval('public.order_number_seq', current_number);
    END IF;
END $$;

-- Create an index on order_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Verify the setup
SELECT 
    'Order numbering system setup complete' as status,
    COUNT(*) as total_orders,
    MIN(order_number) as min_order_number,
    MAX(order_number) as max_order_number
FROM public.orders 
WHERE order_number IS NOT NULL;

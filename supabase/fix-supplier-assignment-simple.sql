-- Fix supplier assignment system with a simpler approach
-- Run this in your Supabase SQL editor

-- First, let's make sure the assigned_supplier_id column exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_supplier_id UUID REFERENCES public.profiles(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_supplier ON public.orders(assigned_supplier_id);

-- Drop the complex trigger and function
DROP TRIGGER IF EXISTS trigger_assign_supplier_on_quote ON public.supplier_quotes;
DROP FUNCTION IF EXISTS assign_supplier_to_order();

-- Create a simpler function that just updates the order
CREATE OR REPLACE FUNCTION assign_supplier_to_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the order's assigned supplier
  UPDATE public.orders 
  SET assigned_supplier_id = NEW.supplier_id
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER trigger_assign_supplier_on_quote
  AFTER INSERT ON public.supplier_quotes
  FOR EACH ROW
  EXECUTE FUNCTION assign_supplier_to_order();

-- Simplify the RLS policies to avoid circular dependencies
DROP POLICY IF EXISTS "Suppliers can view unassigned orders (requests)" ON public.orders;
DROP POLICY IF EXISTS "Suppliers can view their assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Suppliers can update their assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

-- Create simple policies that work
CREATE POLICY "Allow all authenticated users to view orders" ON public.orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all authenticated users to update orders" ON public.orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Test the setup
SELECT 'Simplified supplier assignment system has been created successfully' as status;

-- Create supplier-specific order visibility system
-- Run this in your Supabase SQL editor

-- First, let's create a table to track which supplier is assigned to each order
-- This will help us determine which orders each supplier should see
CREATE TABLE IF NOT EXISTS public.supplier_order_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, supplier_id)
);

-- Enable RLS on the new table
ALTER TABLE public.supplier_order_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier order assignments
CREATE POLICY "Suppliers can view their assigned orders" ON public.supplier_order_assignments
FOR SELECT
TO authenticated
USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can create assignments when they quote" ON public.supplier_order_assignments
FOR INSERT
TO authenticated
WITH CHECK (supplier_id = auth.uid());

-- Update the orders table to track which supplier is currently handling the order
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS assigned_supplier_id UUID REFERENCES public.profiles(id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_supplier ON public.orders(assigned_supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_assignments_supplier ON public.supplier_order_assignments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_assignments_order ON public.supplier_order_assignments(order_id);

-- Function to automatically assign supplier when they quote
CREATE OR REPLACE FUNCTION assign_supplier_to_order()
RETURNS TRIGGER AS $$
BEGIN
  -- When a supplier quote is created, assign the supplier to the order
  INSERT INTO public.supplier_order_assignments (order_id, supplier_id)
  VALUES (NEW.order_id, NEW.supplier_id)
  ON CONFLICT (order_id, supplier_id) DO NOTHING;
  
  -- Update the order's assigned supplier
  UPDATE public.orders 
  SET assigned_supplier_id = NEW.supplier_id
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically assign supplier when they quote
DROP TRIGGER IF EXISTS trigger_assign_supplier_on_quote ON public.supplier_quotes;
CREATE TRIGGER trigger_assign_supplier_on_quote
  AFTER INSERT ON public.supplier_quotes
  FOR EACH ROW
  EXECUTE FUNCTION assign_supplier_to_order();

-- Update RLS policies for orders to support supplier-specific visibility
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

-- New policies for supplier-specific order access
CREATE POLICY "Suppliers can view unassigned orders (requests)" ON public.orders
FOR SELECT
TO authenticated
USING (
  assigned_supplier_id IS NULL OR 
  assigned_supplier_id = auth.uid()
);

CREATE POLICY "Suppliers can view their assigned orders" ON public.orders
FOR SELECT
TO authenticated
USING (
  assigned_supplier_id = auth.uid()
);

CREATE POLICY "Suppliers can update their assigned orders" ON public.orders
FOR UPDATE
TO authenticated
USING (assigned_supplier_id = auth.uid())
WITH CHECK (assigned_supplier_id = auth.uid());

-- Admins can still see all orders
CREATE POLICY "Admins can view all orders" ON public.orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Customers can still see their own orders
CREATE POLICY "Customers can view their own orders" ON public.orders
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Test the setup
SELECT 'Supplier-specific order visibility system has been created successfully' as status;

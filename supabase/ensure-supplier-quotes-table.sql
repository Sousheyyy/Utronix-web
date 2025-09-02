-- Ensure supplier_quotes table exists with correct structure
-- This script creates the table if it doesn't exist and sets up RLS policies

-- Create supplier_quotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.supplier_quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, supplier_id)
);

-- Enable RLS on supplier_quotes table
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Suppliers can view quotes for orders they can see" ON public.supplier_quotes;
DROP POLICY IF EXISTS "Suppliers can create quotes" ON public.supplier_quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.supplier_quotes;

-- Create RLS policies for supplier_quotes
CREATE POLICY "Suppliers can view quotes for orders they can see" ON public.supplier_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'supplier'
    )
  );

CREATE POLICY "Suppliers can create quotes" ON public.supplier_quotes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'supplier'
    )
  );

CREATE POLICY "Admins can view all quotes" ON public.supplier_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'supplier_quotes'
AND table_schema = 'public'
ORDER BY ordinal_position;

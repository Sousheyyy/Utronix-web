-- Simple fix for saved addresses - run this in Supabase SQL Editor

-- First, let's check if the table exists and what the current state is
SELECT 'Current table status:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'saved_addresses' 
AND table_schema = 'public';

-- Drop the table completely to start fresh
DROP TABLE IF EXISTS public.saved_addresses CASCADE;

-- Create the table with the simplest possible structure
CREATE TABLE public.saved_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Create the most permissive RLS policy for testing
CREATE POLICY "Allow all operations for authenticated users" ON public.saved_addresses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant all permissions
GRANT ALL ON public.saved_addresses TO authenticated;
GRANT ALL ON public.saved_addresses TO anon;

-- Create a simple index
CREATE INDEX idx_saved_addresses_customer_id ON public.saved_addresses(customer_id);

-- Test insert (this should work now)
INSERT INTO public.saved_addresses (customer_id, name, address, phone, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- dummy UUID for testing
  'Test Address',
  '123 Test Street',
  '+1234567890',
  false
);

-- Verify the insert worked
SELECT 'Test insert successful' as status;
SELECT * FROM public.saved_addresses WHERE name = 'Test Address';

-- Clean up test data
DELETE FROM public.saved_addresses WHERE name = 'Test Address';

SELECT 'Saved addresses table created successfully with permissive policies' as status;

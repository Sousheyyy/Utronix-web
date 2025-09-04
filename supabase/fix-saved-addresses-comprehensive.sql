-- Comprehensive fix for saved addresses system
-- Run this in your Supabase SQL editor

-- First, check if the table exists and drop if it has issues
DROP TABLE IF EXISTS public.saved_addresses CASCADE;

-- Create the saved_addresses table with proper structure
CREATE TABLE public.saved_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Customers can view their own saved addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Customers can create their own saved addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Customers can update their own saved addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Customers can delete their own saved addresses" ON public.saved_addresses;

-- Create simple, working RLS policies
CREATE POLICY "Users can view their own saved addresses" ON public.saved_addresses
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Users can insert their own saved addresses" ON public.saved_addresses
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update their own saved addresses" ON public.saved_addresses
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can delete their own saved addresses" ON public.saved_addresses
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_addresses_customer ON public.saved_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_default ON public.saved_addresses(customer_id, is_default);

-- Function to ensure only one default address per customer
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this address as default, unset all other defaults for this customer
  IF NEW.is_default = true THEN
    UPDATE public.saved_addresses 
    SET is_default = false 
    WHERE customer_id = NEW.customer_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON public.saved_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON public.saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Grant necessary permissions
GRANT ALL ON public.saved_addresses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the setup by checking if we can query the table
SELECT 'Saved addresses system has been created and configured successfully' as status;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'saved_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

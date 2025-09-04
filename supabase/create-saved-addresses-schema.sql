-- Create saved addresses system for customers
-- Run this in your Supabase SQL editor

-- Create saved_addresses table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Home", "Office", "Warehouse"
  address TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for saved addresses
CREATE POLICY "Customers can view their own saved addresses" ON public.saved_addresses
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Customers can create their own saved addresses" ON public.saved_addresses
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their own saved addresses" ON public.saved_addresses
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete their own saved addresses" ON public.saved_addresses
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- Create indexes for better performance
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

-- Create trigger to ensure only one default address per customer
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON public.saved_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON public.saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Test the setup
SELECT 'Saved addresses system has been created successfully' as status;

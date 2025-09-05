-- Remove default address functionality from saved_addresses
-- Run this in your Supabase SQL editor

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON public.saved_addresses;

-- Drop the function
DROP FUNCTION IF EXISTS ensure_single_default_address();

-- Remove the is_default column
ALTER TABLE public.saved_addresses DROP COLUMN IF EXISTS is_default;

-- Drop the index that was based on is_default
DROP INDEX IF EXISTS idx_saved_addresses_default;

-- Test the changes
SELECT 'Default address functionality has been removed successfully' as status;

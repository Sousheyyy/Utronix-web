-- Test script for saved addresses functionality
-- Run this in your Supabase SQL editor to verify everything works

-- Test 1: Check if table exists and has correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'saved_addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'saved_addresses';

-- Test 3: Check if we can insert a test record (this will fail if RLS is too restrictive)
-- Note: This will only work if you're authenticated as a user
INSERT INTO public.saved_addresses (customer_id, name, address, phone, is_default)
VALUES (
  auth.uid(),
  'Test Address',
  '123 Test Street, Test City, Test Country',
  '+1234567890',
  true
) RETURNING *;

-- Test 4: Check if we can select records
SELECT * FROM public.saved_addresses WHERE customer_id = auth.uid();

-- Test 5: Clean up test data
DELETE FROM public.saved_addresses WHERE name = 'Test Address' AND customer_id = auth.uid();

-- Test 6: Check table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'saved_addresses' 
AND table_schema = 'public';

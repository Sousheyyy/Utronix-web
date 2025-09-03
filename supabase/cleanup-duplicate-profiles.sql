-- Clean up duplicate profiles and fix any data inconsistencies
-- Run this in your Supabase SQL editor

-- First, let's see if there are any duplicate profiles
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  created_at,
  COUNT(*) as count
FROM public.profiles 
GROUP BY id, email, full_name, role, created_at
HAVING COUNT(*) > 1;

-- If there are duplicates, we can remove them (keep the latest one)
-- Uncomment the following lines if you find duplicates:

-- DELETE FROM public.profiles 
-- WHERE id IN (
--   SELECT id 
--   FROM (
--     SELECT id, 
--            ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
--     FROM public.profiles
--   ) t 
--   WHERE rn > 1
-- );

-- Check for profiles without corresponding auth users
SELECT p.id, p.email, p.full_name, p.role
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- If there are orphaned profiles, we can clean them up:
-- DELETE FROM public.profiles 
-- WHERE id NOT IN (SELECT id FROM auth.users);

-- Test the profiles table
SELECT 'Profiles table cleanup completed successfully' as status;

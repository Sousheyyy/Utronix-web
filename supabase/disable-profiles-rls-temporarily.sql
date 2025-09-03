-- Temporarily disable RLS on profiles table to fix infinite recursion
-- Run this in your Supabase SQL editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can manage all profiles" ON public.profiles;

-- Temporarily disable RLS to fix the recursion issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test the change
SELECT 'RLS temporarily disabled on profiles table to fix infinite recursion' as status;

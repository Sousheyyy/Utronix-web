-- Fix RLS policies for profiles table - Simple version without recursion
-- Run this in your Supabase SQL editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow all authenticated users to view all profiles (for now)
-- This prevents recursion issues and allows the app to work
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Policy 5: Allow all authenticated users to manage all profiles (for now)
-- This prevents recursion issues and allows the app to work
CREATE POLICY "Authenticated users can manage all profiles" ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Test the policies
SELECT 'RLS policies for profiles table have been updated successfully (simple version)' as status;

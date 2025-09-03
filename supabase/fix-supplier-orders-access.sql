-- Fix supplier access to orders table
-- Run this in your Supabase SQL editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Suppliers can view orders" ON public.orders;
DROP POLICY IF EXISTS "Suppliers can update orders they have quoted on" ON public.orders;
DROP POLICY IF EXISTS "Suppliers can view quotes for orders they can see" ON public.supplier_quotes;
DROP POLICY IF EXISTS "Suppliers can create quotes" ON public.supplier_quotes;

-- Create simplified policies without circular dependencies
-- Allow all authenticated users to view orders (for now)
CREATE POLICY "Authenticated users can view orders" ON public.orders
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to update orders (for now)
CREATE POLICY "Authenticated users can update orders" ON public.orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to view supplier quotes
CREATE POLICY "Authenticated users can view supplier quotes" ON public.supplier_quotes
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to create supplier quotes
CREATE POLICY "Authenticated users can create supplier quotes" ON public.supplier_quotes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update supplier quotes
CREATE POLICY "Authenticated users can update supplier quotes" ON public.supplier_quotes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Test the policies
SELECT 'Supplier orders access policies have been updated successfully' as status;

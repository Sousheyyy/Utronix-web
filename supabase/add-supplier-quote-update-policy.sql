-- Add UPDATE policy for supplier_quotes to allow suppliers to update their own quotes
-- This is needed for the upsert functionality to work properly

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Suppliers can update their own quotes" ON public.supplier_quotes;

-- Create UPDATE policy for supplier_quotes
CREATE POLICY "Suppliers can update their own quotes" ON public.supplier_quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'supplier'
    ) AND supplier_id = auth.uid()
  );

-- Verify the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'supplier_quotes'
ORDER BY policyname;

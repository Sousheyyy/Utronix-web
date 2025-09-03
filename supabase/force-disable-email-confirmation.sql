-- Force disable email confirmation in Supabase
-- Run this in your Supabase SQL editor if dashboard method doesn't work

-- Method 1: Update auth configuration
UPDATE auth.config 
SET raw_app_meta_data = raw_app_meta_data || '{"email_confirm": false}'::jsonb;

-- Method 2: Alternative approach - update auth settings
UPDATE auth.config 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb), 
  '{email_confirm}', 
  'false'::jsonb
);

-- Method 3: Check current configuration
SELECT raw_app_meta_data FROM auth.config;

-- Method 4: If the above doesn't work, try this approach
-- This disables email confirmation for all new signups
UPDATE auth.config 
SET raw_app_meta_data = '{"email_confirm": false, "phone_confirm": false}'::jsonb;

-- Verify the change
SELECT 
  raw_app_meta_data->>'email_confirm' as email_confirm_enabled,
  raw_app_meta_data->>'phone_confirm' as phone_confirm_enabled
FROM auth.config;

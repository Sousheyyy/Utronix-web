-- Disable Email Confirmation for Supabase Auth
-- This script helps configure Supabase to not require email confirmation

-- Note: This is a reference script. The actual configuration needs to be done in the Supabase Dashboard:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Authentication > Settings
-- 3. Under "User Signups", disable "Enable email confirmations"
-- 4. Save the changes

-- Alternative: You can also run this SQL command if you have the necessary permissions:
-- UPDATE auth.config SET raw_app_meta_data = raw_app_meta_data || '{"email_confirm": false}'::jsonb;

-- However, the dashboard method is recommended as it's safer and more reliable.

SELECT 'Please configure email confirmation settings in your Supabase dashboard under Authentication > Settings' as instruction;

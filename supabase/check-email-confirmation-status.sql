-- Check current email confirmation status
-- Run this to see if email confirmation is enabled or disabled

-- Check auth configuration
SELECT 
  raw_app_meta_data->>'email_confirm' as email_confirm_enabled,
  raw_app_meta_data->>'phone_confirm' as phone_confirm_enabled,
  raw_app_meta_data as full_config
FROM auth.config;

-- Check if there are any users with unconfirmed emails
SELECT 
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
    ELSE 'CONFIRMED'
  END as confirmation_status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- If you see users with 'NOT CONFIRMED' status, you can manually confirm them:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'user@example.com';

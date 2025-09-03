-- Manually confirm existing users who can't log in
-- Replace 'your-email@example.com' with the actual email addresses

-- Confirm specific user by email
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-email@example.com';

-- Confirm all users who haven't been confirmed yet (use with caution)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email_confirmed_at IS NULL;

-- Check the results
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC;

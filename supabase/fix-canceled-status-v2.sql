-- Fix canceled status issue - Version 2
-- This script handles the PostgreSQL enum value commit requirement

-- Step 1: Add the canceled value to the enum (this will be committed automatically)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'canceled';

-- Step 2: Verify the enum values (run this after the above command completes)
SELECT unnest(enum_range(NULL::order_status)) as order_status_values;

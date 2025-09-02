-- Fix canceled status issue
-- Run this script to ensure the canceled status is properly added

-- First, check if the canceled value exists in the enum
DO $$
BEGIN
    -- Try to add the canceled value to the enum
    BEGIN
        ALTER TYPE order_status ADD VALUE 'canceled';
        RAISE NOTICE 'Successfully added canceled to order_status enum';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'canceled already exists in order_status enum';
    END;
END $$;

-- Verify the enum values
SELECT unnest(enum_range(NULL::order_status)) as order_status_values;

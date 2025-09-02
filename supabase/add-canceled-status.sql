-- Add 'canceled' status to order_status enum
-- Run this script to add the canceled status to existing databases

-- Add the 'canceled' value to the order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'canceled';

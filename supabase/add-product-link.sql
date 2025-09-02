-- Add product_link column to orders table
-- Run this script to add the product_link field to existing databases

-- Add the product_link column to the orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS product_link TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.orders.product_link IS 'Optional URL link to the product the customer wants to order';

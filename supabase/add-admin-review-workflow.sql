-- Add admin review workflow for orders
-- Run this in your Supabase SQL editor

-- First, add the new order status to the enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'admin_review';

-- Update the order_status_history enum as well
ALTER TYPE order_status_history ADD VALUE IF NOT EXISTS 'admin_review';

-- Create a function to move orders from admin_review to request_created
CREATE OR REPLACE FUNCTION approve_order_for_suppliers(order_id_param UUID)
RETURNS void AS $$
BEGIN
  -- Update the order status to request_created
  UPDATE public.orders 
  SET status = 'request_created', updated_at = NOW()
  WHERE id = order_id_param;
  
  -- Add status history entry
  INSERT INTO public.order_status_history (order_id, status, changed_at, changed_by)
  VALUES (order_id_param, 'request_created', NOW(), 'admin');
  
  -- Log the approval
  RAISE NOTICE 'Order % approved for suppliers', order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reject orders (move to canceled)
CREATE OR REPLACE FUNCTION reject_order(order_id_param UUID, reason TEXT DEFAULT 'Rejected by admin')
RETURNS void AS $$
BEGIN
  -- Update the order status to canceled
  UPDATE public.orders 
  SET status = 'canceled', updated_at = NOW()
  WHERE id = order_id_param;
  
  -- Add status history entry
  INSERT INTO public.order_status_history (order_id, status, changed_at, changed_by, notes)
  VALUES (order_id_param, 'canceled', NOW(), 'admin', reason);
  
  -- Log the rejection
  RAISE NOTICE 'Order % rejected: %', order_id_param, reason;
END;
$$ LANGUAGE plpgsql;

-- Update the order creation to set status to admin_review instead of request_created
-- This will be handled in the frontend, but we need to ensure the status exists

-- Test the new status
SELECT 'Admin review workflow added successfully' as status;

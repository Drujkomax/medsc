-- Add status column to warehouse_items for tracking item location/state
ALTER TABLE public.warehouse_items 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_stock';

-- Add comment for the column
COMMENT ON COLUMN public.warehouse_items.status IS 'Item status: in_stock, reserved, in_transit, sold, written_off, defective';
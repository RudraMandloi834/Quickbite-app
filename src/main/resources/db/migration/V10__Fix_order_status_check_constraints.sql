-- Drop legacy V1 inline check constraints that prevent modern order lifecycle statuses ('PLACED', 'ACCEPTED', 'REJECTED')
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_previous_status_check;
ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_new_status_check;

-- Ensure any existing orders column status type is VARCHAR(255)
ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(255);
ALTER TABLE order_status_history ALTER COLUMN previous_status TYPE VARCHAR(255);
ALTER TABLE order_status_history ALTER COLUMN new_status TYPE VARCHAR(255);

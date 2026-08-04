ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS printful_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS printful_shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS refunded_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_shop_orders_printful_order_id
  ON public.shop_orders (printful_order_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_payment_intent
  ON public.shop_orders (stripe_payment_intent);
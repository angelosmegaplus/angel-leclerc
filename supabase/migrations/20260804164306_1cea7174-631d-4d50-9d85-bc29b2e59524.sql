ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS printful_source text,
  ADD COLUMN IF NOT EXISTS printful_external_id text,
  ADD COLUMN IF NOT EXISTS printful_synced_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS shop_products_printful_external_id_key
  ON public.shop_products (printful_external_id)
  WHERE printful_external_id IS NOT NULL;
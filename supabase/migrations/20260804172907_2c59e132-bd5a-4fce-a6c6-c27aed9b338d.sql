ALTER TABLE public.shop_products
  ALTER COLUMN printful_variant_id TYPE BIGINT,
  ALTER COLUMN printful_sync_variant_id TYPE BIGINT;

ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS printful_product_id BIGINT,
  ADD COLUMN IF NOT EXISTS printful_sync_product_id BIGINT,
  ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS shop_products_printful_external_id_key
  ON public.shop_products (printful_external_id)
  WHERE printful_external_id IS NOT NULL;
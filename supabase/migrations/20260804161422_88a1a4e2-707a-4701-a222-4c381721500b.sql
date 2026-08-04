ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS printful_sync_variant_id integer,
  ADD COLUMN IF NOT EXISTS printful_print_file_url text;
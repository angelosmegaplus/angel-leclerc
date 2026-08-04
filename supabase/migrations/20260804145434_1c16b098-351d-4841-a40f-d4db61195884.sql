
CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL CHECK (price_cents >= 100),
  currency text NOT NULL DEFAULT 'EUR',
  image_url text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  printful_variant_id integer,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products" ON public.shop_products
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins can read all products" ON public.shop_products
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert products" ON public.shop_products
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update products" ON public.shop_products
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete products" ON public.shop_products
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER shop_products_updated_at BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL UNIQUE,
  stripe_payment_intent text,
  environment text NOT NULL DEFAULT 'sandbox',
  customer_email text,
  customer_name text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping jsonb,
  status text NOT NULL DEFAULT 'paid',
  printful_order_id text,
  printful_status text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_orders TO authenticated;
GRANT ALL ON public.shop_orders TO service_role;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read orders" ON public.shop_orders
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER shop_orders_updated_at BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.shop_products (slug, name, description, price_cents, image_url, printful_variant_id, active, sort_order)
VALUES (
  'tasse-alc',
  'Tasse ALC!',
  'Tasse en céramique blanche 325 ml (11 oz), impression à la demande. Passe au lave-vaisselle et au micro-ondes. Produit de test pour valider le parcours de commande.',
  1900,
  NULL,
  1320,
  true,
  1
);

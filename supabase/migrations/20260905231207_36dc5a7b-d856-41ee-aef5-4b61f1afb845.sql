CREATE TABLE public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client text,
  category text not null default 'Création',
  year integer,
  description text not null default '',
  images jsonb not null default '[]'::jsonb,
  cover_url text,
  link_url text,
  tags jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public peut voir les realisations publiees"
  ON public.portfolio_items FOR SELECT
  USING (published = true);

CREATE POLICY "Admins peuvent tout voir"
  ON public.portfolio_items FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins peuvent ajouter"
  ON public.portfolio_items FOR INSERT
  TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins peuvent modifier"
  ON public.portfolio_items FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins peuvent supprimer"
  ON public.portfolio_items FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
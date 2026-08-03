CREATE TABLE public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  device text,
  country text,
  session_id text,
  created_at timestamptz not null default now()
);
CREATE INDEX page_views_created_at_idx ON public.page_views (created_at DESC);
CREATE INDEX page_views_path_idx ON public.page_views (path);
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_page_views" ON public.page_views FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
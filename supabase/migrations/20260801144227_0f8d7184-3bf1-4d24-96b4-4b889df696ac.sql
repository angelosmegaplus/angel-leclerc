ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON public.articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;

CREATE POLICY "Public can view published public articles"
ON public.articles
FOR SELECT
TO anon, authenticated
USING (published = true AND is_private = false);
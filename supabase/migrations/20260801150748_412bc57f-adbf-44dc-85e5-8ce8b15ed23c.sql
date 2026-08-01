ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Public can view published public articles" ON public.articles;

CREATE POLICY "Public can view published public articles"
ON public.articles
FOR SELECT
TO anon, authenticated
USING (
  published = true
  AND is_private = false
  AND (scheduled_at IS NULL OR scheduled_at <= now())
);

CREATE INDEX IF NOT EXISTS articles_scheduled_at_idx ON public.articles (scheduled_at);
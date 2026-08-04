ALTER TABLE public.blog_subscribers
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS last_newsletter_at timestamptz;

CREATE TABLE IF NOT EXISTS public.newsletter_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz NOT NULL DEFAULT now(),
  article_count integer NOT NULL DEFAULT 0,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_runs TO authenticated;
GRANT ALL ON public.newsletter_runs TO service_role;

ALTER TABLE public.newsletter_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read newsletter runs" ON public.newsletter_runs;
CREATE POLICY "Admins can read newsletter runs"
  ON public.newsletter_runs FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
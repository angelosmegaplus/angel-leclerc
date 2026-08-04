CREATE TABLE public.content_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_key text NOT NULL,
  content_title text,
  rating smallint NOT NULL,
  comment text,
  email text,
  visitor_hash text,
  support_amount_cents integer,
  payment_status text NOT NULL DEFAULT 'none',
  paid_amount_cents integer,
  payment_reference text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.content_feedback TO authenticated;
GRANT ALL ON public.content_feedback TO service_role;
ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read feedback" ON public.content_feedback FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update feedback" ON public.content_feedback FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete feedback" ON public.content_feedback FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX content_feedback_key_idx ON public.content_feedback (content_key, created_at DESC);
CREATE INDEX content_feedback_visitor_idx ON public.content_feedback (visitor_hash, content_key, created_at DESC);

CREATE TRIGGER content_feedback_updated_at BEFORE UPDATE ON public.content_feedback
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.feedback_settings (
  id boolean PRIMARY KEY DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  support_enabled boolean NOT NULL DEFAULT true,
  comment_enabled boolean NOT NULL DEFAULT true,
  public_display text NOT NULL DEFAULT 'average_count',
  min_rating_for_support smallint NOT NULL DEFAULT 3,
  amounts_cents jsonb NOT NULL DEFAULT '[200,500,1000,2000]'::jsonb,
  min_amount_cents integer NOT NULL DEFAULT 100,
  revolut_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  questions jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmation_texts jsonb NOT NULL DEFAULT '{}'::jsonb,
  disabled_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedback_settings_singleton CHECK (id)
);

GRANT SELECT, UPDATE ON public.feedback_settings TO authenticated;
GRANT ALL ON public.feedback_settings TO service_role;
ALTER TABLE public.feedback_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read feedback settings" ON public.feedback_settings FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update feedback settings" ON public.feedback_settings FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER feedback_settings_updated_at BEFORE UPDATE ON public.feedback_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.feedback_settings (id) VALUES (true);
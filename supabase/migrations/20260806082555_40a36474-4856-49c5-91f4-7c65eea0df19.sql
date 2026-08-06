CREATE TABLE public.audio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  description text,
  kind text NOT NULL DEFAULT 'musique',
  audio_url text NOT NULL,
  image_url text,
  duration_seconds integer,
  source_label text,
  source_url text,
  published boolean NOT NULL DEFAULT false,
  in_radio boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audio_items TO authenticated;
GRANT ALL ON public.audio_items TO service_role;

ALTER TABLE public.audio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published audio" ON public.audio_items
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins can read all audio" ON public.audio_items
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert audio" ON public.audio_items
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update audio" ON public.audio_items
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete audio" ON public.audio_items
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER audio_items_updated_at BEFORE UPDATE ON public.audio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
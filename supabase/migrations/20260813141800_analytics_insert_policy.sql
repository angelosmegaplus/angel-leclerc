DROP POLICY IF EXISTS public_track_page_views ON public.page_views;
CREATE POLICY public_track_page_views ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL AND event_type IN ('pageview','click','scroll','engagement') AND char_length(path) BETWEEN 1 AND 300);

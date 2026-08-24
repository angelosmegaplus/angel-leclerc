-- Allow an author to read their just-inserted story directly.
-- The previous SELECT policy only called flamme_can_view_story(), which
-- re-queried flamme_stories and could fail during INSERT ... RETURNING.

alter policy flamme_stories_select
on public.flamme_stories
using (
  author_id = auth.uid()
  or public.flamme_can_view_story(id, auth.uid())
);

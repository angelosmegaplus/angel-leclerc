-- Flamme Social: allow an author to read back a post immediately after INSERT ... RETURNING.
-- The previous SELECT policy delegated everything to flamme_can_view_post(), whose
-- internal lookup cannot reliably see the row during the same INSERT command.
-- This keeps all existing visibility checks for other users while making the
-- author's own row directly visible to RLS.

drop policy if exists flamme_posts_select on public.flamme_posts;

create policy flamme_posts_select
on public.flamme_posts
for select
to authenticated
using (
  author_id = auth.uid()
  or public.flamme_can_view_post(id, auth.uid())
);

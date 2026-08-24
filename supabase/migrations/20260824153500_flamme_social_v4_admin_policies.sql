-- Flamme V4: admin moderation policies and expanded report contract.

alter table public.flamme_reports drop constraint if exists flamme_reports_target_type_check;
alter table public.flamme_reports add constraint flamme_reports_target_type_check
check (target_type in ('profile','post','comment','group','message','story','forum_topic','forum_reply'));

alter table public.flamme_reports drop constraint if exists flamme_reports_status_check;
alter table public.flamme_reports add constraint flamme_reports_status_check
check (status in ('open','review','actioned','reviewed','closed'));

drop policy if exists flamme_reports_select on public.flamme_reports;
create policy flamme_reports_select on public.flamme_reports for select
using (reporter_id = auth.uid() or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_forum_topics_update on public.flamme_forum_topics;
create policy flamme_forum_topics_update on public.flamme_forum_topics for update
using (author_id = auth.uid() or public.flamme_is_admin(auth.uid()))
with check (author_id = auth.uid() or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_forum_topics_delete on public.flamme_forum_topics;
create policy flamme_forum_topics_delete on public.flamme_forum_topics for delete
using (author_id = auth.uid() or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_forum_replies_update on public.flamme_forum_replies;
create policy flamme_forum_replies_update on public.flamme_forum_replies for update
using (author_id = auth.uid() or public.flamme_is_admin(auth.uid()))
with check (author_id = auth.uid() or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_forum_replies_delete on public.flamme_forum_replies;
create policy flamme_forum_replies_delete on public.flamme_forum_replies for delete
using (author_id = auth.uid() or public.flamme_is_admin(auth.uid()));

-- Admins can remove clearly abusive public content directly if necessary.
drop policy if exists flamme_comments_delete on public.flamme_comments;
create policy flamme_comments_delete on public.flamme_comments for delete
using (author_id = auth.uid() or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_stories_delete on public.flamme_stories;
create policy flamme_stories_delete on public.flamme_stories for delete
using (author_id = auth.uid() or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_posts_delete on public.flamme_posts;
create policy flamme_posts_delete on public.flamme_posts for delete
using (
  author_id = auth.uid()
  or public.flamme_is_admin(auth.uid())
  or (group_id is not null and public.flamme_is_group_moderator(group_id, auth.uid()))
);

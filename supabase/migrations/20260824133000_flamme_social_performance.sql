-- Flamme Social performance pass.
-- UI intentionally unchanged: indexes + reusable ranking backend only.

create extension if not exists pg_trgm;

-- Fast fuzzy search for the existing People / Groups / Publications search UI.
create index if not exists flamme_profiles_handle_trgm_idx
  on public.flamme_profiles using gin (lower(handle) gin_trgm_ops);
create index if not exists flamme_profiles_display_name_trgm_idx
  on public.flamme_profiles using gin (lower(display_name) gin_trgm_ops);
create index if not exists flamme_profiles_city_trgm_idx
  on public.flamme_profiles using gin (lower(coalesce(city,'')) gin_trgm_ops);
create index if not exists flamme_groups_name_trgm_idx
  on public.flamme_groups using gin (lower(name) gin_trgm_ops);
create index if not exists flamme_groups_description_trgm_idx
  on public.flamme_groups using gin (lower(description) gin_trgm_ops);
create index if not exists flamme_posts_content_trgm_idx
  on public.flamme_posts using gin (lower(content) gin_trgm_ops);

-- Feed / post hydration.
create index if not exists flamme_posts_main_feed_idx
  on public.flamme_posts (created_at desc, id desc) where group_id is null;
create index if not exists flamme_posts_kind_created_idx
  on public.flamme_posts (kind, created_at desc, id desc) where group_id is null;
create index if not exists flamme_post_media_post_position_idx
  on public.flamme_post_media (post_id, position, id);
create index if not exists flamme_comments_post_parent_created_idx
  on public.flamme_comments (post_id, parent_id, created_at, id);
create index if not exists flamme_reactions_post_reaction_idx
  on public.flamme_reactions (post_id, reaction);
create index if not exists flamme_saved_items_user_created_idx
  on public.flamme_saved_items (user_id, created_at desc, post_id);

-- Social graph / privacy checks.
create index if not exists flamme_follows_outgoing_idx
  on public.flamme_follows (follower_id, status, following_id);
create index if not exists flamme_follows_incoming_idx
  on public.flamme_follows (following_id, status, follower_id);
create index if not exists flamme_blocks_blocked_idx
  on public.flamme_blocks (blocked_id, blocker_id);
create index if not exists flamme_group_members_user_status_idx
  on public.flamme_group_members (user_id, status, group_id);
create index if not exists flamme_event_attendees_user_idx
  on public.flamme_event_attendees (user_id, event_id, status);

-- Messaging / alerts / moderation.
create index if not exists flamme_conversation_members_user_idx
  on public.flamme_conversation_members (user_id, conversation_id, last_read_at);
create index if not exists flamme_messages_conversation_desc_idx
  on public.flamme_messages (conversation_id, created_at desc, id desc);
create index if not exists flamme_notifications_unread_idx
  on public.flamme_notifications (user_id, created_at desc, id desc) where read_at is null;
create index if not exists flamme_reports_open_idx
  on public.flamme_reports (status, created_at desc) where status = 'open';
create index if not exists flamme_story_media_path_idx
  on public.flamme_story_media (path);

-- Original lightweight ranking model for a future/current "Pour vous" feed.
-- It follows the general candidate-generation -> signals -> scoring pattern
-- without importing AGPL recommendation-engine code.
create or replace function public.flamme_ranked_feed(
  p_limit integer default 60,
  p_before timestamptz default null,
  p_contacts_only boolean default false
)
returns table(post_id uuid, score double precision, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  with candidates as (
    select
      p.id,
      p.author_id,
      p.created_at,
      coalesce((select count(*) from public.flamme_reactions r where r.post_id = p.id), 0)::double precision as reaction_count,
      coalesce((select count(*) from public.flamme_comments c where c.post_id = p.id), 0)::double precision as comment_count,
      exists(
        select 1
        from public.flamme_follows f
        where f.follower_id = auth.uid()
          and f.following_id = p.author_id
          and f.status = 'accepted'
      ) as followed_author
    from public.flamme_posts p
    where auth.uid() is not null
      and p.group_id is null
      and (p_before is null or p.created_at < p_before)
      and public.flamme_can_view_post(p.id, auth.uid())
      and (
        not p_contacts_only
        or p.author_id = auth.uid()
        or exists(
          select 1
          from public.flamme_follows f
          where f.follower_id = auth.uid()
            and f.following_id = p.author_id
            and f.status = 'accepted'
        )
      )
      and p.created_at > now() - interval '45 days'
    order by p.created_at desc
    limit greatest(least(coalesce(p_limit, 60) * 8, 800), 80)
  )
  select
    id as post_id,
    (
      100.0 * exp(-extract(epoch from (now() - created_at)) / 259200.0)
      + ln(1.0 + reaction_count) * 12.0
      + ln(1.0 + comment_count) * 18.0
      + case when followed_author then 26.0 else 0.0 end
      + case when author_id = auth.uid() then 4.0 else 0.0 end
    )::double precision as score,
    created_at
  from candidates
  order by score desc, created_at desc, id desc
  limit greatest(1, least(coalesce(p_limit, 60), 100));
$$;

grant execute on function public.flamme_ranked_feed(integer,timestamptz,boolean) to authenticated;

analyze public.flamme_profiles;
analyze public.flamme_posts;
analyze public.flamme_post_media;
analyze public.flamme_comments;
analyze public.flamme_reactions;
analyze public.flamme_follows;
analyze public.flamme_messages;
analyze public.flamme_notifications;

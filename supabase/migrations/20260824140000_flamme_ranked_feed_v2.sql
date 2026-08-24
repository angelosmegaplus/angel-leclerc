-- Flamme Social ranking v2
-- Original implementation inspired only by the general candidates -> signals -> score pattern.
-- No third-party recommendation-engine code is copied here.

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
  ), scored as (
    select
      id,
      author_id,
      created_at,
      (
        100.0 * exp(-extract(epoch from (now() - created_at)) / 259200.0)
        + ln(1.0 + reaction_count) * 12.0
        + ln(1.0 + comment_count) * 18.0
        + case when followed_author then 26.0 else 0.0 end
        + case when author_id = auth.uid() then 4.0 else 0.0 end
      )::double precision as raw_score
    from candidates
  ), diversified as (
    select
      id,
      created_at,
      raw_score,
      row_number() over (partition by author_id order by raw_score desc, created_at desc, id desc) as author_rank
    from scored
  )
  select
    id as post_id,
    (raw_score - greatest(author_rank - 1, 0) * 10.0)::double precision as score,
    created_at
  from diversified
  order by score desc, created_at desc, id desc
  limit greatest(1, least(coalesce(p_limit, 60), 100));
$$;

grant execute on function public.flamme_ranked_feed(integer,timestamptz,boolean) to authenticated;

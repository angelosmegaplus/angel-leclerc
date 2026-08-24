-- Flamme Social V4: verification, anonymous publishing and moderation state.

create or replace function public.flamme_is_admin(u uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select u is not null and exists (
    select 1 from public.user_roles ur
    where ur.user_id = u and ur.role::text = 'admin'
  );
$$;

alter table public.flamme_profiles
  add column if not exists is_verified boolean not null default false;

alter table public.flamme_posts
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists moderation_status text not null default 'visible';

alter table public.flamme_comments
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists moderation_status text not null default 'visible';

alter table public.flamme_forum_topics
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists moderation_status text not null default 'visible';

alter table public.flamme_forum_replies
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists moderation_status text not null default 'visible';

alter table public.flamme_stories
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists moderation_status text not null default 'visible';

alter table public.flamme_reports
  add column if not exists ai_decision text,
  add column if not exists ai_reason text,
  add column if not exists ai_categories jsonb not null default '[]'::jsonb,
  add column if not exists ai_checked_at timestamptz;

do $$ begin
  alter table public.flamme_posts add constraint flamme_posts_moderation_status_check check (moderation_status in ('visible','review','hidden'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flamme_comments add constraint flamme_comments_moderation_status_check check (moderation_status in ('visible','review','hidden'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flamme_forum_topics add constraint flamme_forum_topics_moderation_status_check check (moderation_status in ('visible','review','hidden'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flamme_forum_replies add constraint flamme_forum_replies_moderation_status_check check (moderation_status in ('visible','review','hidden'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.flamme_stories add constraint flamme_stories_moderation_status_check check (moderation_status in ('visible','review','hidden'));
exception when duplicate_object then null; end $$;

create table if not exists public.flamme_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  action text not null check (action in ('review','hide','restore','delete')),
  reason text not null default '',
  categories jsonb not null default '[]'::jsonb,
  source text not null default 'mistral',
  actor_id uuid,
  created_at timestamptz not null default now()
);

alter table public.flamme_moderation_actions enable row level security;

drop policy if exists flamme_moderation_actions_admin_select on public.flamme_moderation_actions;
create policy flamme_moderation_actions_admin_select on public.flamme_moderation_actions
for select using (public.flamme_is_admin(auth.uid()));

create or replace function public.flamme_set_verified(target_user uuid, verified boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.flamme_is_admin(auth.uid()) then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  update public.flamme_profiles set is_verified = verified, updated_at = now() where id = target_user;
  return found;
end;
$$;

grant execute on function public.flamme_set_verified(uuid, boolean) to authenticated;
grant execute on function public.flamme_is_admin(uuid) to authenticated;

create or replace function public.flamme_guard_trust_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'flamme_profiles' then
    if new.is_verified is distinct from old.is_verified
       and coalesce(auth.role(), '') <> 'service_role'
       and not public.flamme_is_admin(auth.uid()) then
      raise exception 'verification_is_admin_only' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.moderation_status is distinct from old.moderation_status
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.flamme_is_admin(auth.uid()) then
    raise exception 'moderation_is_admin_only' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists flamme_profiles_guard_trust on public.flamme_profiles;
create trigger flamme_profiles_guard_trust before update on public.flamme_profiles
for each row execute function public.flamme_guard_trust_fields();

do $$
declare t text;
begin
  foreach t in array array['flamme_posts','flamme_comments','flamme_forum_topics','flamme_forum_replies','flamme_stories'] loop
    execute format('drop trigger if exists %I_guard_trust on public.%I', t, t);
    execute format('create trigger %I_guard_trust before update on public.%I for each row execute function public.flamme_guard_trust_fields()', t, t);
  end loop;
end $$;

create or replace function public.flamme_can_view_post(p uuid, u uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.flamme_posts%rowtype; gvis text;
begin
  select * into r from public.flamme_posts where id=p;
  if not found or u is null then return false; end if;
  if r.author_id=u or public.flamme_is_admin(u) then return true; end if;
  if r.moderation_status <> 'visible' then return false; end if;
  if exists(select 1 from public.flamme_blocks where (blocker_id=u and blocked_id=r.author_id) or (blocker_id=r.author_id and blocked_id=u)) then return false; end if;
  if r.group_id is not null then
    if public.flamme_is_group_member(r.group_id,u) then return true; end if;
    select visibility into gvis from public.flamme_groups where id=r.group_id;
    return gvis='public' and r.visibility='public';
  end if;
  if r.visibility='public' then return true; end if;
  if r.visibility='contacts' then return public.flamme_is_contact(r.author_id,u); end if;
  return false;
end;
$$;

create or replace function public.flamme_can_view_story(s uuid, u uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare r public.flamme_stories%rowtype;
begin
  select * into r from public.flamme_stories where id=s;
  if not found or u is null or r.expires_at<=now() then return false; end if;
  if r.author_id=u or public.flamme_is_admin(u) then return true; end if;
  if r.moderation_status <> 'visible' then return false; end if;
  if public.flamme_is_blocked(u,r.author_id) then return false; end if;
  if r.visibility='public' then return true; end if;
  if r.visibility='contacts' then return public.flamme_is_contact(r.author_id,u); end if;
  return false;
end;
$$;

-- Hidden content is only visible to its author and administrators.
drop policy if exists flamme_posts_select on public.flamme_posts;
create policy flamme_posts_select on public.flamme_posts for select
using ((author_id = auth.uid()) or public.flamme_is_admin(auth.uid()) or (moderation_status='visible' and public.flamme_can_view_post(id,auth.uid())));

drop policy if exists flamme_comments_select on public.flamme_comments;
create policy flamme_comments_select on public.flamme_comments for select
using (((moderation_status='visible') or (author_id=auth.uid()) or public.flamme_is_admin(auth.uid())) and public.flamme_can_view_post(post_id,auth.uid()));

drop policy if exists flamme_forum_topics_select on public.flamme_forum_topics;
create policy flamme_forum_topics_select on public.flamme_forum_topics for select
using ((moderation_status='visible') or (author_id=auth.uid()) or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_forum_replies_select on public.flamme_forum_replies;
create policy flamme_forum_replies_select on public.flamme_forum_replies for select
using ((moderation_status='visible') or (author_id=auth.uid()) or public.flamme_is_admin(auth.uid()));

drop policy if exists flamme_stories_select on public.flamme_stories;
create policy flamme_stories_select on public.flamme_stories for select
using ((author_id=auth.uid()) or public.flamme_is_admin(auth.uid()) or (moderation_status='visible' and public.flamme_can_view_story(id,auth.uid())));

create index if not exists flamme_profiles_verified_idx on public.flamme_profiles(is_verified) where is_verified;
create index if not exists flamme_posts_visible_created_idx on public.flamme_posts(moderation_status, created_at desc);
create index if not exists flamme_forum_topics_visible_updated_idx on public.flamme_forum_topics(moderation_status, updated_at desc);

-- Flamme Social — finition produit : stories, sondages, reactions riches et medias prives.

alter table public.flamme_profiles
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists show_online boolean not null default true;

alter table public.flamme_reactions drop constraint if exists flamme_reactions_reaction_check;
alter table public.flamme_reactions
  add constraint flamme_reactions_reaction_check
  check (reaction in ('like','love','laugh','wow','sad','support'));

alter table public.flamme_post_media
  add column if not exists bucket text not null default 'flamme-media';
alter table public.flamme_post_media drop constraint if exists flamme_post_media_bucket_check;
alter table public.flamme_post_media
  add constraint flamme_post_media_bucket_check
  check (bucket in ('flamme-media','flamme-private-media'));

create table if not exists public.flamme_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.flamme_profiles(id) on delete cascade,
  text text not null default '',
  background text not null default '#CE654B',
  visibility text not null default 'public' check (visibility in ('public','contacts','only_me')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  updated_at timestamptz not null default now(),
  check (char_length(text) <= 1500),
  check (expires_at > created_at)
);

create table if not exists public.flamme_story_media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.flamme_stories(id) on delete cascade,
  path text not null,
  bucket text not null default 'flamme-private-media' check (bucket = 'flamme-private-media'),
  media_type text not null check (media_type in ('image','video')),
  created_at timestamptz not null default now()
);

create table if not exists public.flamme_story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.flamme_stories(id) on delete cascade,
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique(story_id,user_id)
);

create table if not exists public.flamme_poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.flamme_posts(id) on delete cascade,
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  option_index integer not null check (option_index >= 0 and option_index < 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(post_id,user_id)
);

create index if not exists flamme_stories_active_idx on public.flamme_stories(expires_at desc, created_at desc);
create index if not exists flamme_stories_author_idx on public.flamme_stories(author_id, created_at desc);
create index if not exists flamme_story_media_story_idx on public.flamme_story_media(story_id);
create index if not exists flamme_story_views_story_idx on public.flamme_story_views(story_id);
create index if not exists flamme_poll_votes_post_idx on public.flamme_poll_votes(post_id);

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
  if not found or u is null or r.expires_at <= now() then return false; end if;
  if r.author_id=u then return true; end if;
  if public.flamme_is_blocked(u,r.author_id) then return false; end if;
  if r.visibility='public' then return true; end if;
  if r.visibility='contacts' then return public.flamme_is_contact(r.author_id,u); end if;
  return false;
end;
$$;

create or replace function public.flamme_valid_poll_vote(p uuid, u uuid, option_no integer)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare poll_data jsonb;
declare option_count integer;
begin
  if u is null or option_no < 0 or not public.flamme_can_view_post(p,u) then return false; end if;
  select poll into poll_data from public.flamme_posts where id=p;
  if poll_data is null or jsonb_typeof(poll_data->'options') <> 'array' then return false; end if;
  option_count := jsonb_array_length(poll_data->'options');
  return option_no < option_count and option_count between 2 and 8;
end;
$$;

create or replace function public.flamme_can_read_private_object(object_name text, u uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select u is not null and (
    exists (
      select 1 from public.flamme_post_media pm
      where pm.path=object_name and pm.bucket='flamme-private-media'
        and public.flamme_can_view_post(pm.post_id,u)
    )
    or exists (
      select 1 from public.flamme_story_media sm
      where sm.path=object_name and sm.bucket='flamme-private-media'
        and public.flamme_can_view_story(sm.story_id,u)
    )
  );
$$;

alter table public.flamme_stories enable row level security;
alter table public.flamme_story_media enable row level security;
alter table public.flamme_story_views enable row level security;
alter table public.flamme_poll_votes enable row level security;

create policy flamme_stories_select on public.flamme_stories for select to authenticated
  using (public.flamme_can_view_story(id,auth.uid()));
create policy flamme_stories_insert on public.flamme_stories for insert to authenticated
  with check (author_id=auth.uid());
create policy flamme_stories_update on public.flamme_stories for update to authenticated
  using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy flamme_stories_delete on public.flamme_stories for delete to authenticated
  using (author_id=auth.uid());

create policy flamme_story_media_select on public.flamme_story_media for select to authenticated
  using (public.flamme_can_view_story(story_id,auth.uid()));
create policy flamme_story_media_insert on public.flamme_story_media for insert to authenticated
  with check (exists(select 1 from public.flamme_stories s where s.id=story_id and s.author_id=auth.uid()));
create policy flamme_story_media_delete on public.flamme_story_media for delete to authenticated
  using (exists(select 1 from public.flamme_stories s where s.id=story_id and s.author_id=auth.uid()));

create policy flamme_story_views_select on public.flamme_story_views for select to authenticated
  using (user_id=auth.uid() or exists(select 1 from public.flamme_stories s where s.id=story_id and s.author_id=auth.uid()));
create policy flamme_story_views_insert on public.flamme_story_views for insert to authenticated
  with check (user_id=auth.uid() and public.flamme_can_view_story(story_id,auth.uid()));
create policy flamme_story_views_update on public.flamme_story_views for update to authenticated
  using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy flamme_poll_votes_select on public.flamme_poll_votes for select to authenticated
  using (public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_poll_votes_insert on public.flamme_poll_votes for insert to authenticated
  with check (user_id=auth.uid() and public.flamme_valid_poll_vote(post_id,auth.uid(),option_index));
create policy flamme_poll_votes_update on public.flamme_poll_votes for update to authenticated
  using (user_id=auth.uid()) with check (user_id=auth.uid() and public.flamme_valid_poll_vote(post_id,auth.uid(),option_index));
create policy flamme_poll_votes_delete on public.flamme_poll_votes for delete to authenticated
  using (user_id=auth.uid());

create trigger flamme_stories_touch before update on public.flamme_stories
for each row execute function public.flamme_touch_updated_at();
create trigger flamme_poll_votes_touch before update on public.flamme_poll_votes
for each row execute function public.flamme_touch_updated_at();

alter table public.flamme_notifications drop constraint if exists flamme_notifications_kind_check;
alter table public.flamme_notifications
  add constraint flamme_notifications_kind_check
  check (kind in ('reaction','comment','reply','follow','follow_request','group_invite','group_request','message','event','story','mention'));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('flamme-private-media','flamme-private-media',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']::text[])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists flamme_private_media_select on storage.objects;
drop policy if exists flamme_private_media_insert on storage.objects;
drop policy if exists flamme_private_media_update on storage.objects;
drop policy if exists flamme_private_media_delete on storage.objects;

create policy flamme_private_media_select on storage.objects for select to authenticated
using (
  bucket_id='flamme-private-media' and (
    (storage.foldername(name))[1]=auth.uid()::text
    or public.flamme_can_read_private_object(name,auth.uid())
  )
);
create policy flamme_private_media_insert on storage.objects for insert to authenticated
with check (bucket_id='flamme-private-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy flamme_private_media_update on storage.objects for update to authenticated
using (bucket_id='flamme-private-media' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='flamme-private-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy flamme_private_media_delete on storage.objects for delete to authenticated
using (bucket_id='flamme-private-media' and (storage.foldername(name))[1]=auth.uid()::text);

revoke all on public.flamme_stories, public.flamme_story_media, public.flamme_story_views, public.flamme_poll_votes from anon;
grant select,insert,update,delete on public.flamme_stories, public.flamme_story_views, public.flamme_poll_votes to authenticated;
grant select,insert,delete on public.flamme_story_media to authenticated;
grant execute on function public.flamme_can_view_story(uuid,uuid), public.flamme_valid_poll_vote(uuid,uuid,integer), public.flamme_can_read_private_object(text,uuid) to authenticated;

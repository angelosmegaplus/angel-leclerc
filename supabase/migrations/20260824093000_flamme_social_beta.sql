-- Flamme social beta — isolated social schema.
-- Social identities use auth.users only as authentication anchors. No Angel OS roles are granted here.

create extension if not exists pgcrypto;

create table if not exists public.flamme_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_path text,
  cover_path text,
  city text check (city is null or char_length(city) <= 100),
  website text check (website is null or char_length(website) <= 300),
  is_private boolean not null default false,
  allow_messages text not null default 'contacts' check (allow_messages in ('everyone','contacts','nobody')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flamme_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.flamme_profiles(id) on delete cascade,
  blocked_id uuid not null references public.flamme_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.flamme_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.flamme_profiles(id) on delete cascade,
  following_id uuid not null references public.flamme_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.flamme_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.flamme_profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 2000),
  image_path text,
  visibility text not null default 'public' check (visibility in ('public','private','invite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flamme_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.flamme_groups(id) on delete cascade,
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','moderator','member')),
  status text not null default 'active' check (status in ('active','requested','invited')),
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.flamme_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.flamme_profiles(id) on delete cascade,
  group_id uuid references public.flamme_groups(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 5000),
  kind text not null default 'post' check (kind in ('post','video')),
  poll jsonb,
  visibility text not null default 'public' check (visibility in ('public','contacts','only_me')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(content)) > 0 or kind = 'video')
);

create table if not exists public.flamme_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.flamme_posts(id) on delete cascade,
  path text not null,
  media_type text not null check (media_type in ('image','video')),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.flamme_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.flamme_posts(id) on delete cascade,
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  reaction text not null default 'like' check (reaction = 'like'),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.flamme_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.flamme_posts(id) on delete cascade,
  author_id uuid not null references public.flamme_profiles(id) on delete cascade,
  parent_id uuid references public.flamme_comments(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flamme_saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  post_id uuid not null references public.flamme_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.flamme_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group')),
  title text check (title is null or char_length(title) <= 100),
  created_by uuid not null references public.flamme_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.flamme_conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.flamme_conversations(id) on delete cascade,
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

create table if not exists public.flamme_device_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  label text not null default 'Cet appareil' check (char_length(label) <= 80),
  public_jwk jsonb not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.flamme_conversation_keys (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.flamme_conversations(id) on delete cascade,
  recipient_user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  recipient_device_id uuid not null references public.flamme_device_keys(id) on delete cascade,
  sender_device_id uuid not null references public.flamme_device_keys(id) on delete cascade,
  wrapped_key text not null,
  iv text not null,
  created_at timestamptz not null default now(),
  unique (conversation_id, recipient_device_id)
);

create table if not exists public.flamme_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.flamme_conversations(id) on delete cascade,
  sender_id uuid not null references public.flamme_profiles(id) on delete cascade,
  sender_device_id uuid not null references public.flamme_device_keys(id) on delete restrict,
  ciphertext text not null,
  iv text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.flamme_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  actor_id uuid references public.flamme_profiles(id) on delete set null,
  kind text not null check (kind in ('reaction','comment','follow','follow_request','group_invite','message','event')),
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.flamme_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.flamme_profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile','post','comment','group','message')),
  target_id uuid not null,
  reason text not null check (reason in ('spam','harassment','hate','sexual','violence','impersonation','other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','reviewed','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.flamme_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.flamme_profiles(id) on delete cascade,
  group_id uuid references public.flamme_groups(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  description text not null default '' check (char_length(description) <= 3000),
  starts_at timestamptz not null,
  place text check (place is null or char_length(place) <= 200),
  image_path text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flamme_event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.flamme_events(id) on delete cascade,
  user_id uuid not null references public.flamme_profiles(id) on delete cascade,
  status text not null check (status in ('going','maybe','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists flamme_posts_created_idx on public.flamme_posts(created_at desc);
create index if not exists flamme_posts_author_idx on public.flamme_posts(author_id, created_at desc);
create index if not exists flamme_posts_group_idx on public.flamme_posts(group_id, created_at desc);
create index if not exists flamme_comments_post_idx on public.flamme_comments(post_id, created_at);
create index if not exists flamme_reactions_post_idx on public.flamme_reactions(post_id);
create index if not exists flamme_follows_following_idx on public.flamme_follows(following_id, status);
create index if not exists flamme_follows_follower_idx on public.flamme_follows(follower_id, status);
create index if not exists flamme_messages_conversation_idx on public.flamme_messages(conversation_id, created_at);
create index if not exists flamme_notifications_user_idx on public.flamme_notifications(user_id, created_at desc);
create index if not exists flamme_events_start_idx on public.flamme_events(starts_at);

create or replace function public.flamme_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.flamme_is_contact(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.flamme_follows f1
    join public.flamme_follows f2
      on f2.follower_id = f1.following_id and f2.following_id = f1.follower_id
    where f1.follower_id = a and f1.following_id = b
      and f1.status = 'accepted' and f2.status = 'accepted'
  );
$$;

create or replace function public.flamme_is_group_member(g uuid, u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.flamme_group_members m
    where m.group_id = g and m.user_id = u and m.status = 'active'
  );
$$;

create or replace function public.flamme_is_group_moderator(g uuid, u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.flamme_group_members m
    where m.group_id = g and m.user_id = u and m.status = 'active' and m.role in ('owner','moderator')
  );
$$;

create or replace function public.flamme_is_conversation_member(c uuid, u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.flamme_conversation_members m
    where m.conversation_id = c and m.user_id = u
  );
$$;

create or replace function public.flamme_can_view_post(p uuid, u uuid default auth.uid())
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare r public.flamme_posts%rowtype; gvis text;
begin
  select * into r from public.flamme_posts where id = p;
  if not found or u is null then return false; end if;
  if r.author_id = u then return true; end if;
  if exists(select 1 from public.flamme_blocks where (blocker_id=u and blocked_id=r.author_id) or (blocker_id=r.author_id and blocked_id=u)) then return false; end if;
  if r.group_id is not null then
    if public.flamme_is_group_member(r.group_id, u) then return true; end if;
    select visibility into gvis from public.flamme_groups where id = r.group_id;
    return gvis = 'public' and r.visibility = 'public';
  end if;
  if r.visibility = 'public' then return true; end if;
  if r.visibility = 'contacts' then return public.flamme_is_contact(r.author_id, u); end if;
  return false;
end;
$$;

create or replace function public.flamme_can_view_event(e uuid, u uuid default auth.uid())
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare r public.flamme_events%rowtype;
begin
  select * into r from public.flamme_events where id = e;
  if not found or u is null then return false; end if;
  if r.creator_id = u or r.visibility = 'public' then return true; end if;
  if r.group_id is not null and public.flamme_is_group_member(r.group_id, u) then return true; end if;
  return false;
end;
$$;

create or replace function public.flamme_add_group_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.flamme_group_members(group_id,user_id,role,status)
  values(new.id,new.owner_id,'owner','active') on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists flamme_profiles_touch on public.flamme_profiles;
create trigger flamme_profiles_touch before update on public.flamme_profiles for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_follows_touch on public.flamme_follows;
create trigger flamme_follows_touch before update on public.flamme_follows for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_groups_touch on public.flamme_groups;
create trigger flamme_groups_touch before update on public.flamme_groups for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_posts_touch on public.flamme_posts;
create trigger flamme_posts_touch before update on public.flamme_posts for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_comments_touch on public.flamme_comments;
create trigger flamme_comments_touch before update on public.flamme_comments for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_events_touch on public.flamme_events;
create trigger flamme_events_touch before update on public.flamme_events for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_event_attendees_touch on public.flamme_event_attendees;
create trigger flamme_event_attendees_touch before update on public.flamme_event_attendees for each row execute function public.flamme_touch_updated_at();
drop trigger if exists flamme_group_owner_trigger on public.flamme_groups;
create trigger flamme_group_owner_trigger after insert on public.flamme_groups for each row execute function public.flamme_add_group_owner();

alter table public.flamme_profiles enable row level security;
alter table public.flamme_blocks enable row level security;
alter table public.flamme_follows enable row level security;
alter table public.flamme_groups enable row level security;
alter table public.flamme_group_members enable row level security;
alter table public.flamme_posts enable row level security;
alter table public.flamme_post_media enable row level security;
alter table public.flamme_reactions enable row level security;
alter table public.flamme_comments enable row level security;
alter table public.flamme_saved_items enable row level security;
alter table public.flamme_conversations enable row level security;
alter table public.flamme_conversation_members enable row level security;
alter table public.flamme_device_keys enable row level security;
alter table public.flamme_conversation_keys enable row level security;
alter table public.flamme_messages enable row level security;
alter table public.flamme_notifications enable row level security;
alter table public.flamme_reports enable row level security;
alter table public.flamme_events enable row level security;
alter table public.flamme_event_attendees enable row level security;

create policy flamme_profiles_select on public.flamme_profiles for select to authenticated using (
  not exists(select 1 from public.flamme_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=id) or (b.blocker_id=id and b.blocked_id=auth.uid()))
  or id = auth.uid()
);
create policy flamme_profiles_insert on public.flamme_profiles for insert to authenticated with check (id = auth.uid());
create policy flamme_profiles_update on public.flamme_profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy flamme_profiles_delete on public.flamme_profiles for delete to authenticated using (id=auth.uid());

create policy flamme_blocks_select on public.flamme_blocks for select to authenticated using (blocker_id=auth.uid());
create policy flamme_blocks_insert on public.flamme_blocks for insert to authenticated with check (blocker_id=auth.uid());
create policy flamme_blocks_delete on public.flamme_blocks for delete to authenticated using (blocker_id=auth.uid());

create policy flamme_follows_select on public.flamme_follows for select to authenticated using (follower_id=auth.uid() or following_id=auth.uid());
create policy flamme_follows_insert on public.flamme_follows for insert to authenticated with check (follower_id=auth.uid());
create policy flamme_follows_update on public.flamme_follows for update to authenticated using (follower_id=auth.uid() or following_id=auth.uid()) with check (follower_id=auth.uid() or following_id=auth.uid());
create policy flamme_follows_delete on public.flamme_follows for delete to authenticated using (follower_id=auth.uid() or following_id=auth.uid());

create policy flamme_groups_select on public.flamme_groups for select to authenticated using (visibility='public' or owner_id=auth.uid() or public.flamme_is_group_member(id,auth.uid()));
create policy flamme_groups_insert on public.flamme_groups for insert to authenticated with check (owner_id=auth.uid());
create policy flamme_groups_update on public.flamme_groups for update to authenticated using (owner_id=auth.uid() or public.flamme_is_group_moderator(id,auth.uid())) with check (owner_id=auth.uid() or public.flamme_is_group_moderator(id,auth.uid()));
create policy flamme_groups_delete on public.flamme_groups for delete to authenticated using (owner_id=auth.uid());

create policy flamme_group_members_select on public.flamme_group_members for select to authenticated using (user_id=auth.uid() or public.flamme_is_group_member(group_id,auth.uid()) or exists(select 1 from public.flamme_groups g where g.id=group_id and g.visibility='public'));
create policy flamme_group_members_insert on public.flamme_group_members for insert to authenticated with check (
  (user_id=auth.uid() and role='member') or public.flamme_is_group_moderator(group_id,auth.uid())
);
create policy flamme_group_members_update on public.flamme_group_members for update to authenticated using (user_id=auth.uid() or public.flamme_is_group_moderator(group_id,auth.uid())) with check (user_id=auth.uid() or public.flamme_is_group_moderator(group_id,auth.uid()));
create policy flamme_group_members_delete on public.flamme_group_members for delete to authenticated using (user_id=auth.uid() or public.flamme_is_group_moderator(group_id,auth.uid()));

create policy flamme_posts_select on public.flamme_posts for select to authenticated using (public.flamme_can_view_post(id,auth.uid()));
create policy flamme_posts_insert on public.flamme_posts for insert to authenticated with check (author_id=auth.uid() and (group_id is null or public.flamme_is_group_member(group_id,auth.uid())));
create policy flamme_posts_update on public.flamme_posts for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy flamme_posts_delete on public.flamme_posts for delete to authenticated using (author_id=auth.uid() or (group_id is not null and public.flamme_is_group_moderator(group_id,auth.uid())));

create policy flamme_post_media_select on public.flamme_post_media for select to authenticated using (public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_post_media_insert on public.flamme_post_media for insert to authenticated with check (exists(select 1 from public.flamme_posts p where p.id=post_id and p.author_id=auth.uid()));
create policy flamme_post_media_delete on public.flamme_post_media for delete to authenticated using (exists(select 1 from public.flamme_posts p where p.id=post_id and p.author_id=auth.uid()));

create policy flamme_reactions_select on public.flamme_reactions for select to authenticated using (public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_reactions_insert on public.flamme_reactions for insert to authenticated with check (user_id=auth.uid() and public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_reactions_delete on public.flamme_reactions for delete to authenticated using (user_id=auth.uid());

create policy flamme_comments_select on public.flamme_comments for select to authenticated using (public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_comments_insert on public.flamme_comments for insert to authenticated with check (author_id=auth.uid() and public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_comments_update on public.flamme_comments for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy flamme_comments_delete on public.flamme_comments for delete to authenticated using (author_id=auth.uid());

create policy flamme_saved_select on public.flamme_saved_items for select to authenticated using (user_id=auth.uid());
create policy flamme_saved_insert on public.flamme_saved_items for insert to authenticated with check (user_id=auth.uid() and public.flamme_can_view_post(post_id,auth.uid()));
create policy flamme_saved_delete on public.flamme_saved_items for delete to authenticated using (user_id=auth.uid());

create policy flamme_conversations_select on public.flamme_conversations for select to authenticated using (created_by=auth.uid() or public.flamme_is_conversation_member(id,auth.uid()));
create policy flamme_conversations_insert on public.flamme_conversations for insert to authenticated with check (created_by=auth.uid());
create policy flamme_conversations_update on public.flamme_conversations for update to authenticated using (created_by=auth.uid()) with check (created_by=auth.uid());
create policy flamme_conversations_delete on public.flamme_conversations for delete to authenticated using (created_by=auth.uid());

create policy flamme_conversation_members_select on public.flamme_conversation_members for select to authenticated using (user_id=auth.uid() or public.flamme_is_conversation_member(conversation_id,auth.uid()));
create policy flamme_conversation_members_insert on public.flamme_conversation_members for insert to authenticated with check (user_id=auth.uid() or exists(select 1 from public.flamme_conversations c where c.id=conversation_id and c.created_by=auth.uid()));
create policy flamme_conversation_members_update on public.flamme_conversation_members for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy flamme_conversation_members_delete on public.flamme_conversation_members for delete to authenticated using (user_id=auth.uid() or exists(select 1 from public.flamme_conversations c where c.id=conversation_id and c.created_by=auth.uid()));

create policy flamme_device_keys_select on public.flamme_device_keys for select to authenticated using (true);
create policy flamme_device_keys_insert on public.flamme_device_keys for insert to authenticated with check (user_id=auth.uid());
create policy flamme_device_keys_update on public.flamme_device_keys for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy flamme_device_keys_delete on public.flamme_device_keys for delete to authenticated using (user_id=auth.uid());

create policy flamme_conversation_keys_select on public.flamme_conversation_keys for select to authenticated using (recipient_user_id=auth.uid());
create policy flamme_conversation_keys_insert on public.flamme_conversation_keys for insert to authenticated with check (
  public.flamme_is_conversation_member(conversation_id,auth.uid()) and exists(select 1 from public.flamme_device_keys d where d.id=sender_device_id and d.user_id=auth.uid())
);
create policy flamme_conversation_keys_delete on public.flamme_conversation_keys for delete to authenticated using (recipient_user_id=auth.uid());

create policy flamme_messages_select on public.flamme_messages for select to authenticated using (public.flamme_is_conversation_member(conversation_id,auth.uid()));
create policy flamme_messages_insert on public.flamme_messages for insert to authenticated with check (sender_id=auth.uid() and public.flamme_is_conversation_member(conversation_id,auth.uid()) and exists(select 1 from public.flamme_device_keys d where d.id=sender_device_id and d.user_id=auth.uid()));
create policy flamme_messages_delete on public.flamme_messages for delete to authenticated using (sender_id=auth.uid());

create policy flamme_notifications_select on public.flamme_notifications for select to authenticated using (user_id=auth.uid());
create policy flamme_notifications_insert on public.flamme_notifications for insert to authenticated with check (actor_id=auth.uid() and user_id<>auth.uid());
create policy flamme_notifications_update on public.flamme_notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy flamme_notifications_delete on public.flamme_notifications for delete to authenticated using (user_id=auth.uid());

create policy flamme_reports_select on public.flamme_reports for select to authenticated using (reporter_id=auth.uid());
create policy flamme_reports_insert on public.flamme_reports for insert to authenticated with check (reporter_id=auth.uid());

create policy flamme_events_select on public.flamme_events for select to authenticated using (public.flamme_can_view_event(id,auth.uid()));
create policy flamme_events_insert on public.flamme_events for insert to authenticated with check (creator_id=auth.uid() and (group_id is null or public.flamme_is_group_member(group_id,auth.uid())));
create policy flamme_events_update on public.flamme_events for update to authenticated using (creator_id=auth.uid()) with check (creator_id=auth.uid());
create policy flamme_events_delete on public.flamme_events for delete to authenticated using (creator_id=auth.uid());

create policy flamme_event_attendees_select on public.flamme_event_attendees for select to authenticated using (public.flamme_can_view_event(event_id,auth.uid()));
create policy flamme_event_attendees_insert on public.flamme_event_attendees for insert to authenticated with check (user_id=auth.uid() and public.flamme_can_view_event(event_id,auth.uid()));
create policy flamme_event_attendees_update on public.flamme_event_attendees for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy flamme_event_attendees_delete on public.flamme_event_attendees for delete to authenticated using (user_id=auth.uid());

revoke all on public.flamme_profiles, public.flamme_blocks, public.flamme_follows, public.flamme_groups, public.flamme_group_members, public.flamme_posts, public.flamme_post_media, public.flamme_reactions, public.flamme_comments, public.flamme_saved_items, public.flamme_conversations, public.flamme_conversation_members, public.flamme_device_keys, public.flamme_conversation_keys, public.flamme_messages, public.flamme_notifications, public.flamme_reports, public.flamme_events, public.flamme_event_attendees from anon;
grant select, insert, update, delete on public.flamme_profiles, public.flamme_blocks, public.flamme_follows, public.flamme_groups, public.flamme_group_members, public.flamme_posts, public.flamme_post_media, public.flamme_reactions, public.flamme_comments, public.flamme_saved_items, public.flamme_conversations, public.flamme_conversation_members, public.flamme_device_keys, public.flamme_conversation_keys, public.flamme_messages, public.flamme_notifications, public.flamme_reports, public.flamme_events, public.flamme_event_attendees to authenticated;
grant execute on function public.flamme_is_contact(uuid,uuid), public.flamme_is_group_member(uuid,uuid), public.flamme_is_group_moderator(uuid,uuid), public.flamme_is_conversation_member(uuid,uuid), public.flamme_can_view_post(uuid,uuid), public.flamme_can_view_event(uuid,uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('flamme-avatars','flamme-avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('flamme-media','flamme-media',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy flamme_avatar_upload_own on storage.objects for insert to authenticated with check (bucket_id='flamme-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy flamme_avatar_update_own on storage.objects for update to authenticated using (bucket_id='flamme-avatars' and owner_id=auth.uid()::text) with check (bucket_id='flamme-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy flamme_avatar_delete_own on storage.objects for delete to authenticated using (bucket_id='flamme-avatars' and owner_id=auth.uid()::text);
create policy flamme_media_upload_own on storage.objects for insert to authenticated with check (bucket_id='flamme-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy flamme_media_update_own on storage.objects for update to authenticated using (bucket_id='flamme-media' and owner_id=auth.uid()::text) with check (bucket_id='flamme-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy flamme_media_delete_own on storage.objects for delete to authenticated using (bucket_id='flamme-media' and owner_id=auth.uid()::text);

do $$ begin
  alter publication supabase_realtime add table public.flamme_messages;
exception when duplicate_object then null;
end $$;

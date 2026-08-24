-- Flamme : l'onglet Groupes devient un forum de discussions.
-- Les conversations de groupe instantanees restent dans la messagerie chiffree.

create table if not exists public.flamme_forum_topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.flamme_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 1 and 12000),
  category text not null default 'Général' check (category in ('Général','Aide','Culture','Actualité','Technique','Autres')),
  is_locked boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flamme_forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.flamme_forum_topics(id) on delete cascade,
  author_id uuid not null references public.flamme_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  reply_to_id uuid null references public.flamme_forum_replies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flamme_forum_topics_updated_idx on public.flamme_forum_topics(is_pinned desc, updated_at desc);
create index if not exists flamme_forum_topics_category_idx on public.flamme_forum_topics(category, updated_at desc);
create index if not exists flamme_forum_replies_topic_idx on public.flamme_forum_replies(topic_id, created_at asc);

alter table public.flamme_forum_topics enable row level security;
alter table public.flamme_forum_replies enable row level security;

drop policy if exists flamme_forum_topics_select on public.flamme_forum_topics;
drop policy if exists flamme_forum_topics_insert on public.flamme_forum_topics;
drop policy if exists flamme_forum_topics_update on public.flamme_forum_topics;
drop policy if exists flamme_forum_topics_delete on public.flamme_forum_topics;
create policy flamme_forum_topics_select on public.flamme_forum_topics for select to authenticated using (true);
create policy flamme_forum_topics_insert on public.flamme_forum_topics for insert to authenticated with check (author_id=auth.uid());
create policy flamme_forum_topics_update on public.flamme_forum_topics for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy flamme_forum_topics_delete on public.flamme_forum_topics for delete to authenticated using (author_id=auth.uid());

drop policy if exists flamme_forum_replies_select on public.flamme_forum_replies;
drop policy if exists flamme_forum_replies_insert on public.flamme_forum_replies;
drop policy if exists flamme_forum_replies_update on public.flamme_forum_replies;
drop policy if exists flamme_forum_replies_delete on public.flamme_forum_replies;
create policy flamme_forum_replies_select on public.flamme_forum_replies for select to authenticated using (true);
create policy flamme_forum_replies_insert on public.flamme_forum_replies for insert to authenticated with check (
  author_id=auth.uid()
  and exists(select 1 from public.flamme_forum_topics t where t.id=topic_id and not t.is_locked)
);
create policy flamme_forum_replies_update on public.flamme_forum_replies for update to authenticated using (author_id=auth.uid()) with check (author_id=auth.uid());
create policy flamme_forum_replies_delete on public.flamme_forum_replies for delete to authenticated using (author_id=auth.uid());

create or replace function public.flamme_touch_forum_topic()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.flamme_forum_topics
  set updated_at=now()
  where id=coalesce(new.topic_id,old.topic_id);
  return coalesce(new,old);
end;
$$;

drop trigger if exists flamme_touch_forum_topic_trigger on public.flamme_forum_replies;
create trigger flamme_touch_forum_topic_trigger
  after insert or update or delete on public.flamme_forum_replies
  for each row execute function public.flamme_touch_forum_topic();

grant select,insert,update,delete on public.flamme_forum_topics, public.flamme_forum_replies to authenticated;

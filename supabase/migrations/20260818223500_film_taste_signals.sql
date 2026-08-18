create table if not exists public.film_taste_signals (
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_id text not null,
  media_type text not null check (media_type in ('movie','tv')),
  genre_ids jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  people jsonb not null default '[]'::jsonb,
  director text,
  release_year integer,
  completion double precision not null default 0,
  seen boolean,
  liked boolean,
  rejected boolean,
  rating smallint check (rating between 1 and 5),
  style_fit text check (style_fit in ('yes','mixed','no')),
  updated_at timestamptz not null default now(),
  primary key (user_id, candidate_id)
);

alter table public.film_taste_signals enable row level security;

drop policy if exists film_taste_select_own on public.film_taste_signals;
create policy film_taste_select_own on public.film_taste_signals for select to authenticated using (auth.uid() = user_id);

drop policy if exists film_taste_insert_own on public.film_taste_signals;
create policy film_taste_insert_own on public.film_taste_signals for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists film_taste_update_own on public.film_taste_signals;
create policy film_taste_update_own on public.film_taste_signals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists film_taste_delete_own on public.film_taste_signals;
create policy film_taste_delete_own on public.film_taste_signals for delete to authenticated using (auth.uid() = user_id);

create index if not exists film_taste_signals_user_updated_idx on public.film_taste_signals(user_id, updated_at desc);

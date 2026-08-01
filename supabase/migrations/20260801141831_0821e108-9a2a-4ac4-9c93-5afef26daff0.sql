
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'Actualité',
  excerpt text,
  content text not null default '',
  cover_url text,
  published boolean not null default false,
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;

alter table public.articles enable row level security;

create policy "Anyone can read published articles" on public.articles
  for select to anon, authenticated using (published = true);
create policy "Admins can read all articles" on public.articles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert articles" on public.articles
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update articles" on public.articles
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete articles" on public.articles
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create index articles_published_idx on public.articles (published, published_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger articles_updated_at before update on public.articles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) in ('contact@angel-leclerc.fr', 'angel.leclerc@icloud.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function public.handle_new_user_role();

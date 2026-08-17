-- Repair production databases where angel_os_cache was created before the
-- canonical runtime-cache migration but without all required columns.
-- This migration is deliberately idempotent and preserves every existing row.

create table if not exists public.angel_os_cache (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.angel_os_cache
  add column if not exists key text,
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

-- Never overwrite a healthy payload. Only complete values that cannot satisfy
-- the runtime contract yet.
update public.angel_os_cache
set payload = '{}'::jsonb
where payload is null;

update public.angel_os_cache
set updated_at = now()
where updated_at is null;

-- A malformed legacy table may already contain rows. Give those rows unique
-- internal keys instead of deleting them so no historical runtime state is lost.
update public.angel_os_cache
set key = 'legacy-' || md5(random()::text || clock_timestamp()::text || ctid::text)
where key is null or btrim(key) = '';

alter table public.angel_os_cache
  alter column key set not null,
  alter column payload set default '{}'::jsonb,
  alter column payload set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

create unique index if not exists angel_os_cache_key_unique
  on public.angel_os_cache (key);

create index if not exists angel_os_cache_updated_at_idx
  on public.angel_os_cache (updated_at desc);

comment on table public.angel_os_cache is
  'Private durable key/value and workflow state for Angel OS server runtime.';

alter table public.angel_os_cache enable row level security;
revoke all on table public.angel_os_cache from anon, authenticated;
grant all on table public.angel_os_cache to service_role;

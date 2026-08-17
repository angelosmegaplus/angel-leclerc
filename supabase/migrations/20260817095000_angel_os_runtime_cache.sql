-- Durable runtime cache used by Angel OS server functions.
-- Keep this migration idempotent because production/preview databases may be
-- created or restored independently.
create table if not exists public.angel_os_cache (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.angel_os_cache is
  'Private durable key/value and workflow state for Angel OS server runtime.';

alter table public.angel_os_cache enable row level security;

-- No anon/authenticated policy on purpose: this table is internal runtime
-- storage and is accessed server-side with the service-role client only.
revoke all on table public.angel_os_cache from anon, authenticated;
grant all on table public.angel_os_cache to service_role;

create index if not exists angel_os_cache_updated_at_idx
  on public.angel_os_cache (updated_at desc);

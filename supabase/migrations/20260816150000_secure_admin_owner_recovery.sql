create table if not exists public.admin_owner_recovery_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

grant all on public.admin_owner_recovery_attempts to service_role;
revoke all on public.admin_owner_recovery_attempts from anon, authenticated;
alter table public.admin_owner_recovery_attempts enable row level security;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end; $$;

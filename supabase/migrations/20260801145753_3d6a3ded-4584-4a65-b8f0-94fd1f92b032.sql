insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users
where lower(email) = 'angelleclerc2006@gmail.com'
on conflict (user_id, role) do nothing;

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if lower(new.email) in ('contact@angel-leclerc.fr', 'angel.leclerc@icloud.com', 'angelleclerc2006@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;
  return new;
end; $function$;

revoke execute on function public.handle_new_user_role() from public, anon, authenticated;
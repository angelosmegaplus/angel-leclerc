-- Hardening after first beta pass: block semantics, private group membership, and message permissions.

create or replace function public.flamme_is_blocked(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.flamme_blocks x
    where (x.blocker_id = a and x.blocked_id = b)
       or (x.blocker_id = b and x.blocked_id = a)
  );
$$;

create or replace function public.flamme_can_message(sender uuid, recipient uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare mode text;
begin
  if sender is null or recipient is null or sender = recipient then return false; end if;
  if public.flamme_is_blocked(sender, recipient) then return false; end if;
  select allow_messages into mode from public.flamme_profiles where id = recipient;
  if mode is null or mode = 'nobody' then return false; end if;
  if mode = 'everyone' then return true; end if;
  return public.flamme_is_contact(sender, recipient);
end;
$$;

drop policy if exists flamme_profiles_select on public.flamme_profiles;
create policy flamme_profiles_select on public.flamme_profiles
for select to authenticated
using (id = auth.uid() or not public.flamme_is_blocked(auth.uid(), id));

drop policy if exists flamme_group_members_insert on public.flamme_group_members;
create policy flamme_group_members_insert on public.flamme_group_members
for insert to authenticated
with check (
  public.flamme_is_group_moderator(group_id, auth.uid())
  or (
    user_id = auth.uid()
    and role = 'member'
    and (
      exists (
        select 1 from public.flamme_groups g
        where g.id = group_id and g.visibility = 'public' and status in ('active','requested')
      )
      or exists (
        select 1 from public.flamme_groups g
        where g.id = group_id and g.visibility = 'private' and status = 'requested'
      )
    )
  )
);

drop policy if exists flamme_group_members_update on public.flamme_group_members;
create policy flamme_group_members_update on public.flamme_group_members
for update to authenticated
using (
  public.flamme_is_group_moderator(group_id, auth.uid())
  or (user_id = auth.uid() and status = 'invited' and role = 'member')
)
with check (
  public.flamme_is_group_moderator(group_id, auth.uid())
  or (user_id = auth.uid() and status = 'active' and role = 'member')
);

drop policy if exists flamme_conversation_members_insert on public.flamme_conversation_members;
create policy flamme_conversation_members_insert on public.flamme_conversation_members
for insert to authenticated
with check (
  user_id = auth.uid()
  or (
    exists (
      select 1 from public.flamme_conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
    and public.flamme_can_message(auth.uid(), user_id)
  )
);

grant execute on function public.flamme_is_blocked(uuid,uuid), public.flamme_can_message(uuid,uuid) to authenticated;

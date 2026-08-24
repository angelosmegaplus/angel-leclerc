-- Verrouillage final des elevations de privilege et demandes privees.

create or replace function public.flamme_is_group_owner(g uuid,u uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.flamme_groups where id=g and owner_id=u);
$$;

create or replace function public.flamme_expected_follow_status(target uuid)
returns text language sql stable security definer set search_path=public as $$
  select case when coalesce((select is_private from public.flamme_profiles where id=target),true) then 'pending' else 'accepted' end;
$$;

drop policy if exists flamme_follows_insert on public.flamme_follows;
drop policy if exists flamme_follows_update on public.flamme_follows;
create policy flamme_follows_insert on public.flamme_follows for insert to authenticated
with check (
  follower_id=auth.uid()
  and follower_id<>following_id
  and status=public.flamme_expected_follow_status(following_id)
  and not public.flamme_is_blocked(follower_id,following_id)
);
create policy flamme_follows_update on public.flamme_follows for update to authenticated
using (following_id=auth.uid() and status='pending')
with check (following_id=auth.uid() and status='accepted');

create or replace function public.flamme_lock_follow_identity()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.follower_id<>old.follower_id or new.following_id<>old.following_id then
    raise exception 'follow identity is immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists flamme_lock_follow_identity on public.flamme_follows;
create trigger flamme_lock_follow_identity before update on public.flamme_follows
for each row execute function public.flamme_lock_follow_identity();

drop policy if exists flamme_group_members_insert on public.flamme_group_members;
drop policy if exists flamme_group_members_update on public.flamme_group_members;
drop policy if exists flamme_group_members_delete on public.flamme_group_members;

create policy flamme_group_members_insert on public.flamme_group_members for insert to authenticated
with check (
  (public.flamme_is_group_owner(group_id,auth.uid()) and role in ('member','moderator') and status in ('active','invited'))
  or (public.flamme_is_group_moderator(group_id,auth.uid()) and not public.flamme_is_group_owner(group_id,auth.uid()) and role='member' and status in ('active','invited'))
  or (
    user_id=auth.uid() and role='member' and (
      exists(select 1 from public.flamme_groups g where g.id=group_id and g.visibility='public' and status in ('active','requested'))
      or exists(select 1 from public.flamme_groups g where g.id=group_id and g.visibility='private' and status='requested')
    )
  )
);

create policy flamme_group_members_update on public.flamme_group_members for update to authenticated
using (
  public.flamme_is_group_owner(group_id,auth.uid())
  or (public.flamme_is_group_moderator(group_id,auth.uid()) and not public.flamme_is_group_owner(group_id,auth.uid()) and role='member')
  or (user_id=auth.uid() and status='invited' and role='member')
)
with check (
  public.flamme_is_group_owner(group_id,auth.uid())
  or (public.flamme_is_group_moderator(group_id,auth.uid()) and not public.flamme_is_group_owner(group_id,auth.uid()) and role='member')
  or (user_id=auth.uid() and status='active' and role='member')
);

create policy flamme_group_members_delete on public.flamme_group_members for delete to authenticated
using (
  (user_id=auth.uid() and not public.flamme_is_group_owner(group_id,auth.uid()))
  or (public.flamme_is_group_owner(group_id,auth.uid()) and user_id<>auth.uid())
  or (public.flamme_is_group_moderator(group_id,auth.uid()) and not public.flamme_is_group_owner(group_id,auth.uid()) and role='member')
);

drop policy if exists flamme_conversation_keys_insert on public.flamme_conversation_keys;
create policy flamme_conversation_keys_insert on public.flamme_conversation_keys for insert to authenticated
with check (
  public.flamme_is_conversation_member(conversation_id,auth.uid())
  and exists(select 1 from public.flamme_device_keys sender where sender.id=sender_device_id and sender.user_id=auth.uid())
  and exists(
    select 1 from public.flamme_device_keys recipient
    join public.flamme_conversation_members member on member.user_id=recipient.user_id
    where recipient.id=recipient_device_id
      and recipient.user_id=recipient_user_id
      and member.conversation_id=conversation_id
  )
);

grant execute on function public.flamme_is_group_owner(uuid,uuid), public.flamme_expected_follow_status(uuid) to authenticated;

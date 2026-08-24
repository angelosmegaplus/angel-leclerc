create or replace function public.flamme_touch_forum_topic()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_topic uuid;
begin
  if tg_op='DELETE' then
    target_topic := old.topic_id;
    update public.flamme_forum_topics set updated_at=now() where id=target_topic;
    return old;
  else
    target_topic := new.topic_id;
    update public.flamme_forum_topics set updated_at=now() where id=target_topic;
    return new;
  end if;
end;
$$;

alter table public.flamme_notifications drop constraint if exists flamme_notifications_kind_check;
alter table public.flamme_notifications
  add constraint flamme_notifications_kind_check
  check(kind in ('reaction','comment','reply','follow','follow_request','group_invite','group_request','message','event','story','mention','forum_reply'));

-- Les médias du bucket flamme-media (désormais privé) sont servis par URLs signées
-- uniquement si la publication est visible par le demandeur.
create or replace function public.flamme_can_read_private_object(object_name text, u uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select u is not null and (
    exists (
      select 1 from public.flamme_post_media pm
      where pm.path=object_name and pm.bucket in ('flamme-private-media','flamme-media')
        and public.flamme_can_view_post(pm.post_id,u)
    )
    or exists (
      select 1 from public.flamme_story_media sm
      where sm.path=object_name and sm.bucket='flamme-private-media'
        and public.flamme_can_view_story(sm.story_id,u)
    )
  );
$$;

grant execute on function public.flamme_can_read_private_object(text,uuid) to authenticated;

drop policy if exists flamme_media_select on storage.objects;
create policy flamme_media_select on storage.objects for select to authenticated
using (
  bucket_id='flamme-media' and (
    (storage.foldername(name))[1]=auth.uid()::text
    or public.flamme_can_read_private_object(name,auth.uid())
  )
);
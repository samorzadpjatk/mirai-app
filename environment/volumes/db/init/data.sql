-- Allow authenticated users to insert/update/delete any objects in image/video buckets.
alter table storage.objects enable row level security;

drop policy if exists "storage_objects_auth_insert_image_video_avatar" on storage.objects;
create policy "storage_objects_auth_insert_image_video"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('image', 'video', 'avatar'));

drop policy if exists "storage_objects_auth_update_image_video_avatar" on storage.objects;
create policy "storage_objects_auth_update_image_video"
on storage.objects
for update
to authenticated
using (bucket_id in ('image', 'video'))
with check (bucket_id in ('image', 'video', 'avatar'));

drop policy if exists "storage_objects_auth_delete_image_video_avatar" on storage.objects;
create policy "storage_objects_auth_delete_image_video_avatar"
on storage.objects
for delete
to authenticated
using (bucket_id in ('image', 'video', 'avatar'));
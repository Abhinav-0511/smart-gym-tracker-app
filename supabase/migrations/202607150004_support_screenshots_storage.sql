-- Private storage for optional support-ticket screenshots. Mirrors the avatar
-- bucket: owner-scoped paths (<uid>/<file>), read by the owner or any admin,
-- clients resolve short-lived signed URLs after authentication.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'support-screenshots',
  'support-screenshots',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Owner or admin can read a screenshot.
create policy "Read own or admin support screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'support-screenshots'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);

-- Users upload only under their own uid/ prefix.
create policy "Users upload their own support screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'support-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 1
);

-- Users may remove their own uploads.
create policy "Users delete their own support screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'support-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

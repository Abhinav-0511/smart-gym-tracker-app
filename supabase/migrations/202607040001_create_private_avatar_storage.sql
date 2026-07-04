-- Private, owner-scoped avatar storage. Profiles store only an object path;
-- clients resolve short-lived signed URLs after authentication.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 1
  and storage.filename(name) ~ '^[0-9a-f-]{36}\.webp$'
);

create policy "Users can replace their own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 1
  and storage.filename(name) ~ '^[0-9a-f-]{36}\.webp$'
);

create policy "Users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Remove legacy external URL references before enforcing private paths.
update public.profiles
set avatar_url = null
where avatar_url is not null
  and avatar_url !~ (
    '^' || id::text || '/[0-9a-f-]{36}\.webp$'
  );

alter table public.profiles
  drop constraint profiles_avatar_url_check,
  add constraint profiles_avatar_reference_check
  check (
    avatar_url is null
    or avatar_url ~ (
      '^' || id::text || '/[0-9a-f-]{36}\.webp$'
    )
  );

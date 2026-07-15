-- Let admins read every user's avatar.
--
-- The avatars bucket is private and its SELECT policy
-- ("Users can read their own avatars") only exposes objects under the caller's
-- own {auth.uid()}/ folder. The Admin dashboard/users list resolves signed URLs
-- for *other* users' avatars, so those createSignedUrl calls are denied by RLS
-- and fail with 400 (Bad Request), leaving admins with initials-only fallbacks.
--
-- Add an additive SELECT policy (policies are OR'd) that grants read access to
-- all avatars for admins, reusing the existing public.is_admin() helper. Write
-- policies are intentionally left owner-scoped: admins can view avatars but not
-- mutate other users' objects.

create policy "Admins can read all avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and public.is_admin()
);

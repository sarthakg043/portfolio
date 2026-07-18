-- Declarative diff does not currently capture Storage schema policies, bucket
-- DML, or every explicit function/sequence grant. Keep these reviewed caveats
-- in a versioned imperative migration.

revoke execute on function private.hook_restrict_admin_signup(jsonb)
  from public, anon, authenticated;
grant execute on function private.hook_restrict_admin_signup(jsonb)
  to supabase_auth_admin;

revoke execute on function private.register_admin_user()
  from public, anon, authenticated, supabase_auth_admin;
revoke execute on function private.is_admin()
  from public, anon;
grant execute on function private.is_admin()
  to authenticated;
revoke execute on function private.configure_admin_email(text)
  from public, anon, authenticated, service_role, supabase_auth_admin;
revoke execute on function private.set_updated_at()
  from public, anon, authenticated;

revoke all on table private.admin_config
  from public, anon, authenticated, service_role, supabase_auth_admin;
grant select on table private.admin_config
  to supabase_auth_admin;
revoke all on table private.admin_users
  from public, anon, authenticated;
grant usage, select on sequence public.article_revisions_id_seq
  to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('draft-media', 'draft-media', false, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf', 'application/zip']),
  ('blog-media', 'blog-media', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('blog-downloads', 'blog-downloads', true, 52428800,
    array['application/pdf', 'application/zip', 'text/plain', 'application/json']),
  ('portfolio-assets', 'portfolio-assets', true, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Administrator can read all managed storage objects"
on storage.objects for select
to authenticated
using (
  (select private.is_admin())
  and bucket_id in ('draft-media', 'blog-media', 'blog-downloads', 'portfolio-assets')
);

create policy "Administrator can upload managed storage objects"
on storage.objects for insert
to authenticated
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid()::text)
  and bucket_id in ('draft-media', 'blog-media', 'blog-downloads', 'portfolio-assets')
);

create policy "Administrator can update managed storage objects"
on storage.objects for update
to authenticated
using (
  (select private.is_admin())
  and owner_id = (select auth.uid()::text)
  and bucket_id in ('draft-media', 'blog-media', 'blog-downloads', 'portfolio-assets')
)
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid()::text)
  and bucket_id in ('draft-media', 'blog-media', 'blog-downloads', 'portfolio-assets')
);

create policy "Administrator can delete managed storage objects"
on storage.objects for delete
to authenticated
using (
  (select private.is_admin())
  and owner_id = (select auth.uid()::text)
  and bucket_id in ('draft-media', 'blog-media', 'blog-downloads', 'portfolio-assets')
);

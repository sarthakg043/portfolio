begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select extensions.plan(35);

select extensions.is(
  private.hook_restrict_admin_signup(
    '{"user":{"email":"admin@example.test","app_metadata":{"provider":"github"}}}'::jsonb
  ) #>> '{error,http_code}',
  '403',
  'The signup hook fails closed before an administrator email is configured'
);

select private.configure_admin_email('ADMIN@example.test');

select extensions.is(
  private.hook_restrict_admin_signup(
    '{"user":{"email":"admin@example.test","app_metadata":{"provider":"github"}}}'::jsonb
  ),
  '{}'::jsonb,
  'The configured administrator GitHub identity is accepted by the signup hook'
);

select extensions.is(
  private.hook_restrict_admin_signup(
    '{"user":{"email":"someone@example.com","app_metadata":{"provider":"github"}}}'::jsonb
  ) #>> '{error,http_code}',
  '403',
  'Every other email is rejected by the signup hook'
);

select extensions.is(
  private.hook_restrict_admin_signup(
    '{"user":{"email":"admin@example.test","app_metadata":{"provider":"email"}}}'::jsonb
  ) #>> '{error,http_code}',
  '403',
  'The administrator email is rejected unless authentication came from GitHub'
);

insert into auth.users (id, email, raw_app_meta_data, email_confirmed_at)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'admin@example.test',
    '{"provider":"github"}'::jsonb,
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'someone@example.com',
    '{"provider":"github"}'::jsonb,
    now()
  );

insert into auth.sessions (id, user_id, not_after)
values
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    now() + interval '1 hour'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    now() + interval '1 hour'
  );

select extensions.results_eq(
  $$select email from private.admin_users order by email$$,
  $$values ('admin@example.test'::text)$$,
  'Only the configured administrator is registered by the auth.users trigger'
);

select extensions.is(
  (select count(*) from private.admin_users where user_id = '22222222-2222-4222-8222-222222222222'),
  0::bigint,
  'An unauthorized authenticated user is absent from the administrator registry'
);

insert into public.articles (
  id,
  author_id,
  title,
  slug,
  status,
  published_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'Public post',
    'public-post',
    'published',
    now()
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '11111111-1111-4111-8111-111111111111',
    'Private draft',
    'private-draft',
    'draft',
    null
  );

insert into public.skills (owner_id, domain, name, display_order, visible)
values
  ('11111111-1111-4111-8111-111111111111', 'common', 'Visible skill', 0, true),
  ('11111111-1111-4111-8111-111111111111', 'common', 'Hidden skill', 1, false);

select extensions.is(
  (
    select count(*)
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relkind = 'r'
      and not pg_class.relrowsecurity
  ),
  0::bigint,
  'Every public application table has RLS enabled'
);

select extensions.ok(
  has_sequence_privilege(
    'authenticated',
    'public.article_revisions_id_seq',
    'USAGE'
  ),
  'Authenticated administrator sessions can allocate revision IDs'
);

select extensions.ok(
  not has_function_privilege('anon', 'private.is_admin()', 'EXECUTE'),
  'Anonymous callers cannot execute the administrator lookup function'
);

select extensions.ok(
  has_function_privilege('authenticated', 'private.is_admin()', 'EXECUTE'),
  'Authenticated sessions can invoke the RLS administrator lookup'
);

select extensions.ok(
  not has_table_privilege('authenticated', 'private.admin_config', 'SELECT'),
  'Authenticated sessions cannot read the administrator email configuration'
);

select extensions.ok(
  has_table_privilege('supabase_auth_admin', 'private.admin_config', 'SELECT'),
  'Supabase Auth can read the administrator configuration for the signup hook'
);

select extensions.is(
  (
    select count(*)
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES')
  ),
  0::bigint,
  'The anonymous role has no mutation privileges on application tables'
);

select extensions.is(
  (
    select count(*)
    from pg_default_acl as defaults
    join pg_roles as owner on owner.oid = defaults.defaclrole
    join pg_namespace as namespace on namespace.oid = defaults.defaclnamespace
    cross join lateral aclexplode(defaults.defaclacl) as privilege
    join pg_roles as grantee on grantee.oid = privilege.grantee
    where owner.rolname = 'postgres'
      and namespace.nspname = 'public'
      and grantee.rolname = 'anon'
  ),
  0::bigint,
  'Future public tables, sequences, and functions are not granted to anonymous users by default'
);

select extensions.results_eq(
  $$
    select id, public, file_size_limit
    from storage.buckets
    where id in ('draft-media', 'blog-media', 'blog-downloads', 'portfolio-assets')
    order by id
  $$,
  $$
    values
      ('blog-downloads'::text, true, 52428800::bigint),
      ('blog-media'::text, true, 10485760::bigint),
      ('draft-media'::text, false, 52428800::bigint),
      ('portfolio-assets'::text, true, 52428800::bigint)
  $$,
  'Storage buckets have the reviewed visibility and byte limits'
);

select extensions.is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and 'anon' = any(roles)
  ),
  0::bigint,
  'Anonymous users cannot list Storage objects through the API'
);

select extensions.is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and 'authenticated' = any(roles)
      and policyname like 'Administrator can%managed storage objects'
  ),
  4::bigint,
  'Storage has administrator-only SELECT, INSERT, UPDATE, and DELETE policies'
);

set local role anon;

select extensions.results_eq(
  $$select slug from public.articles order by slug$$,
  $$values ('public-post'::text)$$,
  'Anonymous readers see published articles only'
);

select extensions.results_eq(
  $$select name from public.skills order by name$$,
  $$values ('Visible skill'::text)$$,
  'Anonymous readers see visible portfolio content only'
);

select extensions.throws_ok(
  $$
    insert into public.articles (author_id, title, slug)
    values ('11111111-1111-4111-8111-111111111111', 'Anon draft', 'anon-draft')
  $$,
  '42501',
  null,
  'Anonymous readers cannot create articles'
);

select extensions.throws_ok(
  $$update public.articles set title = 'Anonymous edit' where slug = 'public-post'$$,
  '42501',
  null,
  'Anonymous readers cannot update articles'
);

select extensions.throws_ok(
  $$delete from public.articles where slug = 'public-post'$$,
  '42501',
  null,
  'Anonymous readers cannot delete articles'
);

select extensions.throws_ok(
  $$
    insert into storage.objects (bucket_id, name)
    values ('portfolio-assets', 'anonymous/blocked.txt')
  $$,
  '42501',
  null,
  'Anonymous readers cannot upload Storage objects'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
set local request.jwt.claim = '{"sub":"22222222-2222-4222-8222-222222222222","session_id":"44444444-4444-4444-8444-444444444444"}';

select extensions.is(
  private.is_admin(),
  false,
  'An unauthorized authenticated identity is not an administrator'
);

select extensions.results_eq(
  $$select slug from public.articles order by slug$$,
  $$select null::text where false$$,
  'An unauthorized authenticated identity cannot read any content'
);

select extensions.throws_ok(
  $$
    insert into public.articles (author_id, title, slug)
    values ('22222222-2222-4222-8222-222222222222', 'Unauthorized draft', 'unauthorized-draft')
  $$,
  '42501',
  null,
  'An unauthorized authenticated identity cannot create articles'
);

select extensions.results_eq(
  $$update public.articles set title = 'Unauthorized edit' where slug = 'public-post' returning id$$,
  $$select null::uuid where false$$,
  'An unauthorized authenticated identity cannot update articles'
);

select extensions.results_eq(
  $$delete from public.articles where slug = 'public-post' returning id$$,
  $$select null::uuid where false$$,
  'An unauthorized authenticated identity cannot delete articles'
);

select extensions.throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner_id)
    values (
      'portfolio-assets',
      '22222222-2222-4222-8222-222222222222/blocked.txt',
      '22222222-2222-4222-8222-222222222222'
    )
  $$,
  '42501',
  null,
  'An unauthorized authenticated identity cannot upload Storage objects'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim = '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"33333333-3333-4333-8333-333333333333"}';

select extensions.is(
  private.is_admin(),
  true,
  'The configured registered identity is recognized as administrator'
);

select extensions.results_eq(
  $$select slug from public.articles order by slug$$,
  $$values ('private-draft'::text), ('public-post'::text)$$,
  'The administrator can read drafts and published articles'
);

select extensions.lives_ok(
  $$
    insert into public.articles (author_id, title, slug)
    values ('11111111-1111-4111-8111-111111111111', 'Admin draft', 'admin-draft')
  $$,
  'The administrator can create an article owned by their account'
);

select extensions.throws_ok(
  $$
    insert into public.articles (author_id, title, slug)
    values ('22222222-2222-4222-8222-222222222222', 'Wrong owner', 'wrong-owner')
  $$,
  '42501',
  null,
  'The administrator cannot assign an article to another identity'
);

reset role;
delete from auth.sessions
where id = '33333333-3333-4333-8333-333333333333';
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
set local request.jwt.claim = '{"sub":"11111111-1111-4111-8111-111111111111","session_id":"33333333-3333-4333-8333-333333333333"}';

select extensions.is(
  private.is_admin(),
  false,
  'A revoked or expired session immediately loses administrator authorization'
);

select extensions.results_eq(
  $$update public.articles set title = 'Revoked session edit' where slug = 'public-post' returning id$$,
  $$select null::uuid where false$$,
  'A revoked administrator session cannot update content'
);

select * from extensions.finish();
rollback;

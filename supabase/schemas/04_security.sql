revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke execute on function private.hook_restrict_admin_signup(jsonb)
  from public, anon, authenticated;
revoke execute on function private.register_admin_user()
  from public, anon, authenticated, supabase_auth_admin;
revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.configure_admin_email(text)
  from public, anon, authenticated, service_role, supabase_auth_admin;
revoke execute on function private.set_updated_at()
  from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

grant usage on schema private to supabase_auth_admin;
grant execute on function private.hook_restrict_admin_signup(jsonb)
  to supabase_auth_admin;
revoke all on table private.admin_config
  from public, anon, authenticated, service_role, supabase_auth_admin;
grant select on table private.admin_config to supabase_auth_admin;

alter table private.admin_config enable row level security;
alter table private.admin_users enable row level security;
alter table public.assets enable row level security;
alter table public.articles enable row level security;
alter table public.article_revisions enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_assets enable row level security;
alter table public.portfolio_profile enable row level security;
alter table public.portfolio_domains enable row level security;
alter table public.social_links enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.certifications enable row level security;
alter table public.site_integrations enable row level security;

create policy "Supabase Auth can read administrator configuration"
on private.admin_config for select
to supabase_auth_admin
using (id = 1);

create policy "Public can read published articles"
on public.articles for select
to anon, authenticated
using (
  status = 'published'
  and deleted_at is null
  and published_at <= now()
);

create policy "Administrator can manage articles"
on public.articles for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and author_id = (select auth.uid())
);

create policy "Administrator can manage article revisions"
on public.article_revisions for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and editor_id = (select auth.uid())
);

create policy "Public can read public asset metadata"
on public.assets for select
to anon, authenticated
using (visibility = 'public');

create policy "Administrator can manage asset metadata"
on public.assets for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read tags"
on public.tags for select
to anon, authenticated
using (true);

create policy "Administrator can manage tags"
on public.tags for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read published article tags"
on public.article_tags for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles
    where articles.id = article_tags.article_id
      and articles.status = 'published'
      and articles.deleted_at is null
      and articles.published_at <= now()
  )
);

create policy "Administrator can manage article tags"
on public.article_tags for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Public can read published article assets"
on public.article_assets for select
to anon, authenticated
using (
  exists (
    select 1
    from public.articles
    where articles.id = article_assets.article_id
      and articles.status = 'published'
      and articles.deleted_at is null
      and articles.published_at <= now()
  )
);

create policy "Administrator can manage article assets"
on public.article_assets for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Public can read portfolio profile"
on public.portfolio_profile for select
to anon, authenticated
using (true);

create policy "Administrator can manage portfolio profile"
on public.portfolio_profile for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read visible portfolio domains"
on public.portfolio_domains for select
to anon, authenticated
using (visible);

create policy "Administrator can manage portfolio domains"
on public.portfolio_domains for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read visible social links"
on public.social_links for select
to anon, authenticated
using (visible);

create policy "Administrator can manage social links"
on public.social_links for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read visible skills"
on public.skills for select
to anon, authenticated
using (visible);

create policy "Administrator can manage skills"
on public.skills for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read visible experiences"
on public.experiences for select
to anon, authenticated
using (visible);

create policy "Administrator can manage experiences"
on public.experiences for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read visible projects"
on public.projects for select
to anon, authenticated
using (visible);

create policy "Administrator can manage projects"
on public.projects for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read visible certifications"
on public.certifications for select
to anon, authenticated
using (visible);

create policy "Administrator can manage certifications"
on public.certifications for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

create policy "Public can read site integrations"
on public.site_integrations for select
to anon, authenticated
using (true);

create policy "Administrator can manage site integrations"
on public.site_integrations for all
to authenticated
using ((select private.is_admin()))
with check (
  (select private.is_admin())
  and owner_id = (select auth.uid())
);

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on table
  public.assets,
  public.articles,
  public.tags,
  public.article_tags,
  public.article_assets,
  public.portfolio_profile,
  public.portfolio_domains,
  public.social_links,
  public.skills,
  public.experiences,
  public.projects,
  public.certifications,
  public.site_integrations
to anon;

grant select, insert, update, delete on table
  public.assets,
  public.articles,
  public.article_revisions,
  public.tags,
  public.article_tags,
  public.article_assets,
  public.portfolio_profile,
  public.portfolio_domains,
  public.social_links,
  public.skills,
  public.experiences,
  public.projects,
  public.certifications,
  public.site_integrations
to authenticated;

grant usage, select on sequence public.article_revisions_id_seq
to authenticated;

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

SET check_function_bodies = false;
CREATE SCHEMA private AUTHORIZATION postgres;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO supabase_auth_admin;
CREATE FUNCTION private.configure_admin_email(configured_email text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  normalized_email text := lower(btrim(configured_email));
begin
  insert into private.admin_config (id, admin_email)
  values (1, normalized_email)
  on conflict (id) do update
  set admin_email = excluded.admin_email,
      updated_at = now();

  delete from private.admin_users
  where email <> normalized_email;

  insert into private.admin_users (user_id, email)
  select id, lower(email)
  from auth.users
  where lower(coalesce(email, '')) = normalized_email
    and lower(coalesce(raw_app_meta_data->>'provider', '')) = 'github'
  on conflict (user_id) do update set email = excluded.email;
end;
$function$;
CREATE FUNCTION private.hook_restrict_admin_signup(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  requested_email text := lower(coalesce(event->'user'->>'email', ''));
  requested_provider text := lower(coalesce(event->'user'->'app_metadata'->>'provider', ''));
  configured_email text;
begin
  select admin_email
  into configured_email
  from private.admin_config
  where id = 1;

  if configured_email is not null
     and requested_email = configured_email
     and requested_provider = 'github' then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'This application is restricted to its sole administrator.'
    )
  );
end;
$function$;
GRANT ALL ON FUNCTION private.hook_restrict_admin_signup(jsonb) TO supabase_auth_admin;
CREATE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from private.admin_users as administrator
    join private.admin_config as configuration
      on configuration.id = 1
     and configuration.admin_email = administrator.email
    where administrator.user_id = (select auth.uid())
  );
$function$;
GRANT ALL ON FUNCTION private.is_admin() TO authenticated;
CREATE FUNCTION private.register_admin_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if exists (
    select 1
    from private.admin_config
    where id = 1
      and admin_email = lower(coalesce(new.email, ''))
  )
     and lower(coalesce(new.raw_app_meta_data->>'provider', '')) = 'github' then
    insert into private.admin_users (user_id, email)
    values (new.id, lower(new.email))
    on conflict (user_id) do update set email = excluded.email;
  else
    delete from private.admin_users where user_id = new.id;
  end if;

  return new;
end;
$function$;
CREATE TRIGGER register_admin_after_auth_user_created AFTER INSERT OR UPDATE OF email, raw_app_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION private.register_admin_user();
CREATE FUNCTION private.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
CREATE TABLE private.admin_config (id smallint DEFAULT 1 NOT NULL, admin_email text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE private.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.admin_config ADD CONSTRAINT admin_config_admin_email_key UNIQUE (admin_email);
ALTER TABLE private.admin_config ADD CONSTRAINT admin_config_email_format_check CHECK (admin_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text);
ALTER TABLE private.admin_config ADD CONSTRAINT admin_config_email_normalized_check CHECK (admin_email = lower(btrim(admin_email)));
ALTER TABLE private.admin_config ADD CONSTRAINT admin_config_pkey PRIMARY KEY (id);
ALTER TABLE private.admin_config ADD CONSTRAINT admin_config_singleton_check CHECK (id = 1);
GRANT SELECT ON private.admin_config TO supabase_auth_admin;
CREATE POLICY "Supabase Auth can read administrator configuration" ON private.admin_config FOR SELECT TO supabase_auth_admin USING ((id = 1));
CREATE TABLE private.admin_users (user_id uuid NOT NULL, email text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE private.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.admin_users ADD CONSTRAINT admin_users_email_format_check CHECK (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text);
ALTER TABLE private.admin_users ADD CONSTRAINT admin_users_email_key UNIQUE (email);
ALTER TABLE private.admin_users ADD CONSTRAINT admin_users_email_normalized_check CHECK (email = lower(btrim(email)));
ALTER TABLE private.admin_users ADD CONSTRAINT admin_users_pkey PRIMARY KEY (user_id);
ALTER TABLE private.admin_users ADD CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE TABLE public.article_assets (article_id uuid NOT NULL, asset_id uuid NOT NULL, role text DEFAULT 'inline'::text NOT NULL, display_order integer DEFAULT 0 NOT NULL);
ALTER TABLE public.article_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_assets ADD CONSTRAINT article_assets_order_check CHECK (display_order >= 0);
ALTER TABLE public.article_assets ADD CONSTRAINT article_assets_pkey PRIMARY KEY (article_id, asset_id);
ALTER TABLE public.article_assets ADD CONSTRAINT article_assets_role_check CHECK (role = ANY (ARRAY['cover'::text, 'inline'::text, 'attachment'::text]));
GRANT SELECT ON public.article_assets TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.article_assets TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_assets TO service_role;
CREATE INDEX article_assets_asset_id_idx ON public.article_assets (asset_id);
CREATE POLICY "Administrator can manage article assets" ON public.article_assets TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));
CREATE TABLE public.article_revisions (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, article_id uuid NOT NULL, editor_id uuid NOT NULL, title text NOT NULL, content jsonb NOT NULL, content_text text DEFAULT ''::text NOT NULL, revision_reason text DEFAULT 'autosave'::text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_content_object_check CHECK (jsonb_typeof(content) = 'object'::text);
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_editor_id_fkey FOREIGN KEY (editor_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_pkey PRIMARY KEY (id);
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_reason_check CHECK (revision_reason = ANY (ARRAY['autosave'::text, 'manual'::text, 'publish'::text, 'restore'::text]));
GRANT DELETE, INSERT, SELECT, UPDATE ON public.article_revisions TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_revisions TO service_role;
CREATE INDEX article_revisions_article_created_idx ON public.article_revisions (article_id, created_at DESC);
CREATE INDEX article_revisions_editor_id_idx ON public.article_revisions (editor_id);
CREATE POLICY "Administrator can manage article revisions" ON public.article_revisions TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (editor_id = ( SELECT auth.uid() AS uid))));
CREATE TABLE public.article_tags (article_id uuid NOT NULL, tag_id uuid NOT NULL);
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ADD CONSTRAINT article_tags_pkey PRIMARY KEY (article_id, tag_id);
GRANT SELECT ON public.article_tags TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.article_tags TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_tags TO service_role;
CREATE INDEX article_tags_tag_id_idx ON public.article_tags (tag_id);
CREATE POLICY "Administrator can manage article tags" ON public.article_tags TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK (( SELECT private.is_admin() AS is_admin));
CREATE TABLE public.articles (id uuid DEFAULT gen_random_uuid() NOT NULL, author_id uuid NOT NULL, title text NOT NULL, slug text NOT NULL, subtitle text, excerpt text, content jsonb DEFAULT '{"type": "doc", "content": [{"type": "paragraph"}]}'::jsonb NOT NULL, content_text text DEFAULT ''::text NOT NULL, cover_asset_id uuid, status text DEFAULT 'draft'::text NOT NULL, featured boolean DEFAULT false NOT NULL, seo_title text, seo_description text, canonical_url text, external_url text, reading_time_minutes smallint DEFAULT 1 NOT NULL, published_at timestamp with time zone, scheduled_at timestamp with time zone, deleted_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, search_vector tsvector GENERATED ALWAYS AS (((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(excerpt, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(content_text, ''::text)), 'C'::"char"))) STORED);
CREATE POLICY "Public can read published article assets" ON public.article_assets FOR SELECT TO anon, authenticated USING ((EXISTS ( SELECT 1
   FROM public.articles
  WHERE ((articles.id = article_assets.article_id) AND (articles.status = 'published'::text) AND (articles.deleted_at IS NULL) AND (articles.published_at <= now())))));
CREATE POLICY "Public can read published article tags" ON public.article_tags FOR SELECT TO anon, authenticated USING ((EXISTS ( SELECT 1
   FROM public.articles
  WHERE ((articles.id = article_tags.article_id) AND (articles.status = 'published'::text) AND (articles.deleted_at IS NULL) AND (articles.published_at <= now())))));
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.articles ADD CONSTRAINT articles_content_object_check CHECK (jsonb_typeof(content) = 'object'::text);
ALTER TABLE public.articles ADD CONSTRAINT articles_pkey PRIMARY KEY (id);
ALTER TABLE public.article_assets ADD CONSTRAINT article_assets_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;
ALTER TABLE public.article_revisions ADD CONSTRAINT article_revisions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;
ALTER TABLE public.article_tags ADD CONSTRAINT article_tags_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;
ALTER TABLE public.articles ADD CONSTRAINT articles_publication_check CHECK ((status = ANY (ARRAY['draft'::text, 'archived'::text])) OR status = 'published'::text AND published_at IS NOT NULL OR status = 'scheduled'::text AND scheduled_at IS NOT NULL);
ALTER TABLE public.articles ADD CONSTRAINT articles_reading_time_check CHECK (reading_time_minutes >= 1 AND reading_time_minutes <= 1440);
ALTER TABLE public.articles ADD CONSTRAINT articles_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text);
ALTER TABLE public.articles ADD CONSTRAINT articles_status_check CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'published'::text, 'archived'::text]));
ALTER TABLE public.articles ADD CONSTRAINT articles_title_length_check CHECK (char_length(btrim(title)) >= 1 AND char_length(btrim(title)) <= 180);
GRANT SELECT ON public.articles TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.articles TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.articles TO service_role;
CREATE UNIQUE INDEX articles_active_slug_unique_idx ON public.articles (lower(slug)) WHERE deleted_at IS NULL;
CREATE INDEX articles_author_id_idx ON public.articles (author_id);
CREATE INDEX articles_cover_asset_id_idx ON public.articles (cover_asset_id);
CREATE INDEX articles_published_feed_idx ON public.articles (published_at DESC, id DESC) WHERE status = 'published'::text AND deleted_at IS NULL;
CREATE INDEX articles_search_vector_idx ON public.articles USING gin (search_vector);
CREATE TRIGGER articles_set_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage articles" ON public.articles TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (author_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read published articles" ON public.articles FOR SELECT TO anon, authenticated USING (((status = 'published'::text) AND (deleted_at IS NULL) AND (published_at <= now())));
CREATE TABLE public.assets (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, kind text NOT NULL, visibility text DEFAULT 'private'::text NOT NULL, storage_bucket text NOT NULL, object_path text NOT NULL, original_name text NOT NULL, display_name text NOT NULL, mime_type text NOT NULL, byte_size bigint NOT NULL, alt_text text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ADD CONSTRAINT assets_byte_size_check CHECK (byte_size > 0);
ALTER TABLE public.assets ADD CONSTRAINT assets_kind_check CHECK (kind = ANY (ARRAY['image'::text, 'download'::text, 'resume'::text, 'avatar'::text, 'other'::text]));
ALTER TABLE public.assets ADD CONSTRAINT assets_object_unique UNIQUE (storage_bucket, object_path);
ALTER TABLE public.assets ADD CONSTRAINT assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.assets ADD CONSTRAINT assets_pkey PRIMARY KEY (id);
ALTER TABLE public.article_assets ADD CONSTRAINT article_assets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE RESTRICT;
ALTER TABLE public.articles ADD CONSTRAINT articles_cover_asset_id_fkey FOREIGN KEY (cover_asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.assets ADD CONSTRAINT assets_visibility_check CHECK (visibility = ANY (ARRAY['private'::text, 'public'::text]));
GRANT SELECT ON public.assets TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.assets TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.assets TO service_role;
CREATE INDEX assets_visibility_created_idx ON public.assets (visibility, created_at DESC);
CREATE INDEX assets_owner_id_idx ON public.assets (owner_id);
CREATE TRIGGER assets_set_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage asset metadata" ON public.assets TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read public asset metadata" ON public.assets FOR SELECT TO anon, authenticated USING ((visibility = 'public'::text));
CREATE TABLE public.certifications (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, name text NOT NULL, issuer text NOT NULL, year_label text NOT NULL, credential_url text, domains text[] NOT NULL, display_order integer DEFAULT 0 NOT NULL, visible boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ADD CONSTRAINT certifications_domains_check CHECK (cardinality(domains) > 0 AND domains <@ ARRAY['frontend'::text, 'java'::text, 'cyber'::text]);
ALTER TABLE public.certifications ADD CONSTRAINT certifications_order_check CHECK (display_order >= 0);
ALTER TABLE public.certifications ADD CONSTRAINT certifications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.certifications ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);
ALTER TABLE public.certifications ADD CONSTRAINT certifications_url_check CHECK (credential_url IS NULL OR credential_url ~* '^https://'::text);
GRANT SELECT ON public.certifications TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.certifications TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.certifications TO service_role;
CREATE INDEX certifications_visible_order_idx ON public.certifications (visible, display_order);
CREATE INDEX certifications_domains_idx ON public.certifications USING gin (domains);
CREATE INDEX certifications_owner_id_idx ON public.certifications (owner_id);
CREATE TRIGGER certifications_set_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage certifications" ON public.certifications TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read visible certifications" ON public.certifications FOR SELECT TO anon, authenticated USING (visible);
CREATE TABLE public.experiences (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, title text NOT NULL, organization text NOT NULL, location text DEFAULT ''::text NOT NULL, period_label text NOT NULL, description text NOT NULL, tags text[] DEFAULT '{}'::text[] NOT NULL, domains text[] NOT NULL, display_order integer DEFAULT 0 NOT NULL, visible boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_domains_check CHECK (cardinality(domains) > 0 AND domains <@ ARRAY['frontend'::text, 'java'::text, 'cyber'::text]);
ALTER TABLE public.experiences ADD CONSTRAINT experiences_order_check CHECK (display_order >= 0);
ALTER TABLE public.experiences ADD CONSTRAINT experiences_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);
GRANT SELECT ON public.experiences TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.experiences TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.experiences TO service_role;
CREATE INDEX experiences_owner_id_idx ON public.experiences (owner_id);
CREATE INDEX experiences_domains_idx ON public.experiences USING gin (domains);
CREATE INDEX experiences_visible_order_idx ON public.experiences (visible, display_order);
CREATE TRIGGER experiences_set_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage experiences" ON public.experiences TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read visible experiences" ON public.experiences FOR SELECT TO anon, authenticated USING (visible);
CREATE TABLE public.portfolio_domains (id text NOT NULL, owner_id uuid NOT NULL, tagline text NOT NULL, about text NOT NULL, resume_asset_id uuid, display_order integer DEFAULT 0 NOT NULL, visible boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.portfolio_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_domains ADD CONSTRAINT portfolio_domains_id_check CHECK (id = ANY (ARRAY['frontend'::text, 'java'::text, 'cyber'::text]));
ALTER TABLE public.portfolio_domains ADD CONSTRAINT portfolio_domains_order_check CHECK (display_order >= 0);
ALTER TABLE public.portfolio_domains ADD CONSTRAINT portfolio_domains_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.portfolio_domains ADD CONSTRAINT portfolio_domains_pkey PRIMARY KEY (id);
ALTER TABLE public.portfolio_domains ADD CONSTRAINT portfolio_domains_resume_asset_id_fkey FOREIGN KEY (resume_asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
GRANT SELECT ON public.portfolio_domains TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.portfolio_domains TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.portfolio_domains TO service_role;
CREATE INDEX portfolio_domains_owner_id_idx ON public.portfolio_domains (owner_id);
CREATE INDEX portfolio_domains_resume_asset_id_idx ON public.portfolio_domains (resume_asset_id);
CREATE INDEX portfolio_domains_visible_order_idx ON public.portfolio_domains (visible, display_order);
CREATE TRIGGER portfolio_domains_set_updated_at BEFORE UPDATE ON public.portfolio_domains FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage portfolio domains" ON public.portfolio_domains TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read visible portfolio domains" ON public.portfolio_domains FOR SELECT TO anon, authenticated USING (visible);
CREATE TABLE public.portfolio_profile (id smallint DEFAULT 1 NOT NULL, owner_id uuid NOT NULL, name text NOT NULL, tagline text NOT NULL, contact_email text NOT NULL, location text NOT NULL, avatar_asset_id uuid, default_resume_asset_id uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.portfolio_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_avatar_asset_id_fkey FOREIGN KEY (avatar_asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_default_resume_asset_id_fkey FOREIGN KEY (default_resume_asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_email_check CHECK (contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text);
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_name_check CHECK (char_length(btrim(name)) >= 1 AND char_length(btrim(name)) <= 100);
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_pkey PRIMARY KEY (id);
ALTER TABLE public.portfolio_profile ADD CONSTRAINT portfolio_profile_singleton_check CHECK (id = 1);
GRANT SELECT ON public.portfolio_profile TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.portfolio_profile TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.portfolio_profile TO service_role;
CREATE INDEX portfolio_profile_owner_id_idx ON public.portfolio_profile (owner_id);
CREATE INDEX portfolio_profile_resume_asset_id_idx ON public.portfolio_profile (default_resume_asset_id);
CREATE INDEX portfolio_profile_avatar_asset_id_idx ON public.portfolio_profile (avatar_asset_id);
CREATE TRIGGER portfolio_profile_set_updated_at BEFORE UPDATE ON public.portfolio_profile FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage portfolio profile" ON public.portfolio_profile TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read portfolio profile" ON public.portfolio_profile FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.projects (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, name text NOT NULL, repository_owner text NOT NULL, description text NOT NULL, repository_url text, demo_url text, image_asset_id uuid, domains text[] NOT NULL, featured boolean DEFAULT false NOT NULL, display_order integer DEFAULT 0 NOT NULL, visible boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ADD CONSTRAINT projects_demo_url_check CHECK (demo_url IS NULL OR demo_url ~* '^https://'::text);
ALTER TABLE public.projects ADD CONSTRAINT projects_domains_check CHECK (cardinality(domains) > 0 AND domains <@ ARRAY['frontend'::text, 'java'::text, 'cyber'::text]);
ALTER TABLE public.projects ADD CONSTRAINT projects_image_asset_id_fkey FOREIGN KEY (image_asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD CONSTRAINT projects_order_check CHECK (display_order >= 0);
ALTER TABLE public.projects ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.projects ADD CONSTRAINT projects_repository_url_check CHECK (repository_url IS NULL OR repository_url ~* '^https://'::text);
GRANT SELECT ON public.projects TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.projects TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.projects TO service_role;
CREATE INDEX projects_owner_id_idx ON public.projects (owner_id);
CREATE INDEX projects_domains_idx ON public.projects USING gin (domains);
CREATE INDEX projects_visible_order_idx ON public.projects (visible, display_order);
CREATE INDEX projects_image_asset_id_idx ON public.projects (image_asset_id);
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage projects" ON public.projects TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read visible projects" ON public.projects FOR SELECT TO anon, authenticated USING (visible);
CREATE TABLE public.site_integrations (id smallint DEFAULT 1 NOT NULL, owner_id uuid NOT NULL, github_username text NOT NULL, show_github_contributions boolean DEFAULT true NOT NULL, show_github_languages boolean DEFAULT true NOT NULL, linkedin_followers_label text DEFAULT ''::text NOT NULL, linkedin_connections_label text DEFAULT ''::text NOT NULL, linkedin_headline text DEFAULT ''::text NOT NULL, linkedin_post_urls text[] DEFAULT '{}'::text[] NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.site_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_integrations ADD CONSTRAINT site_integrations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.site_integrations ADD CONSTRAINT site_integrations_pkey PRIMARY KEY (id);
ALTER TABLE public.site_integrations ADD CONSTRAINT site_integrations_singleton_check CHECK (id = 1);
GRANT SELECT ON public.site_integrations TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.site_integrations TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.site_integrations TO service_role;
CREATE INDEX site_integrations_owner_id_idx ON public.site_integrations (owner_id);
CREATE TRIGGER site_integrations_set_updated_at BEFORE UPDATE ON public.site_integrations FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage site integrations" ON public.site_integrations TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read site integrations" ON public.site_integrations FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.skills (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, domain text NOT NULL, name text NOT NULL, display_order integer DEFAULT 0 NOT NULL, visible boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ADD CONSTRAINT skills_domain_check CHECK (domain = ANY (ARRAY['frontend'::text, 'java'::text, 'cyber'::text, 'common'::text]));
ALTER TABLE public.skills ADD CONSTRAINT skills_name_check CHECK (char_length(btrim(name)) >= 1 AND char_length(btrim(name)) <= 80);
ALTER TABLE public.skills ADD CONSTRAINT skills_order_check CHECK (display_order >= 0);
ALTER TABLE public.skills ADD CONSTRAINT skills_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.skills ADD CONSTRAINT skills_pkey PRIMARY KEY (id);
GRANT SELECT ON public.skills TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.skills TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.skills TO service_role;
CREATE INDEX skills_visible_domain_order_idx ON public.skills (visible, domain, display_order);
CREATE UNIQUE INDEX skills_owner_domain_name_unique_idx ON public.skills (owner_id, domain, lower(name));
CREATE TRIGGER skills_set_updated_at BEFORE UPDATE ON public.skills FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage skills" ON public.skills TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read visible skills" ON public.skills FOR SELECT TO anon, authenticated USING (visible);
CREATE TABLE public.social_links (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, platform text NOT NULL, label text NOT NULL, url text NOT NULL, display_order integer DEFAULT 0 NOT NULL, visible boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ADD CONSTRAINT social_links_order_check CHECK (display_order >= 0);
ALTER TABLE public.social_links ADD CONSTRAINT social_links_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.social_links ADD CONSTRAINT social_links_pkey PRIMARY KEY (id);
ALTER TABLE public.social_links ADD CONSTRAINT social_links_platform_check CHECK (platform = ANY (ARRAY['github'::text, 'github_org'::text, 'linkedin'::text, 'twitter'::text, 'website'::text, 'other'::text]));
ALTER TABLE public.social_links ADD CONSTRAINT social_links_url_check CHECK (url ~* '^https://'::text);
GRANT SELECT ON public.social_links TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.social_links TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.social_links TO service_role;
CREATE INDEX social_links_visible_order_idx ON public.social_links (visible, display_order);
CREATE INDEX social_links_owner_id_idx ON public.social_links (owner_id);
CREATE TRIGGER social_links_set_updated_at BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage social links" ON public.social_links TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read visible social links" ON public.social_links FOR SELECT TO anon, authenticated USING (visible);
CREATE TABLE public.tags (id uuid DEFAULT gen_random_uuid() NOT NULL, owner_id uuid NOT NULL, name text NOT NULL, slug text NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ADD CONSTRAINT tags_name_check CHECK (char_length(btrim(name)) >= 1 AND char_length(btrim(name)) <= 50);
ALTER TABLE public.tags ADD CONSTRAINT tags_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE public.article_tags ADD CONSTRAINT article_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE public.tags ADD CONSTRAINT tags_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text);
GRANT SELECT ON public.tags TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.tags TO authenticated;
GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.tags TO service_role;
CREATE INDEX tags_owner_id_idx ON public.tags (owner_id);
CREATE UNIQUE INDEX tags_slug_unique_idx ON public.tags (lower(slug));
CREATE TRIGGER tags_set_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
CREATE POLICY "Administrator can manage tags" ON public.tags TO authenticated USING (( SELECT private.is_admin() AS is_admin)) WITH CHECK ((( SELECT private.is_admin() AS is_admin) AND (owner_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "Public can read tags" ON public.tags FOR SELECT TO anon, authenticated USING (true);

SET check_function_bodies = false;
CREATE OR REPLACE FUNCTION private.is_admin()
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
    join auth.users as identity
      on identity.id = administrator.user_id
     and lower(coalesce(identity.raw_app_meta_data->>'provider', '')) = 'github'
     and identity.email_confirmed_at is not null
    join auth.sessions as session
      on session.user_id = administrator.user_id
     and session.id::text = coalesce((select auth.jwt()->>'session_id'), '')
     and (session.not_after is null or session.not_after > now())
    where administrator.user_id = (select auth.uid())
  );
$function$;

-- Grants are a separate defense from RLS. Keep the public reader role strictly
-- read-only even if a future policy is accidentally broadened.
REVOKE ALL ON TABLE
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
FROM anon;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT SELECT ON TABLE
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
TO anon;

REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_assets FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_assets FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_revisions FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_revisions FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_tags FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.article_tags FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.articles FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.articles FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.assets FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.assets FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.certifications FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.certifications FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.experiences FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.experiences FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.portfolio_domains FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.portfolio_domains FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.portfolio_profile FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.portfolio_profile FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.projects FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.projects FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.site_integrations FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.site_integrations FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.skills FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.skills FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.social_links FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.social_links FROM authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.tags FROM anon;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.tags FROM authenticated;

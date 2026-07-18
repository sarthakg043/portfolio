create table public.portfolio_profile (
  id smallint primary key default 1,
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  tagline text not null,
  contact_email text not null,
  location text not null,
  avatar_asset_id uuid references public.assets(id) on delete set null,
  default_resume_asset_id uuid references public.assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_profile_singleton_check check (id = 1),
  constraint portfolio_profile_name_check
    check (char_length(btrim(name)) between 1 and 100),
  constraint portfolio_profile_email_check
    check (contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create index portfolio_profile_owner_id_idx
  on public.portfolio_profile(owner_id);
create index portfolio_profile_avatar_asset_id_idx
  on public.portfolio_profile(avatar_asset_id);
create index portfolio_profile_resume_asset_id_idx
  on public.portfolio_profile(default_resume_asset_id);

create table public.portfolio_domains (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete restrict,
  tagline text not null,
  about text not null,
  resume_asset_id uuid references public.assets(id) on delete set null,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_domains_id_check
    check (id in ('frontend', 'java', 'cyber')),
  constraint portfolio_domains_order_check check (display_order >= 0)
);

create index portfolio_domains_owner_id_idx
  on public.portfolio_domains(owner_id);
create index portfolio_domains_resume_asset_id_idx
  on public.portfolio_domains(resume_asset_id);
create index portfolio_domains_visible_order_idx
  on public.portfolio_domains(visible, display_order);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  platform text not null,
  label text not null,
  url text not null,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_platform_check
    check (platform in ('github', 'github_org', 'linkedin', 'twitter', 'website', 'other')),
  constraint social_links_url_check check (url ~* '^https://'),
  constraint social_links_order_check check (display_order >= 0)
);

create index social_links_owner_id_idx on public.social_links(owner_id);
create index social_links_visible_order_idx
  on public.social_links(visible, display_order);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  domain text not null,
  name text not null,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_domain_check
    check (domain in ('frontend', 'java', 'cyber', 'common')),
  constraint skills_name_check
    check (char_length(btrim(name)) between 1 and 80),
  constraint skills_order_check check (display_order >= 0)
);

create unique index skills_owner_domain_name_unique_idx
  on public.skills(owner_id, domain, lower(name));
create index skills_visible_domain_order_idx
  on public.skills(visible, domain, display_order);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  organization text not null,
  location text not null default '',
  period_label text not null,
  description text not null,
  tags text[] not null default '{}',
  domains text[] not null,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_domains_check
    check (
      cardinality(domains) > 0
      and domains <@ array['frontend', 'java', 'cyber']::text[]
    ),
  constraint experiences_order_check check (display_order >= 0)
);

create index experiences_owner_id_idx on public.experiences(owner_id);
create index experiences_visible_order_idx
  on public.experiences(visible, display_order);
create index experiences_domains_idx
  on public.experiences using gin(domains);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  repository_owner text not null,
  description text not null,
  repository_url text,
  demo_url text,
  image_asset_id uuid references public.assets(id) on delete set null,
  domains text[] not null,
  featured boolean not null default false,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_domains_check
    check (
      cardinality(domains) > 0
      and domains <@ array['frontend', 'java', 'cyber']::text[]
    ),
  constraint projects_repository_url_check
    check (repository_url is null or repository_url ~* '^https://'),
  constraint projects_demo_url_check
    check (demo_url is null or demo_url ~* '^https://'),
  constraint projects_order_check check (display_order >= 0)
);

create index projects_owner_id_idx on public.projects(owner_id);
create index projects_image_asset_id_idx on public.projects(image_asset_id);
create index projects_visible_order_idx
  on public.projects(visible, display_order);
create index projects_domains_idx on public.projects using gin(domains);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  issuer text not null,
  year_label text not null,
  credential_url text,
  domains text[] not null,
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certifications_domains_check
    check (
      cardinality(domains) > 0
      and domains <@ array['frontend', 'java', 'cyber']::text[]
    ),
  constraint certifications_url_check
    check (credential_url is null or credential_url ~* '^https://'),
  constraint certifications_order_check check (display_order >= 0)
);

create index certifications_owner_id_idx on public.certifications(owner_id);
create index certifications_visible_order_idx
  on public.certifications(visible, display_order);
create index certifications_domains_idx
  on public.certifications using gin(domains);

create table public.site_integrations (
  id smallint primary key default 1,
  owner_id uuid not null references auth.users(id) on delete restrict,
  github_username text not null,
  show_github_contributions boolean not null default true,
  show_github_languages boolean not null default true,
  linkedin_followers_label text not null default '',
  linkedin_connections_label text not null default '',
  linkedin_headline text not null default '',
  linkedin_post_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_integrations_singleton_check check (id = 1)
);

create index site_integrations_owner_id_idx
  on public.site_integrations(owner_id);

create trigger portfolio_profile_set_updated_at
before update on public.portfolio_profile
for each row execute function private.set_updated_at();
create trigger portfolio_domains_set_updated_at
before update on public.portfolio_domains
for each row execute function private.set_updated_at();
create trigger social_links_set_updated_at
before update on public.social_links
for each row execute function private.set_updated_at();
create trigger skills_set_updated_at
before update on public.skills
for each row execute function private.set_updated_at();
create trigger experiences_set_updated_at
before update on public.experiences
for each row execute function private.set_updated_at();
create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();
create trigger certifications_set_updated_at
before update on public.certifications
for each row execute function private.set_updated_at();
create trigger site_integrations_set_updated_at
before update on public.site_integrations
for each row execute function private.set_updated_at();

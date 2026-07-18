create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  kind text not null,
  visibility text not null default 'private',
  storage_bucket text not null,
  object_path text not null,
  original_name text not null,
  display_name text not null,
  mime_type text not null,
  byte_size bigint not null,
  alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assets_kind_check
    check (kind in ('image', 'download', 'resume', 'avatar', 'other')),
  constraint assets_visibility_check
    check (visibility in ('private', 'public')),
  constraint assets_byte_size_check check (byte_size > 0),
  constraint assets_object_unique unique (storage_bucket, object_path)
);

create index assets_owner_id_idx on public.assets(owner_id);
create index assets_visibility_created_idx
  on public.assets(visibility, created_at desc);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  slug text not null,
  subtitle text,
  excerpt text,
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  content_text text not null default '',
  cover_asset_id uuid references public.assets(id) on delete set null,
  status text not null default 'draft',
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  canonical_url text,
  external_url text,
  reading_time_minutes smallint not null default 1,
  published_at timestamptz,
  scheduled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_text, '')), 'C')
  ) stored,
  constraint articles_title_length_check
    check (char_length(btrim(title)) between 1 and 180),
  constraint articles_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint articles_status_check
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  constraint articles_content_object_check
    check (jsonb_typeof(content) = 'object'),
  constraint articles_reading_time_check
    check (reading_time_minutes between 1 and 1440),
  constraint articles_publication_check
    check (
      (status in ('draft', 'archived'))
      or (status = 'published' and published_at is not null)
      or (status = 'scheduled' and scheduled_at is not null)
    )
);

create unique index articles_active_slug_unique_idx
  on public.articles(lower(slug))
  where deleted_at is null;
create index articles_author_id_idx on public.articles(author_id);
create index articles_cover_asset_id_idx on public.articles(cover_asset_id);
create index articles_published_feed_idx
  on public.articles(published_at desc, id desc)
  where status = 'published' and deleted_at is null;
create index articles_search_vector_idx
  on public.articles using gin(search_vector);

create table public.article_revisions (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  editor_id uuid not null references auth.users(id) on delete restrict,
  title text not null,
  content jsonb not null,
  content_text text not null default '',
  revision_reason text not null default 'autosave',
  created_at timestamptz not null default now(),
  constraint article_revisions_content_object_check
    check (jsonb_typeof(content) = 'object'),
  constraint article_revisions_reason_check
    check (revision_reason in ('autosave', 'manual', 'publish', 'restore'))
);

create index article_revisions_article_created_idx
  on public.article_revisions(article_id, created_at desc);
create index article_revisions_editor_id_idx
  on public.article_revisions(editor_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_name_check check (char_length(btrim(name)) between 1 and 50),
  constraint tags_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index tags_slug_unique_idx on public.tags(lower(slug));
create index tags_owner_id_idx on public.tags(owner_id);

create table public.article_tags (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

create index article_tags_tag_id_idx on public.article_tags(tag_id);

create table public.article_assets (
  article_id uuid not null references public.articles(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  role text not null default 'inline',
  display_order integer not null default 0,
  primary key (article_id, asset_id),
  constraint article_assets_role_check
    check (role in ('cover', 'inline', 'attachment')),
  constraint article_assets_order_check check (display_order >= 0)
);

create index article_assets_asset_id_idx on public.article_assets(asset_id);

create trigger assets_set_updated_at
before update on public.assets
for each row execute function private.set_updated_at();
create trigger articles_set_updated_at
before update on public.articles
for each row execute function private.set_updated_at();
create trigger tags_set_updated_at
before update on public.tags
for each row execute function private.set_updated_at();

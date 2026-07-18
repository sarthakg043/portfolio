# Spyboy Portfolio, Blog, and Admin CMS

One Next.js 16 application deployed to Vercel and served through three hostnames:

- `spyboy.uk` — public portfolio
- `blog.spyboy.uk` — public editorial blog
- `admin.spyboy.uk` — private content-management dashboard

Supabase provides Postgres, GitHub OAuth, Row Level Security, and file storage. The sole permitted administrator identity is supplied through the server-only `ADMIN_EMAIL` environment variable and a matching private database setting; it is not hardcoded in the application.

## Architecture decisions

- Keep one repository and one Vercel project.
- Use Next.js `proxy.ts` for hostname rewrites and Supabase cookie refresh.
- Treat Proxy as routing and an optimistic login check only. Every mutation performs its own authorization check, and Supabase RLS remains the final data boundary.
- Store article documents as Tiptap JSON and render them through a controlled extension set. Raw arbitrary HTML is not accepted.
- Normalize portfolio collections in Postgres; use JSONB only for editor documents and intentionally flexible settings.
- Keep unpublished media private and promote referenced assets to public buckets at publication time.
- Use immutable object paths so replacing an upload cannot leave stale CDN content.

## Phase 1 — Application foundation

Status: implementation complete and GitHub OAuth validated locally

- Add environment validation and browser/server Supabase clients.
- Add GitHub OAuth login, callback, logout, and authorization helpers.
- Add hostname-aware routing for the portfolio, blog, and admin applications.
- Split layouts so portfolio-only effects do not load on blog or admin pages.
- Add light, dark, and system theme support.

Input checkpoint:

- Add the Supabase URL and publishable key to `.env.local`.
- Add `ADMIN_EMAIL` to `.env.local` and confirm GitHub exposes that address to the OAuth application.
- Add the exact local and production callback URLs to Supabase Auth URL Configuration.

## Phase 2 — Database, RLS, and storage

Status: implementation complete; hosted schema, RLS, Storage, and Auth controls verified

- Add versioned Supabase migrations.
- Create the private administrator configuration and registry plus the exact-email Before User Created hook.
- Create article, revision, tag, asset, and portfolio-content tables.
- Add constraints, foreign-key indexes, full-text search, cursor-feed indexes, explicit grants, and RLS policies.
- Add private draft and public media/download buckets with administrator-only mutation policies.
- Seed the current `data/portfolio-config.json` content without losing ordering.

Input checkpoint:

- Replace the current GitHub App credentials with credentials from a GitHub OAuth App.

## Phase 3 — Public blog

Status: implementation complete locally; production deployment verification pending

- Responsive editorial home page, article page, tag filters, search, and cursor pagination.
- Light/dark/system theme with no hydration flash.
- Reading time, reading progress, table of contents, code highlighting, related posts, sharing, and download blocks.
- Metadata, canonical URLs, Open Graph, JSON-LD, sitemap, robots, and RSS.
- Portfolio blog section populated from the latest published internal articles.

## Phase 4 — Private admin CMS

Status: core implementation complete locally; production CRUD and Storage verification pending

- Dashboard and article listing with draft, published, archived, and trash states.
- Medium-inspired distraction-free Tiptap editor.
- Article create, autosave, update, duplicate, publish, unpublish, archive, trash, restore, and permanent delete.
- Slug, excerpt, cover, tags, SEO, revision history, and recovery.
- Media library with upload progress, alt text, usage checks, and safe deletion.
- Portfolio forms for profile, social links, domain copy, skills, experience, projects, certifications, LinkedIn, GitHub, and ordering.

## Phase 5 — Portfolio migration

Status: planned

- Refactor components that import `portfolio-config.json` to receive typed data from a server-only data access layer.
- Retain the JSON file as a migration fixture until database parity is verified.
- Keep GitHub API data live while moving its username and display settings into Supabase.
- Invalidate portfolio and blog cache tags immediately after successful admin changes.

## Phase 6 — Security and quality verification

Status: planned

- Add Zod validation to every untrusted input boundary.
- Add CSP, HSTS, frame protection, MIME sniffing protection, referrer policy, and `noindex` admin headers.
- Verify no secret/service key is present in client bundles.
- Test RLS as anonymous, administrator, and unauthorized authenticated identities.
- Run Supabase Security and Performance Advisors.
- Add unit, integration, accessibility, responsive, and Playwright end-to-end coverage.
- Verify lint, TypeScript, production build, OAuth redirects, storage permissions, and all three production hostnames.

## Phase 7 — Vercel and Cloudflare rollout

Status: planned

- Add `blog.spyboy.uk` and `admin.spyboy.uk` to the existing Vercel project.
- Add the exact CNAME targets supplied by Vercel in Cloudflare DNS.
- Keep the records DNS-only until Vercel verification and TLS provisioning succeed.
- Add production environment variables in Vercel.
- Verify `spyboy.uk` remains unchanged, then smoke-test blog and admin in production.

## Required environment variables

Create `.env.local` from `.env.example`. Never commit `.env.local` or Supabase/GitHub secrets.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ADMIN_EMAIL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BLOG_URL=http://blog.localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://admin.localhost:3000
```

Production URL values:

```dotenv
NEXT_PUBLIC_SITE_URL=https://spyboy.uk
NEXT_PUBLIC_BLOG_URL=https://blog.spyboy.uk
NEXT_PUBLIC_ADMIN_URL=https://admin.spyboy.uk
```

The GitHub OAuth client secret belongs only in the Supabase dashboard, not in this Next.js project.
`ADMIN_EMAIL` is intentionally server-only and must never use the `NEXT_PUBLIC_` prefix.

## GitHub OAuth configuration

There are two different callback URLs and they must not be mixed up:

1. In the GitHub OAuth App, set **Authorization callback URL** to:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

2. In Supabase Authentication > URL Configuration, allow:

   ```text
   http://admin.localhost:3000/auth/callback
   https://admin.spyboy.uk/auth/callback
   ```

The application requests GitHub's `read:user user:email` scopes and still checks the verified
Supabase user email on every protected server request. RLS independently permits data changes only
when the authenticated user matches the private administrator configuration. After deploying the
database migrations, configure the database from the same value used for `ADMIN_EMAIL` by running
the following once in the Supabase SQL Editor while signed in as the project owner:

```sql
select private.configure_admin_email('<value of ADMIN_EMAIL>');
```

Postgres cannot read Vercel environment variables directly, so this private singleton row is the
database-side copy of the setting. The function normalizes the address and synchronizes an existing
matching GitHub identity if one already exists. With no row configured, authorization fails closed
and the signup hook rejects every account. After configuration, enable the
`private.hook_restrict_admin_signup` Before User Created hook so every other new account is rejected
before it is created.

## File storage decision

Supabase Storage is sufficient for the initial release, so another service is not required. The
planned buckets are:

- `draft-media` — private draft images and attachments
- `blog-media` — public published article images
- `blog-downloads` — public PDFs, ZIP archives, text, and JSON downloads
- `portfolio-assets` — public portfolio images and resumes

The database stores metadata and object paths; file bytes stay in Storage. Bucket MIME type and size
limits plus Storage RLS prevent unauthorized uploads, changes, and deletion. Public downloads receive
stable URLs. Use Cloudflare R2 later only if large/high-traffic downloads make egress the dominant
cost or if files must exceed the Supabase plan's limits.

## Dependencies

Installed:

- `@supabase/supabase-js` and `@supabase/ssr` — database, Storage, GitHub sessions, and SSR cookies
- `zod` — environment and request validation
- `next-themes` — light, dark, and system theme handling
- `server-only` — guard server-only modules from client bundles
- `highlight.js` — server-side syntax highlighting for published code blocks
- Tiptap (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, and selected extensions) — structured article authoring
- `react-hook-form` and `@hookform/resolvers` — dashboard form state and Zod integration
- `supabase` (development dependency) — schema, migration, type-generation, and security workflows

The existing Tailwind, Radix/shadcn, Lucide, and Motion packages cover the dashboard and public UI.

## Local development

After dependencies and `.env.local` are present:

```bash
npm run dev
```

Local hostname testing uses `localhost`, `blog.localhost`, and `admin.localhost` on port 3000. If a browser or operating system does not resolve subdomains of `localhost`, add temporary hosts-file entries or use the path-based development fallback documented by the application.

## Current implementation checkpoint

The hostname routing, themes, Supabase SSR clients, GitHub OAuth screens/callback, environment-based
administrator checks, declarative schemas, RLS policies, and Storage bucket definitions are implemented. The Next.js
production build and targeted lint checks pass. Both migrations reproduce successfully with a clean
local database reset and are deployed to the linked hosted project. All 24 local pgTAP assertions
pass; hosted database lint and the hosted Security Advisor report no issues, and the same
rollback-wrapped security test file executes remotely without SQL errors. The private administrator
configuration matches the server environment, all four
Storage buckets exist, and no test Auth users remain.

GitHub OAuth is now configured with an OAuth App and the complete local login flow has been verified.
The hosted project has `private.hook_restrict_admin_signup` enabled as its Before User Created hook.
Email authentication is disabled, while anonymous sign-in and manual identity linking remain off.

The Phase 3 public blog now reads published content through the anonymous RLS boundary and includes its
responsive feed, search, tag filters, cursor pagination, safe Tiptap JSON renderer, article metadata,
table of contents, reading progress, syntax highlighting, downloads, sharing, related posts, RSS,
robots, and sitemap routes. The portfolio blog section now uses the latest internal published articles.

Phase 4 replaces the dashboard placeholders with working article, revision-history, media-library, and
portfolio-content routes. Article management includes draft autosave, publishing-state transitions,
duplication, trash recovery, permanent deletion, SEO fields, tags, covers, and revision restore.
The media library uploads through Storage RLS, records asset metadata, and blocks deletion while an
asset is referenced. Portfolio forms now edit the normalized Supabase records; Phase 5 will switch the
public portfolio components from the JSON fixture to those records and add cache invalidation.

## Scope boundary

The initial release provides Medium-style authoring and reading, but not public reader accounts, comments, claps, follows, or newsletters. Adding public identities later requires a separate authorization model because this release intentionally rejects every signup except the single administrator.

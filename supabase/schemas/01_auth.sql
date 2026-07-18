create schema if not exists private;

create table private.admin_config (
  id smallint primary key default 1,
  admin_email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_config_singleton_check check (id = 1),
  constraint admin_config_email_normalized_check
    check (admin_email = lower(btrim(admin_email))),
  constraint admin_config_email_format_check
    check (admin_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint admin_users_email_normalized_check
    check (email = lower(btrim(email))),
  constraint admin_users_email_format_check
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create function private.hook_restrict_admin_signup(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
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
$$;

create function private.register_admin_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger register_admin_after_auth_user_created
after insert or update of email, raw_app_meta_data on auth.users
for each row execute function private.register_admin_user();

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users as administrator
    join private.admin_config as configuration
      on configuration.id = 1
     and configuration.admin_email = administrator.email
    where administrator.user_id = (select auth.uid())
  );
$$;

create function private.configure_admin_email(configured_email text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
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
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

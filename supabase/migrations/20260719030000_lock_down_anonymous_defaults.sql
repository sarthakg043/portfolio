-- Supabase's platform defaults grant new objects in the public schema to API
-- roles. Anonymous access must be an explicit, reviewed choice so future
-- schema additions cannot accidentally expose a mutation or RPC boundary.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon;

alter default privileges for role postgres in schema public
  revoke all on functions from anon;

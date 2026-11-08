alter table public.articles add column is_edited boolean not null default false;

create function private.track_article_edit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.is_edited := old.is_edited or new.is_edited or (
    (to_jsonb(new) - array['is_edited', 'updated_at', 'search_vector', 'status', 'published_at', 'scheduled_at', 'deleted_at'])
    is distinct from
    (to_jsonb(old) - array['is_edited', 'updated_at', 'search_vector', 'status', 'published_at', 'scheduled_at', 'deleted_at'])
  );
  return new;
end;
$$;

revoke execute on function private.track_article_edit() from public, anon, authenticated;

create trigger articles_track_edit
before update on public.articles
for each row execute function private.track_article_edit();

-- Recover only edits demonstrated by differing saved revisions, without
-- inventing edit history from timestamp differences or changing edit dates.
alter table public.articles disable trigger articles_set_updated_at;
with history as (
  select article_id, row_number() over versions as version,
    jsonb_build_array(title, content, content_text) as document,
    lag(jsonb_build_array(title, content, content_text)) over versions as previous_document
  from public.article_revisions
  window versions as (partition by article_id order by created_at, id)
)
update public.articles set is_edited = true
where id in (select article_id from history where version > 1 and document is distinct from previous_document);
alter table public.articles enable trigger articles_set_updated_at;

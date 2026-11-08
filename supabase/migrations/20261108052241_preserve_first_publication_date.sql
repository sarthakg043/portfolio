create or replace function private.track_article_edit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Once published, edits and lifecycle changes must retain the original date.
  if old.published_at is not null then
    new.published_at := old.published_at;
  end if;
  new.is_edited := old.is_edited or new.is_edited or (
    (to_jsonb(new) - array['is_edited', 'updated_at', 'search_vector', 'status', 'published_at', 'scheduled_at', 'deleted_at'])
    is distinct from
    (to_jsonb(old) - array['is_edited', 'updated_at', 'search_vector', 'status', 'published_at', 'scheduled_at', 'deleted_at'])
  );
  return new;
end;
$$;

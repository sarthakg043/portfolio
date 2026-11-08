begin;

do $$
declare
  administrator uuid;
  article_id uuid;
  edited boolean;
begin
  select user_id into administrator from private.admin_users limit 1;
  if administrator is null then raise exception 'An administrator fixture is required'; end if;

  insert into public.articles (author_id, title, slug)
    values (administrator, 'Edit tracking test', 'edit-tracking-test-' || gen_random_uuid())
    returning id, is_edited into article_id, edited;
  if edited then raise exception 'New articles must not be marked edited'; end if;

  update public.articles set status = 'published', published_at = now() where id = article_id
    returning is_edited into edited;
  if edited then raise exception 'Publishing alone must not count as editing'; end if;

  declare
    first_published timestamptz;
    after_edit timestamptz;
  begin
    select published_at into first_published from public.articles where id = article_id;
    update public.articles set published_at = '2000-01-01T00:00:00Z' where id = article_id
      returning published_at into after_edit;
    if after_edit is distinct from first_published then raise exception 'Republishing must preserve the first publication date'; end if;
    update public.articles set published_at = null, status = 'draft' where id = article_id
      returning published_at into after_edit;
    if after_edit is distinct from first_published then raise exception 'Unpublishing must preserve the first publication date'; end if;
  end;

  update public.articles set title = title where id = article_id returning is_edited into edited;
  if edited then raise exception 'A no-op save must not count as editing'; end if;

  update public.articles set status = 'draft' where id = article_id returning is_edited into edited;
  if edited then raise exception 'Unpublishing alone must not count as editing'; end if;

  update public.articles set content_text = 'A real content change' where id = article_id
    returning is_edited into edited;
  if not edited then raise exception 'A content change must mark the article edited'; end if;

  update public.articles set is_edited = false, status = 'published' where id = article_id
    returning is_edited into edited;
  if not edited then raise exception 'Edit history must never reset to false'; end if;

  insert into public.articles (author_id, title, slug)
    values (administrator, 'Settings tracking test', 'settings-tracking-test-' || gen_random_uuid())
    returning id into article_id;
  update public.articles set seo_title = 'Changed SEO title' where id = article_id
    returning is_edited into edited;
  if not edited then raise exception 'Settings changes must mark the article edited'; end if;
end;
$$;

select 'Article edit tracking checks passed' as result;
rollback;

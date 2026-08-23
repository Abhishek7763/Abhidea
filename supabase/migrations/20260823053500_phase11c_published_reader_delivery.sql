-- ABHIDEA Phase 11C: make live publication snapshots self-contained for public Reader delivery.
-- Drafts and immutable revisions remain private. Public reads still rely on published_localizations RLS.

alter table public.published_localizations
  add column content_type_name text,
  add column content_type_slug text;

update public.published_localizations live
set
  content_type_name = ct.name,
  content_type_slug = ct.slug
from public.content_types ct
where ct.id = live.content_type_id;

alter table public.published_localizations
  alter column content_type_name set not null,
  alter column content_type_slug set not null,
  add constraint published_localizations_content_type_name_shape
    check (char_length(btrim(content_type_name)) between 1 and 120),
  add constraint published_localizations_content_type_slug_shape
    check (content_type_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

create or replace function private.stamp_publication_content_type()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  select ct.name, ct.slug
  into new.content_type_name, new.content_type_slug
  from public.content_types ct
  where ct.id = new.content_type_id;

  if not found then
    raise exception using errcode = '23503', message = 'Publication content type does not exist.';
  end if;

  return new;
end;
$$;

revoke all on function private.stamp_publication_content_type() from public, anon, authenticated;

create trigger published_localizations_stamp_content_type
before insert or update of content_type_id on public.published_localizations
for each row execute function private.stamp_publication_content_type();

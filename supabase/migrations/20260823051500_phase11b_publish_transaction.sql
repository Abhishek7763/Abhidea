-- ABHIDEA Phase 11B: publish preflight + atomic revision/live snapshot transaction.
-- Public Reader delivery remains fixture-backed; this migration only creates the safe publish mutation.

create or replace function private.is_publishable_reader_document(p_document jsonb)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_block jsonb;
  v_item jsonb;
  v_type text;
  v_id text;
  v_ids text[] := array[]::text[];
begin
  if p_document is null
     or jsonb_typeof(p_document) is distinct from 'object'
     or (p_document ->> 'schemaVersion') is distinct from '1'
     or jsonb_typeof(p_document -> 'blocks') is distinct from 'array'
     or jsonb_array_length(p_document -> 'blocks') < 1
     or jsonb_array_length(p_document -> 'blocks') > 300 then
    return false;
  end if;

  for v_block in select value from jsonb_array_elements(p_document -> 'blocks') loop
    if jsonb_typeof(v_block) is distinct from 'object' then
      return false;
    end if;

    v_id := v_block ->> 'id';
    if v_id is null
       or v_id !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$'
       or v_id = any(v_ids) then
      return false;
    end if;
    v_ids := array_append(v_ids, v_id);

    v_type := v_block ->> 'type';
    case v_type
      when 'paragraph' then
        if char_length(btrim(coalesce(v_block ->> 'text', ''))) = 0 then return false; end if;
      when 'heading' then
        if char_length(btrim(coalesce(v_block ->> 'text', ''))) = 0
           or coalesce(v_block ->> 'level', '') not in ('2', '3') then return false; end if;
      when 'quote' then
        if char_length(btrim(coalesce(v_block ->> 'text', ''))) = 0 then return false; end if;
      when 'list' then
        if coalesce(v_block ->> 'style', '') not in ('ordered', 'unordered')
           or jsonb_typeof(v_block -> 'items') is distinct from 'array'
           or jsonb_array_length(v_block -> 'items') < 1 then
          return false;
        end if;
        for v_item in select value from jsonb_array_elements(v_block -> 'items') loop
          if jsonb_typeof(v_item) is distinct from 'string'
             or char_length(btrim(v_item #>> '{}')) = 0 then
            return false;
          end if;
        end loop;
      when 'callout' then
        if coalesce(v_block ->> 'tone', '') not in ('note', 'key-idea', 'warning')
           or char_length(btrim(coalesce(v_block ->> 'text', ''))) = 0 then return false; end if;
      when 'divider' then
        null;
      when 'closure' then
        if coalesce(v_block ->> 'variant', '') not in ('abhidea-take', 'conclusion')
           or char_length(btrim(coalesce(v_block ->> 'title', ''))) = 0
           or char_length(btrim(coalesce(v_block ->> 'text', ''))) = 0 then return false; end if;
      else
        return false;
    end case;
  end loop;

  return true;
end;
$$;

revoke all on function private.is_publishable_reader_document(jsonb) from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_publishable_reader_document(jsonb) to authenticated;

create or replace function public.update_content_draft(
  p_localization_id uuid,
  p_expected_lock_version bigint,
  p_title text,
  p_slug text,
  p_summary text,
  p_body_json jsonb,
  p_editorial_status text
)
returns table(lock_version bigint, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lock_version bigint;
  v_updated_at timestamptz;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'An authenticated Studio session is required.';
  end if;

  if not exists (
    select 1 from public.studio_members sm
    where sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception using errcode = '42501', message = 'Active Studio membership is required.';
  end if;

  if p_expected_lock_version is null or p_expected_lock_version < 1 then
    raise exception using errcode = '22023', message = 'Expected draft lock version is invalid.';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) = 0 or char_length(btrim(p_title)) > 180 then
    raise exception using errcode = '22023', message = 'Draft title must be between 1 and 180 characters.';
  end if;
  if char_length(btrim(coalesce(p_slug, ''))) = 0 or char_length(btrim(p_slug)) > 180 then
    raise exception using errcode = '22023', message = 'Draft slug must be between 1 and 180 characters.';
  end if;
  if char_length(coalesce(p_summary, '')) > 1200 then
    raise exception using errcode = '22023', message = 'Draft summary is too long.';
  end if;
  if p_editorial_status not in ('draft', 'needs_review', 'ready') then
    raise exception using errcode = '22023', message = 'Draft editorial status is invalid.';
  end if;
  if p_body_json is null
     or jsonb_typeof(p_body_json) is distinct from 'object'
     or (p_body_json ->> 'schemaVersion') is distinct from '1'
     or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array'
     or jsonb_array_length(p_body_json -> 'blocks') > 300 then
    raise exception using errcode = '22023', message = 'Draft body must use the ABHIDEA structured document schema.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_body_json -> 'blocks') block
    where jsonb_typeof(block) is distinct from 'object'
       or (block ->> 'type') is null
       or block ->> 'type' not in ('paragraph', 'heading', 'quote', 'list', 'callout', 'divider', 'closure')
  ) then
    raise exception using errcode = '22023', message = 'Draft body contains unsupported editor blocks.';
  end if;
  if p_editorial_status = 'ready' and not private.is_publishable_reader_document(p_body_json) then
    raise exception using errcode = '22023', message = 'Ready drafts need at least one complete, valid Reader block.';
  end if;

  update public.content_drafts draft
  set
    title = btrim(p_title),
    slug = btrim(p_slug),
    summary = btrim(coalesce(p_summary, '')),
    body_json = p_body_json,
    editorial_status = p_editorial_status,
    lock_version = draft.lock_version + 1
  where draft.localization_id = p_localization_id
    and draft.lock_version = p_expected_lock_version
  returning draft.lock_version, draft.updated_at into v_lock_version, v_updated_at;

  if not found then
    if exists (select 1 from public.content_drafts draft where draft.localization_id = p_localization_id) then
      raise exception using errcode = '40001', message = 'Draft changed since it was opened.';
    end if;
    raise exception using errcode = 'P0002', message = 'Draft not found.';
  end if;

  return query select v_lock_version, v_updated_at;
end;
$$;

revoke all on function public.update_content_draft(uuid, bigint, text, text, text, jsonb, text)
from public, anon, authenticated;
grant execute on function public.update_content_draft(uuid, bigint, text, text, text, jsonb, text)
to authenticated;

create or replace function private.publish_content_draft_impl(
  p_localization_id uuid,
  p_expected_lock_version bigint
)
returns table(
  revision_id uuid,
  revision_number bigint,
  publication_state text,
  published_at timestamptz,
  lock_version bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_draft record;
  v_subjects jsonb := '[]'::jsonb;
  v_revision_id uuid;
  v_revision_number bigint;
  v_now timestamptz := now();
  v_published_at timestamptz;
  v_next_lock_version bigint;
  v_reason text;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'An authenticated Studio session is required.';
  end if;

  if not exists (
    select 1 from public.studio_members sm
    where sm.user_id = v_actor
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception using errcode = '42501', message = 'Active Studio membership is required.';
  end if;

  if p_expected_lock_version is null or p_expected_lock_version < 1 then
    raise exception using errcode = '22023', message = 'Expected draft lock version is invalid.';
  end if;

  select
    d.localization_id,
    d.title,
    d.slug,
    d.summary,
    d.body_json,
    d.editorial_status,
    d.lock_version,
    l.content_id,
    l.locale,
    c.content_type_id,
    ct.name as content_type_name,
    ct.slug as content_type_slug
  into v_draft
  from public.content_drafts d
  join public.content_localizations l on l.id = d.localization_id
  join public.contents c on c.id = l.content_id
  join public.content_types ct on ct.id = c.content_type_id
  where d.localization_id = p_localization_id
  for update of d;

  if not found then
    raise exception using errcode = 'P0002', message = 'Draft not found.';
  end if;

  if v_draft.lock_version <> p_expected_lock_version then
    raise exception using errcode = '40001', message = 'Draft changed since it was opened.';
  end if;
  if v_draft.editorial_status <> 'ready' then
    raise exception using errcode = '22023', message = 'Draft must be marked Ready before publishing.';
  end if;
  if char_length(btrim(v_draft.title)) < 1 or char_length(btrim(v_draft.title)) > 180 then
    raise exception using errcode = '22023', message = 'Publish preflight failed: title is invalid.';
  end if;
  if char_length(btrim(v_draft.slug)) < 1
     or char_length(btrim(v_draft.slug)) > 180
     or btrim(v_draft.slug) ~ '[[:space:]/?#]' then
    raise exception using errcode = '22023', message = 'Publish preflight failed: slug is invalid.';
  end if;
  if char_length(v_draft.summary) > 1200 then
    raise exception using errcode = '22023', message = 'Publish preflight failed: summary is too long.';
  end if;
  if not private.is_publishable_reader_document(v_draft.body_json) then
    raise exception using errcode = '22023', message = 'Publish preflight failed: Reader body is incomplete or unsupported.';
  end if;

  if exists (
    select 1 from public.published_localizations live
    where live.locale = v_draft.locale
      and live.slug = v_draft.slug
      and live.localization_id <> p_localization_id
  ) then
    raise exception using errcode = '23505', message = 'That live slug is already used by another edition.';
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object('name', s.name, 'slug', s.slug) order by s.name, s.slug),
    '[]'::jsonb
  )
  into v_subjects
  from public.content_subjects cs
  join public.subjects s on s.id = cs.subject_id
  where cs.content_id = v_draft.content_id;

  select coalesce(max(r.revision_number), 0) + 1
  into v_revision_number
  from public.content_revisions r
  where r.localization_id = p_localization_id;

  v_reason := case
    when exists (select 1 from public.published_localizations live where live.localization_id = p_localization_id)
      then 'republish'
    else 'publish'
  end;

  insert into public.content_revisions (
    localization_id,
    revision_number,
    snapshot_json,
    reason,
    created_by,
    created_at
  )
  values (
    p_localization_id,
    v_revision_number,
    jsonb_build_object(
      'schemaVersion', 1,
      'contentId', v_draft.content_id,
      'localizationId', p_localization_id,
      'locale', v_draft.locale,
      'contentType', jsonb_build_object(
        'id', v_draft.content_type_id,
        'name', v_draft.content_type_name,
        'slug', v_draft.content_type_slug
      ),
      'title', btrim(v_draft.title),
      'slug', btrim(v_draft.slug),
      'summary', btrim(v_draft.summary),
      'body', v_draft.body_json,
      'subjects', v_subjects,
      'editorialStatus', v_draft.editorial_status
    ),
    v_reason,
    v_actor,
    v_now
  )
  returning id into v_revision_id;

  select live.published_at
  into v_published_at
  from public.published_localizations live
  where live.localization_id = p_localization_id;

  v_published_at := coalesce(v_published_at, v_now);

  insert into public.published_localizations (
    localization_id,
    content_id,
    revision_id,
    content_type_id,
    locale,
    slug,
    title,
    summary,
    body_json,
    subjects_json,
    publication_state,
    published_at,
    updated_at,
    published_by,
    updated_by
  )
  values (
    p_localization_id,
    v_draft.content_id,
    v_revision_id,
    v_draft.content_type_id,
    v_draft.locale,
    btrim(v_draft.slug),
    btrim(v_draft.title),
    btrim(v_draft.summary),
    v_draft.body_json,
    v_subjects,
    'published',
    v_published_at,
    v_now,
    v_actor,
    v_actor
  )
  on conflict (localization_id) do update
  set
    content_id = excluded.content_id,
    revision_id = excluded.revision_id,
    content_type_id = excluded.content_type_id,
    locale = excluded.locale,
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    body_json = excluded.body_json,
    subjects_json = excluded.subjects_json,
    publication_state = 'published',
    updated_at = v_now,
    updated_by = v_actor;

  update public.content_drafts d
  set
    editorial_status = 'draft',
    lock_version = d.lock_version + 1
  where d.localization_id = p_localization_id
  returning d.lock_version into v_next_lock_version;

  return query
  select v_revision_id, v_revision_number, 'published'::text, v_published_at, v_next_lock_version;
end;
$$;

revoke all on function private.publish_content_draft_impl(uuid, bigint) from public, anon, authenticated;
grant execute on function private.publish_content_draft_impl(uuid, bigint) to authenticated;

create or replace function public.publish_content_draft(
  p_localization_id uuid,
  p_expected_lock_version bigint
)
returns table(
  revision_id uuid,
  revision_number bigint,
  publication_state text,
  published_at timestamptz,
  lock_version bigint
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.publish_content_draft_impl(p_localization_id, p_expected_lock_version);
$$;

revoke all on function public.publish_content_draft(uuid, bigint) from public, anon, authenticated;
grant execute on function public.publish_content_draft(uuid, bigint) to authenticated;

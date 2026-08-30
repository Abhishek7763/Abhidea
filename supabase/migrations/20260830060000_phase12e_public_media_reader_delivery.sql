-- ABHIDEA Phase 12E: promote optimized Figure media into public Storage and
-- make live Reader snapshots self-contained without exposing private media tables.

alter table public.published_localizations
  add column media_json jsonb not null default '[]'::jsonb,
  add constraint published_localizations_media_json_array
    check (jsonb_typeof(media_json) = 'array');

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
      when 'figure' then
        if coalesce(v_block ->> 'mediaId', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
           or char_length(btrim(coalesce(v_block ->> 'alt', ''))) = 0
           or char_length(v_block ->> 'alt') > 500
           or char_length(coalesce(v_block ->> 'caption', '')) > 2000
           or char_length(coalesce(v_block ->> 'credit', '')) > 500 then
          return false;
        end if;
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
grant execute on function private.is_publishable_reader_document(jsonb) to authenticated;

create or replace function private.prepare_reader_media_promotion_impl(
  p_localization_id uuid,
  p_expected_lock_version bigint
)
returns table(
  media_id uuid,
  source_storage_key text,
  public_storage_key text,
  object_exists boolean,
  finalized boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_body jsonb;
  v_lock_version bigint;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'An authenticated Studio session is required.';
  end if;

  if not exists (
    select 1
    from public.studio_members sm
    where sm.user_id = v_actor
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception using errcode = '42501', message = 'Active Studio membership is required.';
  end if;

  select d.body_json, d.lock_version
  into v_body, v_lock_version
  from public.content_drafts d
  where d.localization_id = p_localization_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Draft not found.';
  end if;

  if p_expected_lock_version is null
     or p_expected_lock_version < 1
     or v_lock_version <> p_expected_lock_version then
    raise exception using errcode = '40001', message = 'Draft changed since it was opened.';
  end if;

  if not private.is_publishable_reader_document(v_body) then
    raise exception using errcode = '22023', message = 'Reader body is incomplete or unsupported.';
  end if;

  if exists (
    select 1
    from (
      select distinct (block ->> 'mediaId')::uuid as media_id
      from jsonb_array_elements(v_body -> 'blocks') block
      where block ->> 'type' = 'figure'
    ) figure
    left join public.media_assets ma on ma.id = figure.media_id
    where ma.id is null
       or ma.media_kind <> 'image'
       or ma.asset_state <> 'ready'
       or ma.private_storage_key is null
       or ma.optimized_storage_key is null
       or ma.optimized_at is null
       or ma.width is null
       or ma.height is null
       or (ma.public_storage_key is not null and ma.public_storage_key <> format('reader/%s/main.webp', ma.id))
  ) then
    raise exception using errcode = '22023', message = 'Figure media is not eligible for public Reader promotion.';
  end if;

  return query
  select
    ma.id,
    ma.optimized_storage_key,
    format('reader/%s/main.webp', ma.id),
    exists (
      select 1
      from storage.objects so
      where so.bucket_id = 'media-public'
        and so.name = format('reader/%s/main.webp', ma.id)
    ),
    ma.public_storage_key = format('reader/%s/main.webp', ma.id)
      and exists (
        select 1
        from storage.objects so
        where so.bucket_id = 'media-public'
          and so.name = format('reader/%s/main.webp', ma.id)
      )
  from (
    select distinct (block ->> 'mediaId')::uuid as media_id
    from jsonb_array_elements(v_body -> 'blocks') block
    where block ->> 'type' = 'figure'
  ) figure
  join public.media_assets ma on ma.id = figure.media_id
  order by ma.id;
end;
$$;

revoke all on function private.prepare_reader_media_promotion_impl(uuid, bigint)
from public, anon, authenticated;
grant execute on function private.prepare_reader_media_promotion_impl(uuid, bigint)
to authenticated;

create or replace function public.prepare_reader_media_promotion(
  p_localization_id uuid,
  p_expected_lock_version bigint
)
returns table(
  media_id uuid,
  source_storage_key text,
  public_storage_key text,
  object_exists boolean,
  finalized boolean
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.prepare_reader_media_promotion_impl(
    p_localization_id,
    p_expected_lock_version
  );
$$;

revoke all on function public.prepare_reader_media_promotion(uuid, bigint)
from public, anon;
grant execute on function public.prepare_reader_media_promotion(uuid, bigint)
to authenticated;

create policy "studio can publish optimized reader media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media-public'
  and (storage.foldername(name))[1] = 'reader'
  and exists (
    select 1
    from public.media_assets ma
    where ma.id::text = (storage.foldername(name))[2]
      and name = ('reader/' || ma.id::text || '/main.webp')
      and ma.media_kind = 'image'
      and ma.asset_state = 'ready'
      and ma.private_storage_key is not null
      and ma.optimized_storage_key is not null
      and ma.width is not null
      and ma.height is not null
      and (ma.public_storage_key is null or ma.public_storage_key = name)
      and exists (
        select 1
        from public.media_usages mu
        where mu.media_id = ma.id
          and mu.usage_kind = 'reader_figure'
      )
  )
  and exists (
    select 1
    from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create or replace function private.finalize_reader_media_promotion_impl(
  p_media_id uuid,
  p_public_storage_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_asset public.media_assets%rowtype;
  v_expected_key text;
  v_metadata jsonb;
  v_size bigint;
  v_mime text;
begin
  if v_actor is null then
    raise exception using errcode = '28000', message = 'An authenticated Studio session is required.';
  end if;

  if not exists (
    select 1
    from public.studio_members sm
    where sm.user_id = v_actor
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception using errcode = '42501', message = 'Active Studio membership is required.';
  end if;

  select * into v_asset
  from public.media_assets ma
  where ma.id = p_media_id
  for update;

  if not found
     or v_asset.media_kind <> 'image'
     or v_asset.asset_state <> 'ready'
     or v_asset.private_storage_key is null
     or v_asset.optimized_storage_key is null
     or v_asset.width is null
     or v_asset.height is null then
    raise exception using errcode = '22023', message = 'Media asset is not eligible for public Reader promotion.';
  end if;

  v_expected_key := format('reader/%s/main.webp', v_asset.id);
  if p_public_storage_key is null or p_public_storage_key <> v_expected_key then
    raise exception using errcode = '22023', message = 'Public media path does not match asset.';
  end if;

  if v_asset.public_storage_key is not null and v_asset.public_storage_key <> v_expected_key then
    raise exception using errcode = '22023', message = 'Media asset already has a different public path.';
  end if;

  select so.metadata into v_metadata
  from storage.objects so
  where so.bucket_id = 'media-public'
    and so.name = v_expected_key
  limit 1;

  if v_metadata is null then
    raise exception using errcode = '22023', message = 'Public Reader media object was not found.';
  end if;

  v_size := nullif(v_metadata ->> 'size', '')::bigint;
  v_mime := nullif(v_metadata ->> 'mimetype', '');
  if v_size is null or v_size < 1 or v_size > 10485760 or v_mime <> 'image/webp' then
    raise exception using errcode = '22023', message = 'Public Reader media object is invalid.';
  end if;

  update public.media_assets
  set public_storage_key = v_expected_key,
      updated_by = v_actor
  where id = p_media_id;
end;
$$;

revoke all on function private.finalize_reader_media_promotion_impl(uuid, text)
from public, anon, authenticated;
grant execute on function private.finalize_reader_media_promotion_impl(uuid, text)
to authenticated;

create or replace function public.finalize_reader_media_promotion(
  p_media_id uuid,
  p_public_storage_key text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.finalize_reader_media_promotion_impl(
    p_media_id,
    p_public_storage_key
  );
$$;

revoke all on function public.finalize_reader_media_promotion(uuid, text)
from public, anon;
grant execute on function public.finalize_reader_media_promotion(uuid, text)
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
  v_media jsonb := '[]'::jsonb;
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
    select 1
    from (
      select distinct (block ->> 'mediaId')::uuid as media_id
      from jsonb_array_elements(v_draft.body_json -> 'blocks') block
      where block ->> 'type' = 'figure'
    ) figure
    left join public.media_assets ma on ma.id = figure.media_id
    left join storage.objects so
      on so.bucket_id = 'media-public'
     and so.name = ma.public_storage_key
    where ma.id is null
       or ma.media_kind <> 'image'
       or ma.asset_state <> 'ready'
       or ma.optimized_storage_key is null
       or ma.public_storage_key is null
       or ma.public_storage_key <> format('reader/%s/main.webp', ma.id)
       or ma.width is null
       or ma.height is null
       or so.id is null
       or nullif(so.metadata ->> 'mimetype', '') <> 'image/webp'
  ) then
    raise exception using errcode = '22023', message = 'Publish preflight failed: Figure media is not publicly promoted.';
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'mediaId', ma.id,
        'storageKey', ma.public_storage_key,
        'width', ma.width,
        'height', ma.height
      ) order by ma.id
    ),
    '[]'::jsonb
  )
  into v_media
  from (
    select distinct (block ->> 'mediaId')::uuid as media_id
    from jsonb_array_elements(v_draft.body_json -> 'blocks') block
    where block ->> 'type' = 'figure'
  ) figure
  join public.media_assets ma on ma.id = figure.media_id;

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
      'media', v_media,
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
    media_json,
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
    v_media,
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
    media_json = excluded.media_json,
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

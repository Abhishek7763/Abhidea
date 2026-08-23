-- ABHIDEA Phase 12D: Figure blocks + atomic Media where-used synchronization.
-- Draft media stays private. Public promotion is deliberately deferred.

create unique index media_usages_reader_figure_unique
on public.media_usages(media_id, localization_id, usage_kind)
where localization_id is not null and usage_kind = 'reader_figure';

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
  v_content_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'An authenticated Studio session is required.';
  end if;

  if not exists (
    select 1
    from public.studio_members sm
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
    select 1
    from jsonb_array_elements(p_body_json -> 'blocks') block
    where jsonb_typeof(block) is distinct from 'object'
       or (block ->> 'type') is null
       or block ->> 'type' not in ('paragraph', 'heading', 'quote', 'list', 'callout', 'figure', 'divider', 'closure')
  ) then
    raise exception using errcode = '22023', message = 'Draft body contains unsupported editor blocks.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_body_json -> 'blocks') block
    where block ->> 'type' = 'figure'
      and (
        coalesce(block ->> 'mediaId', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        or char_length(btrim(coalesce(block ->> 'alt', ''))) = 0
        or char_length(block ->> 'alt') > 500
        or char_length(coalesce(block ->> 'caption', '')) > 2000
        or char_length(coalesce(block ->> 'credit', '')) > 500
      )
  ) then
    raise exception using errcode = '22023', message = 'Figure block metadata is invalid.';
  end if;

  if exists (
    select 1
    from (
      select distinct (block ->> 'mediaId')::uuid as media_id
      from jsonb_array_elements(p_body_json -> 'blocks') block
      where block ->> 'type' = 'figure'
    ) figure
    left join public.media_assets ma on ma.id = figure.media_id
    where ma.id is null
       or ma.media_kind <> 'image'
       or ma.asset_state <> 'ready'
       or ma.private_storage_key is null
       or ma.optimized_storage_key is null
       or ma.width is null
       or ma.height is null
  ) then
    raise exception using errcode = '22023', message = 'Figure references media that is not ready for Reader use.';
  end if;

  -- The current publish helper intentionally does not accept Figure yet.
  -- This keeps Figure-containing drafts private until Phase 12E public media promotion exists.
  if p_editorial_status = 'ready' and not private.is_publishable_reader_document(p_body_json) then
    raise exception using errcode = '22023', message = 'Ready drafts need complete publishable Reader blocks.';
  end if;

  select cl.content_id into v_content_id
  from public.content_localizations cl
  where cl.id = p_localization_id
    and cl.lifecycle_state = 'active';

  if v_content_id is null then
    raise exception using errcode = 'P0002', message = 'Draft localization not found.';
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
  returning draft.lock_version, draft.updated_at
  into v_lock_version, v_updated_at;

  if not found then
    if exists (
      select 1 from public.content_drafts draft
      where draft.localization_id = p_localization_id
    ) then
      raise exception using errcode = '40001', message = 'Draft changed since it was opened.';
    end if;
    raise exception using errcode = 'P0002', message = 'Draft not found.';
  end if;

  delete from public.media_usages mu
  where mu.localization_id = p_localization_id
    and mu.usage_kind = 'reader_figure';

  insert into public.media_usages (
    id,
    media_id,
    content_id,
    localization_id,
    usage_kind,
    created_by,
    updated_by,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    figure.media_id,
    v_content_id,
    p_localization_id,
    'reader_figure',
    auth.uid(),
    auth.uid(),
    now(),
    now()
  from (
    select distinct (block ->> 'mediaId')::uuid as media_id
    from jsonb_array_elements(p_body_json -> 'blocks') block
    where block ->> 'type' = 'figure'
  ) figure
  on conflict do nothing;

  return query select v_lock_version, v_updated_at;
end;
$$;

revoke all on function public.update_content_draft(uuid, bigint, text, text, text, jsonb, text)
from public, anon;
grant execute on function public.update_content_draft(uuid, bigint, text, text, text, jsonb, text)
to authenticated;

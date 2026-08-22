-- ABHIDEA Phase 10D: explicit conflict-safe structured draft updates.
-- SECURITY INVOKER keeps authenticated table grants and Phase 10A RLS authoritative.

create or replace function public.update_content_draft(
  p_localization_id uuid,
  p_expected_lock_version bigint,
  p_title text,
  p_slug text,
  p_summary text,
  p_body_json jsonb
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

  if p_body_json is null
     or jsonb_typeof(p_body_json) is distinct from 'object'
     or (p_body_json ->> 'schemaVersion') is distinct from '1'
     or jsonb_typeof(p_body_json -> 'blocks') is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Draft body must use the ABHIDEA structured document schema.';
  end if;

  if jsonb_array_length(p_body_json -> 'blocks') > 300 then
    raise exception using errcode = '22023', message = 'Draft body exceeds the Phase 10D block limit.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_body_json -> 'blocks') block
    where jsonb_typeof(block) is distinct from 'object'
       or (block ->> 'type') is null
       or block ->> 'type' not in ('paragraph', 'heading', 'quote', 'list', 'callout', 'divider', 'closure')
  ) then
    raise exception using errcode = '22023', message = 'Draft body contains unsupported editor blocks.';
  end if;

  update public.content_drafts draft
  set
    title = btrim(p_title),
    slug = btrim(p_slug),
    summary = btrim(coalesce(p_summary, '')),
    body_json = p_body_json,
    lock_version = draft.lock_version + 1
  where draft.localization_id = p_localization_id
    and draft.lock_version = p_expected_lock_version
  returning draft.lock_version, draft.updated_at
  into v_lock_version, v_updated_at;

  if not found then
    if exists (
      select 1
      from public.content_drafts draft
      where draft.localization_id = p_localization_id
    ) then
      raise exception using errcode = '40001', message = 'Draft changed since it was opened.';
    end if;

    raise exception using errcode = 'P0002', message = 'Draft not found.';
  end if;

  return query select v_lock_version, v_updated_at;
end;
$$;

revoke all on function public.update_content_draft(uuid, bigint, text, text, text, jsonb)
from public, anon, authenticated;

grant execute on function public.update_content_draft(uuid, bigint, text, text, text, jsonb)
to authenticated;

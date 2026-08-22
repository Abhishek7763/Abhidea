-- ABHIDEA Phase 10E: create the missing EN/HI edition under one logical content identity.
-- SECURITY INVOKER keeps Phase 10A table grants and RLS authoritative.

create or replace function public.create_linked_content_edition(
  p_source_localization_id uuid,
  p_locale text,
  p_title text,
  p_slug text,
  p_summary text,
  p_body_json jsonb
)
returns table (
  content_id uuid,
  localization_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_content_id uuid;
  v_source_locale text;
  v_localization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Studio authentication is required.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.studio_members sm
    where sm.user_id = auth.uid()
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception 'Active Studio membership is required.' using errcode = '42501';
  end if;

  if p_locale not in ('en', 'hi') then
    raise exception 'Unsupported edition locale.' using errcode = '22023';
  end if;

  if p_title is null or char_length(btrim(p_title)) < 1 or char_length(btrim(p_title)) > 180 then
    raise exception 'Edition title must be between 1 and 180 characters.' using errcode = '22023';
  end if;

  if p_slug is null
    or char_length(p_slug) < 1
    or char_length(p_slug) > 180
    or p_slug <> btrim(p_slug)
    or p_slug ~ '[[:space:]/?#]'
  then
    raise exception 'Edition slug is invalid.' using errcode = '22023';
  end if;

  if p_summary is null or char_length(p_summary) > 1200 then
    raise exception 'Edition summary is invalid.' using errcode = '22023';
  end if;

  if p_body_json is null
    or jsonb_typeof(p_body_json) <> 'object'
    or p_body_json ->> 'schemaVersion' <> '1'
    or jsonb_typeof(p_body_json -> 'blocks') <> 'array'
  then
    raise exception 'Edition body does not match schemaVersion 1.' using errcode = '22023';
  end if;

  select cl.content_id, cl.locale
  into v_content_id, v_source_locale
  from public.content_localizations cl
  where cl.id = p_source_localization_id;

  if not found then
    raise exception 'Source edition not found.' using errcode = 'P0002';
  end if;

  if p_locale = v_source_locale then
    raise exception 'Linked edition must use the other supported locale.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.content_localizations cl
    where cl.content_id = v_content_id
      and cl.locale = p_locale
  ) then
    raise exception 'That language edition already exists.' using errcode = '23505';
  end if;

  insert into public.content_localizations (
    content_id,
    locale,
    created_by,
    updated_by
  )
  values (
    v_content_id,
    p_locale,
    auth.uid(),
    auth.uid()
  )
  returning id into v_localization_id;

  insert into public.content_drafts (
    localization_id,
    title,
    slug,
    summary,
    body_json,
    editorial_status,
    created_by,
    updated_by
  )
  values (
    v_localization_id,
    btrim(p_title),
    p_slug,
    p_summary,
    p_body_json,
    'draft',
    auth.uid(),
    auth.uid()
  );

  return query select v_content_id, v_localization_id;
end;
$$;

revoke all on function public.create_linked_content_edition(uuid, text, text, text, text, jsonb)
from public, anon, authenticated;

grant execute on function public.create_linked_content_edition(uuid, text, text, text, text, jsonb)
to authenticated;

comment on function public.create_linked_content_edition(uuid, text, text, text, text, jsonb) is
  'Creates the missing English or Hindi private draft under an existing logical content identity while preserving independent localized writing.';

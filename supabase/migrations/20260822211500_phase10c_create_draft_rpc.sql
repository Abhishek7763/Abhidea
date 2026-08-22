-- ABHIDEA Phase 10C: transactional private draft creation.
-- The function is SECURITY INVOKER so caller grants and table RLS remain authoritative.

create or replace function public.create_content_draft(
  p_content_type_id uuid,
  p_locale text,
  p_title text,
  p_slug text,
  p_summary text,
  p_body_json jsonb,
  p_subject_ids uuid[] default '{}'::uuid[]
)
returns table(content_id uuid, localization_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_content_id uuid;
  v_localization_id uuid;
  v_subject_ids uuid[] := coalesce(p_subject_ids, '{}'::uuid[]);
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

  if p_locale not in ('en', 'hi') then
    raise exception using errcode = '22023', message = 'Unsupported content locale.';
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

  if jsonb_typeof(p_body_json) <> 'object'
     or p_body_json ->> 'schemaVersion' <> '1'
     or jsonb_typeof(p_body_json -> 'blocks') <> 'array' then
    raise exception using errcode = '22023', message = 'Draft body must use the ABHIDEA structured document schema.';
  end if;

  if cardinality(v_subject_ids) > 12 then
    raise exception using errcode = '22023', message = 'A draft can use at most 12 subjects in this phase.';
  end if;

  if not exists (
    select 1
    from public.content_types ct
    where ct.id = p_content_type_id
      and ct.is_active = true
  ) then
    raise exception using errcode = '22023', message = 'Selected content type is unavailable.';
  end if;

  if exists (
    select 1
    from unnest(v_subject_ids) requested(subject_id)
    left join public.subjects s
      on s.id = requested.subject_id
     and s.is_active = true
    where s.id is null
  ) then
    raise exception using errcode = '22023', message = 'One or more selected subjects are unavailable.';
  end if;

  insert into public.contents (content_type_id, created_by, updated_by)
  values (p_content_type_id, auth.uid(), auth.uid())
  returning id into v_content_id;

  insert into public.content_localizations (content_id, locale, created_by, updated_by)
  values (v_content_id, p_locale, auth.uid(), auth.uid())
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
    btrim(p_slug),
    btrim(coalesce(p_summary, '')),
    p_body_json,
    'draft',
    auth.uid(),
    auth.uid()
  );

  insert into public.content_subjects (content_id, subject_id, created_by)
  select v_content_id, selected.subject_id, auth.uid()
  from (
    select distinct unnest(v_subject_ids) as subject_id
  ) selected;

  return query select v_content_id, v_localization_id;
end;
$$;

revoke all on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) to authenticated;

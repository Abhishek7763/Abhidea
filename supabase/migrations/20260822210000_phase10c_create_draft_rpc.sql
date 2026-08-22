-- ABHIDEA Phase 10C: transactional private draft creation RPC.
-- Security model: SECURITY INVOKER + existing Studio-member RLS + explicit execute grant.

create or replace function public.create_content_draft(
  p_content_type_id uuid,
  p_locale text,
  p_title text,
  p_slug text,
  p_summary text,
  p_body_json jsonb,
  p_subject_ids uuid[] default '{}'::uuid[]
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
  v_localization_id uuid;
  v_subject_ids uuid[];
  v_subject_count integer;
begin
  if auth.uid() is null then
    raise exception 'Studio authentication is required.' using errcode = '42501';
  end if;

  if p_locale not in ('en', 'hi') then
    raise exception 'Unsupported draft locale.' using errcode = '22023';
  end if;

  if p_title is null or char_length(btrim(p_title)) < 1 or char_length(btrim(p_title)) > 180 then
    raise exception 'Draft title must be between 1 and 180 characters.' using errcode = '22023';
  end if;

  if p_slug is null
    or char_length(p_slug) < 1
    or char_length(p_slug) > 180
    or p_slug <> btrim(p_slug)
    or p_slug ~ '[[:space:]/?#]'
  then
    raise exception 'Draft slug is invalid.' using errcode = '22023';
  end if;

  if p_summary is null or char_length(p_summary) > 1200 then
    raise exception 'Draft summary is invalid.' using errcode = '22023';
  end if;

  if p_body_json is null
    or jsonb_typeof(p_body_json) <> 'object'
    or p_body_json ->> 'schemaVersion' <> '1'
    or jsonb_typeof(p_body_json -> 'blocks') <> 'array'
  then
    raise exception 'Draft body does not match schemaVersion 1.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.content_types ct
    where ct.id = p_content_type_id
      and ct.is_active = true
  ) then
    raise exception 'Active Content Type not found.' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct subject_id), '{}'::uuid[])
  into v_subject_ids
  from unnest(coalesce(p_subject_ids, '{}'::uuid[])) as selected(subject_id);

  if cardinality(v_subject_ids) > 12 then
    raise exception 'A draft may have at most 12 Subjects.' using errcode = '22023';
  end if;

  if cardinality(v_subject_ids) > 0 then
    select count(*)::integer
    into v_subject_count
    from public.subjects s
    where s.id = any(v_subject_ids)
      and s.is_active = true;

    if v_subject_count <> cardinality(v_subject_ids) then
      raise exception 'One or more Subjects are unavailable.' using errcode = '22023';
    end if;
  end if;

  insert into public.contents (
    content_type_id,
    created_by,
    updated_by
  )
  values (
    p_content_type_id,
    auth.uid(),
    auth.uid()
  )
  returning id into v_content_id;

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

  if cardinality(v_subject_ids) > 0 then
    insert into public.content_subjects (
      content_id,
      subject_id,
      created_by
    )
    select
      v_content_id,
      selected_subject_id,
      auth.uid()
    from unnest(v_subject_ids) as selected(selected_subject_id);
  end if;

  return query select v_content_id, v_localization_id;
end;
$$;

revoke all on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) from public;
revoke all on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) from anon;
revoke all on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) from authenticated;
grant execute on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) to authenticated;

comment on function public.create_content_draft(uuid, text, text, text, text, jsonb, uuid[]) is
  'Creates one private localized CMS draft and optional Subject links atomically under the caller permissions and RLS policies.';

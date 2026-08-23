-- ABHIDEA Phase 11E: safe unpublish/archive lifecycle.
-- Archiving never deletes immutable revisions or the working draft. It only removes the live snapshot from public visibility.

create or replace function private.archive_published_localization_impl(
  p_localization_id uuid,
  p_expected_revision_id uuid
)
returns table(
  publication_state text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_live record;
  v_now timestamptz := now();
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

  if p_localization_id is null or p_expected_revision_id is null then
    raise exception using errcode = '22023', message = 'Archive identity is invalid.';
  end if;

  select live.revision_id, live.publication_state
  into v_live
  from public.published_localizations live
  where live.localization_id = p_localization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Published localization not found.';
  end if;

  if v_live.revision_id <> p_expected_revision_id then
    raise exception using errcode = '40001', message = 'The live revision changed before archive completed.';
  end if;

  if v_live.publication_state <> 'published' then
    raise exception using errcode = '22023', message = 'Only a currently published localization can be archived.';
  end if;

  update public.published_localizations live
  set
    publication_state = 'archived',
    updated_at = v_now,
    updated_by = v_actor
  where live.localization_id = p_localization_id;

  return query select 'archived'::text, v_now;
end;
$$;

revoke all on function private.archive_published_localization_impl(uuid, uuid)
from public, anon, authenticated;
grant execute on function private.archive_published_localization_impl(uuid, uuid)
to authenticated;

create or replace function public.archive_published_localization(
  p_localization_id uuid,
  p_expected_revision_id uuid
)
returns table(
  publication_state text,
  updated_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.archive_published_localization_impl(
    p_localization_id,
    p_expected_revision_id
  );
$$;

revoke all on function public.archive_published_localization(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.archive_published_localization(uuid, uuid)
to authenticated;

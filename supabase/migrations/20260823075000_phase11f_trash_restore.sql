-- ABHIDEA Phase 11F: reversible Trash / Restore lifecycle for localized editions.
-- Trash is a soft lifecycle state. It never deletes drafts, revisions, or publication snapshots.

alter table public.content_localizations
  add column lifecycle_state text not null default 'active'
    check (lifecycle_state in ('active', 'trashed')),
  add column trashed_at timestamptz,
  add column trashed_by uuid references auth.users(id),
  add constraint content_localizations_trash_metadata_check check (
    (lifecycle_state = 'active' and trashed_at is null and trashed_by is null)
    or
    (lifecycle_state = 'trashed' and trashed_at is not null and trashed_by is not null)
  );

create index content_localizations_lifecycle_updated_idx
  on public.content_localizations(lifecycle_state, updated_at desc);

-- Lifecycle changes must go through the audited RPCs below so a live page cannot
-- remain published while its Studio edition is in Trash.
revoke update on table public.content_localizations from authenticated;

create or replace function private.prevent_trashed_draft_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.content_localizations cl
    where cl.id = old.localization_id
      and cl.lifecycle_state = 'trashed'
  ) then
    raise exception using errcode = '55000', message = 'Trashed editions are read-only until restored.';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_trashed_draft_update() from public, anon, authenticated;

create trigger content_drafts_block_trashed_update
before update on public.content_drafts
for each row execute function private.prevent_trashed_draft_update();

create or replace function private.prevent_trashed_publication_activation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.publication_state = 'published'
     and exists (
       select 1
       from public.content_localizations cl
       where cl.id = new.localization_id
         and cl.lifecycle_state = 'trashed'
     ) then
    raise exception using errcode = '55000', message = 'Restore this edition before publishing it.';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_trashed_publication_activation() from public, anon, authenticated;

create trigger published_localizations_block_trashed_activation
before insert or update of publication_state on public.published_localizations
for each row execute function private.prevent_trashed_publication_activation();

create or replace function private.trash_content_localization_impl(
  p_localization_id uuid,
  p_expected_lock_version bigint,
  p_expected_live_revision_id uuid
)
returns table(
  lifecycle_state text,
  publication_state text,
  revision_id uuid,
  trashed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_lifecycle text;
  v_lock bigint;
  v_publication_state text;
  v_revision_id uuid;
  v_now timestamptz := now();
  v_has_publication boolean := false;
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

  if p_expected_lock_version is null or p_expected_lock_version < 1 then
    raise exception using errcode = '22023', message = 'Expected draft lock version is invalid.';
  end if;

  select cl.lifecycle_state, d.lock_version
  into v_lifecycle, v_lock
  from public.content_localizations cl
  join public.content_drafts d on d.localization_id = cl.id
  where cl.id = p_localization_id
  for update of cl, d;

  if not found then
    raise exception using errcode = 'P0002', message = 'Localized draft not found.';
  end if;

  if v_lifecycle <> 'active' then
    raise exception using errcode = '22023', message = 'Edition is already in Trash.';
  end if;

  if v_lock <> p_expected_lock_version then
    raise exception using errcode = '40001', message = 'Draft changed before Trash completed.';
  end if;

  select pl.publication_state, pl.revision_id
  into v_publication_state, v_revision_id
  from public.published_localizations pl
  where pl.localization_id = p_localization_id
  for update;

  v_has_publication := found;

  if v_has_publication then
    if p_expected_live_revision_id is null or p_expected_live_revision_id <> v_revision_id then
      raise exception using errcode = '40001', message = 'Publication changed before Trash completed.';
    end if;

    if v_publication_state = 'published' then
      update public.published_localizations pl
      set
        publication_state = 'archived',
        updated_at = v_now,
        updated_by = v_actor
      where pl.localization_id = p_localization_id;

      v_publication_state := 'archived';
    end if;
  elsif p_expected_live_revision_id is not null then
    raise exception using errcode = '40001', message = 'Publication state changed before Trash completed.';
  end if;

  update public.content_localizations cl
  set
    lifecycle_state = 'trashed',
    trashed_at = v_now,
    trashed_by = v_actor
  where cl.id = p_localization_id;

  return query
  select 'trashed'::text, v_publication_state, v_revision_id, v_now;
end;
$$;

revoke all on function private.trash_content_localization_impl(uuid, bigint, uuid)
from public, anon, authenticated;
grant execute on function private.trash_content_localization_impl(uuid, bigint, uuid)
to authenticated;

create or replace function public.trash_content_localization(
  p_localization_id uuid,
  p_expected_lock_version bigint,
  p_expected_live_revision_id uuid default null
)
returns table(
  lifecycle_state text,
  publication_state text,
  revision_id uuid,
  trashed_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.trash_content_localization_impl(
    p_localization_id,
    p_expected_lock_version,
    p_expected_live_revision_id
  );
$$;

revoke all on function public.trash_content_localization(uuid, bigint, uuid)
from public, anon, authenticated;
grant execute on function public.trash_content_localization(uuid, bigint, uuid)
to authenticated;

create or replace function private.restore_content_localization_impl(
  p_localization_id uuid,
  p_expected_lock_version bigint
)
returns table(
  lifecycle_state text,
  publication_state text,
  revision_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_lifecycle text;
  v_lock bigint;
  v_publication_state text;
  v_revision_id uuid;
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

  if p_expected_lock_version is null or p_expected_lock_version < 1 then
    raise exception using errcode = '22023', message = 'Expected draft lock version is invalid.';
  end if;

  select cl.lifecycle_state, d.lock_version
  into v_lifecycle, v_lock
  from public.content_localizations cl
  join public.content_drafts d on d.localization_id = cl.id
  where cl.id = p_localization_id
  for update of cl, d;

  if not found then
    raise exception using errcode = 'P0002', message = 'Localized draft not found.';
  end if;

  if v_lifecycle <> 'trashed' then
    raise exception using errcode = '22023', message = 'Edition is not in Trash.';
  end if;

  if v_lock <> p_expected_lock_version then
    raise exception using errcode = '40001', message = 'Draft changed before Restore completed.';
  end if;

  update public.content_localizations cl
  set
    lifecycle_state = 'active',
    trashed_at = null,
    trashed_by = null
  where cl.id = p_localization_id;

  select pl.publication_state, pl.revision_id
  into v_publication_state, v_revision_id
  from public.published_localizations pl
  where pl.localization_id = p_localization_id;

  return query
  select 'active'::text, v_publication_state, v_revision_id;
end;
$$;

revoke all on function private.restore_content_localization_impl(uuid, bigint)
from public, anon, authenticated;
grant execute on function private.restore_content_localization_impl(uuid, bigint)
to authenticated;

create or replace function public.restore_content_localization(
  p_localization_id uuid,
  p_expected_lock_version bigint
)
returns table(
  lifecycle_state text,
  publication_state text,
  revision_id uuid
)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.restore_content_localization_impl(
    p_localization_id,
    p_expected_lock_version
  );
$$;

revoke all on function public.restore_content_localization(uuid, bigint)
from public, anon, authenticated;
grant execute on function public.restore_content_localization(uuid, bigint)
to authenticated;

comment on function public.trash_content_localization(uuid, bigint, uuid) is
  'Moves one localized Studio edition to reversible Trash and archives any current public snapshot atomically.';
comment on function public.restore_content_localization(uuid, bigint) is
  'Restores one localized Studio edition from Trash without automatically republishing its archived snapshot.';

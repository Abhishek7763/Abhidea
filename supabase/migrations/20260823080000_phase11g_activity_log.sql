-- ABHIDEA Phase 11G: append-only Studio Activity Log.
-- Records lifecycle changes at the database boundary so the audit trail does not depend on UI code.

create table public.studio_activity_events (
  id uuid primary key default gen_random_uuid(),
  localization_id uuid not null references public.content_localizations(id),
  content_id uuid not null references public.contents(id),
  event_type text not null check (
    event_type in (
      'draft_created',
      'draft_saved',
      'published',
      'republished',
      'archived',
      'trashed',
      'restored'
    )
  ),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  locale text not null check (locale in ('en', 'hi')),
  title text not null default '',
  slug text not null default '',
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

create index studio_activity_events_occurred_at_idx
  on public.studio_activity_events(occurred_at desc);
create index studio_activity_events_localization_idx
  on public.studio_activity_events(localization_id, occurred_at desc);
create index studio_activity_events_content_id_idx
  on public.studio_activity_events(content_id);
create index studio_activity_events_actor_id_idx
  on public.studio_activity_events(actor_id)
  where actor_id is not null;
create index studio_activity_events_event_type_idx
  on public.studio_activity_events(event_type, occurred_at desc);

alter table public.studio_activity_events enable row level security;

revoke all on table public.studio_activity_events from anon, authenticated;
grant select on table public.studio_activity_events to authenticated;

create policy "active studio members can read activity"
on public.studio_activity_events
for select
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create or replace function private.record_studio_activity_event(
  p_localization_id uuid,
  p_event_type text,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content_id uuid;
  v_locale text;
  v_title text := '';
  v_slug text := '';
  v_actor_email text;
begin
  select
    cl.content_id,
    cl.locale,
    coalesce(d.title, ''),
    coalesce(d.slug, '')
  into v_content_id, v_locale, v_title, v_slug
  from public.content_localizations cl
  left join public.content_drafts d on d.localization_id = cl.id
  where cl.id = p_localization_id;

  if not found then
    return;
  end if;

  if p_actor_id is not null then
    select u.email
    into v_actor_email
    from auth.users u
    where u.id = p_actor_id;
  end if;

  insert into public.studio_activity_events (
    localization_id,
    content_id,
    event_type,
    actor_id,
    actor_email,
    locale,
    title,
    slug,
    metadata,
    occurred_at
  )
  values (
    p_localization_id,
    v_content_id,
    p_event_type,
    p_actor_id,
    v_actor_email,
    v_locale,
    v_title,
    v_slug,
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_occurred_at, now())
  );
end;
$$;

revoke all on function private.record_studio_activity_event(uuid, text, uuid, timestamptz, jsonb)
from public, anon, authenticated;

create or replace function private.log_content_draft_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.record_studio_activity_event(
      new.localization_id,
      'draft_created',
      coalesce(auth.uid(), new.created_by),
      new.created_at,
      jsonb_build_object(
        'editorialStatus', new.editorial_status,
        'lockVersion', new.lock_version
      )
    );
    return new;
  end if;

  if old.title is not distinct from new.title
     and old.slug is not distinct from new.slug
     and old.summary is not distinct from new.summary
     and old.body_json is not distinct from new.body_json
     and old.editorial_status is not distinct from new.editorial_status
     and old.lock_version is not distinct from new.lock_version then
    return new;
  end if;

  -- Publish/republish creates its immutable revision before resetting Ready -> Draft.
  -- That revision is the authoritative activity event, so suppress the internal draft reset.
  if exists (
    select 1
    from public.content_revisions r
    where r.localization_id = new.localization_id
      and r.created_at = now()
      and (auth.uid() is null or r.created_by = auth.uid())
  ) then
    return new;
  end if;

  perform private.record_studio_activity_event(
    new.localization_id,
    'draft_saved',
    coalesce(auth.uid(), new.updated_by),
    new.updated_at,
    jsonb_build_object(
      'fromStatus', old.editorial_status,
      'toStatus', new.editorial_status,
      'lockVersion', new.lock_version
    )
  );

  return new;
end;
$$;

revoke all on function private.log_content_draft_activity()
from public, anon, authenticated;

create trigger content_drafts_activity_log
after insert or update on public.content_drafts
for each row execute function private.log_content_draft_activity();

create or replace function private.log_content_revision_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.record_studio_activity_event(
    new.localization_id,
    case when new.reason = 'republish' then 'republished' else 'published' end,
    coalesce(auth.uid(), new.created_by),
    new.created_at,
    jsonb_build_object(
      'revisionId', new.id,
      'revisionNumber', new.revision_number,
      'reason', new.reason
    )
  );

  return new;
end;
$$;

revoke all on function private.log_content_revision_activity()
from public, anon, authenticated;

create trigger content_revisions_activity_log
after insert on public.content_revisions
for each row execute function private.log_content_revision_activity();

create or replace function private.log_publication_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.publication_state = 'published'
     and new.publication_state = 'archived' then
    perform private.record_studio_activity_event(
      new.localization_id,
      'archived',
      coalesce(auth.uid(), new.updated_by),
      new.updated_at,
      jsonb_build_object(
        'revisionId', new.revision_id,
        'slug', new.slug
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function private.log_publication_activity()
from public, anon, authenticated;

create trigger published_localizations_activity_log
after update of publication_state on public.published_localizations
for each row
when (old.publication_state is distinct from new.publication_state)
execute function private.log_publication_activity();

create or replace function private.log_localization_lifecycle_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.lifecycle_state = 'active'
     and new.lifecycle_state = 'trashed' then
    perform private.record_studio_activity_event(
      new.id,
      'trashed',
      coalesce(auth.uid(), new.trashed_by),
      new.trashed_at,
      jsonb_build_object(
        'fromState', old.lifecycle_state,
        'toState', new.lifecycle_state
      )
    );
  elsif old.lifecycle_state = 'trashed'
        and new.lifecycle_state = 'active' then
    perform private.record_studio_activity_event(
      new.id,
      'restored',
      coalesce(auth.uid(), new.updated_by),
      new.updated_at,
      jsonb_build_object(
        'fromState', old.lifecycle_state,
        'toState', new.lifecycle_state
      )
    );
  end if;

  return new;
end;
$$;

revoke all on function private.log_localization_lifecycle_activity()
from public, anon, authenticated;

create trigger content_localizations_activity_log
after update of lifecycle_state on public.content_localizations
for each row
when (old.lifecycle_state is distinct from new.lifecycle_state)
execute function private.log_localization_lifecycle_activity();

create or replace function private.prevent_studio_activity_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Studio activity events are append-only.';
end;
$$;

revoke all on function private.prevent_studio_activity_mutation()
from public, anon, authenticated;

create trigger studio_activity_events_immutable
before update or delete on public.studio_activity_events
for each row execute function private.prevent_studio_activity_mutation();

-- Backfill what can be reconstructed accurately from existing durable state.
insert into public.studio_activity_events (
  localization_id,
  content_id,
  event_type,
  actor_id,
  actor_email,
  locale,
  title,
  slug,
  metadata,
  occurred_at
)
select
  d.localization_id,
  cl.content_id,
  'draft_created',
  d.created_by,
  u.email,
  cl.locale,
  d.title,
  d.slug,
  jsonb_build_object(
    'editorialStatus', d.editorial_status,
    'lockVersion', 1,
    'backfilled', true
  ),
  d.created_at
from public.content_drafts d
join public.content_localizations cl on cl.id = d.localization_id
left join auth.users u on u.id = d.created_by;

insert into public.studio_activity_events (
  localization_id,
  content_id,
  event_type,
  actor_id,
  actor_email,
  locale,
  title,
  slug,
  metadata,
  occurred_at
)
select
  r.localization_id,
  cl.content_id,
  case when r.reason = 'republish' then 'republished' else 'published' end,
  r.created_by,
  u.email,
  cl.locale,
  coalesce(r.snapshot_json ->> 'title', d.title, ''),
  coalesce(r.snapshot_json ->> 'slug', d.slug, ''),
  jsonb_build_object(
    'revisionId', r.id,
    'revisionNumber', r.revision_number,
    'reason', r.reason,
    'backfilled', true
  ),
  r.created_at
from public.content_revisions r
join public.content_localizations cl on cl.id = r.localization_id
left join public.content_drafts d on d.localization_id = r.localization_id
left join auth.users u on u.id = r.created_by;

insert into public.studio_activity_events (
  localization_id,
  content_id,
  event_type,
  actor_id,
  actor_email,
  locale,
  title,
  slug,
  metadata,
  occurred_at
)
select
  pl.localization_id,
  pl.content_id,
  'archived',
  pl.updated_by,
  u.email,
  pl.locale,
  pl.title,
  pl.slug,
  jsonb_build_object(
    'revisionId', pl.revision_id,
    'slug', pl.slug,
    'backfilled', true
  ),
  pl.updated_at
from public.published_localizations pl
left join auth.users u on u.id = pl.updated_by
where pl.publication_state = 'archived';

insert into public.studio_activity_events (
  localization_id,
  content_id,
  event_type,
  actor_id,
  actor_email,
  locale,
  title,
  slug,
  metadata,
  occurred_at
)
select
  cl.id,
  cl.content_id,
  'trashed',
  cl.trashed_by,
  u.email,
  cl.locale,
  coalesce(d.title, ''),
  coalesce(d.slug, ''),
  jsonb_build_object(
    'fromState', 'active',
    'toState', 'trashed',
    'backfilled', true
  ),
  cl.trashed_at
from public.content_localizations cl
left join public.content_drafts d on d.localization_id = cl.id
left join auth.users u on u.id = cl.trashed_by
where cl.lifecycle_state = 'trashed'
  and cl.trashed_at is not null;

comment on table public.studio_activity_events is
  'Append-only Studio audit trail for draft, publication, archive, Trash, and Restore lifecycle events.';

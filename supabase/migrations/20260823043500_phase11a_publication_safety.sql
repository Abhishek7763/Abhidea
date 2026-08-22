-- ABHIDEA Phase 11A: immutable revision history + isolated live publication snapshots.
-- This checkpoint intentionally adds no publish mutation. Phase 11B will own the audited publish transaction.

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  localization_id uuid not null references public.content_localizations(id),
  revision_number bigint not null check (revision_number >= 1),
  snapshot_json jsonb not null,
  reason text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  constraint content_revisions_snapshot_shape check (
    jsonb_typeof(snapshot_json) = 'object'
    and snapshot_json ->> 'schemaVersion' = '1'
  ),
  constraint content_revisions_localization_number_key unique (localization_id, revision_number),
  constraint content_revisions_id_localization_key unique (id, localization_id)
);

create table public.published_localizations (
  localization_id uuid primary key references public.content_localizations(id),
  content_id uuid not null references public.contents(id),
  revision_id uuid not null unique,
  content_type_id uuid not null references public.content_types(id),
  locale text not null check (locale in ('en', 'hi')),
  slug text not null,
  title text not null,
  summary text not null default '',
  body_json jsonb not null,
  subjects_json jsonb not null default '[]'::jsonb,
  publication_state text not null default 'published'
    check (publication_state in ('published', 'archived')),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  constraint published_localizations_revision_localization_fk
    foreign key (revision_id, localization_id)
    references public.content_revisions(id, localization_id),
  constraint published_localizations_locale_slug_key unique (locale, slug),
  constraint published_localizations_slug_shape check (
    slug = btrim(slug)
    and char_length(slug) between 1 and 180
    and slug !~ '[[:space:]/?#]'
  ),
  constraint published_localizations_title_shape check (
    title = btrim(title)
    and char_length(title) between 1 and 180
  ),
  constraint published_localizations_summary_length check (char_length(summary) <= 1200),
  constraint published_localizations_body_shape check (
    jsonb_typeof(body_json) = 'object'
    and body_json ->> 'schemaVersion' = '1'
    and jsonb_typeof(body_json -> 'blocks') = 'array'
  ),
  constraint published_localizations_subjects_shape check (jsonb_typeof(subjects_json) = 'array')
);

create index content_revisions_localization_revision_idx
  on public.content_revisions(localization_id, revision_number desc);
create index published_localizations_content_state_idx
  on public.published_localizations(content_id, publication_state);
create index published_localizations_updated_at_idx
  on public.published_localizations(updated_at desc);

create or replace function private.prevent_content_revision_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Content revisions are immutable.' using errcode = '55000';
end;
$$;

revoke all on function private.prevent_content_revision_mutation() from public, anon, authenticated;

create trigger content_revisions_immutable
before update or delete on public.content_revisions
for each row execute function private.prevent_content_revision_mutation();

alter table public.content_revisions enable row level security;
alter table public.published_localizations enable row level security;

revoke all on table public.content_revisions from anon, authenticated;
revoke all on table public.published_localizations from anon, authenticated;

grant select on table public.content_revisions to authenticated;
grant select on table public.published_localizations to anon, authenticated;

create policy "active studio members can read revisions"
on public.content_revisions
for select
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "public can read published snapshots"
on public.published_localizations
for select
to anon, authenticated
using (publication_state = 'published');

create policy "active studio members can read all publication snapshots"
on public.published_localizations
for select
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

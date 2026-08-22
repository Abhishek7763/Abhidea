-- ABHIDEA Phase 10A: CMS / Draft Engine data foundation.
-- Additive-only migration. Public Reader delivery remains fixture-backed until later phases.

create schema if not exists private;
revoke all on schema private from public;

create table public.content_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  public_explore_enabled boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  content_type_id uuid not null references public.content_types(id),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_localizations (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  locale text not null check (locale in ('en', 'hi')),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, locale)
);

create table public.content_drafts (
  localization_id uuid primary key references public.content_localizations(id) on delete cascade,
  title text not null default '',
  slug text not null default '',
  summary text not null default '',
  body_json jsonb not null default '{"schemaVersion":1,"blocks":[]}'::jsonb,
  editorial_status text not null default 'draft'
    check (editorial_status in ('draft', 'needs_review', 'ready')),
  lock_version bigint not null default 1 check (lock_version >= 1),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_drafts_slug_shape check (
    slug = '' or (
      slug = btrim(slug)
      and char_length(slug) <= 180
      and slug !~ '[[:space:]/?#]'
    )
  ),
  constraint content_drafts_body_shape check (
    jsonb_typeof(body_json) = 'object'
    and body_json ->> 'schemaVersion' = '1'
    and jsonb_typeof(body_json -> 'blocks') = 'array'
  )
);

create table public.content_subjects (
  content_id uuid not null references public.contents(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (content_id, subject_id)
);

create index contents_content_type_id_idx on public.contents(content_type_id);
create index contents_updated_at_idx on public.contents(updated_at desc);
create index content_localizations_content_id_idx on public.content_localizations(content_id);
create index content_localizations_locale_idx on public.content_localizations(locale);
create index content_drafts_editorial_status_idx on public.content_drafts(editorial_status);
create index content_drafts_slug_lookup_idx on public.content_drafts(slug) where slug <> '';
create index content_drafts_updated_at_idx on public.content_drafts(updated_at desc);
create index content_subjects_subject_id_idx on public.content_subjects(subject_id);

create or replace function private.stamp_cms_audit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    new.created_at := now();
    new.updated_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := auth.uid();
    new.updated_at := now();
  end if;
  return new;
end;
$$;

revoke all on function private.stamp_cms_audit() from public, anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_updated_at() from public, anon, authenticated;

create trigger content_types_touch_updated_at
before update on public.content_types
for each row execute function private.touch_updated_at();

create trigger subjects_stamp_cms_audit
before insert or update on public.subjects
for each row execute function private.stamp_cms_audit();

create trigger contents_stamp_cms_audit
before insert or update on public.contents
for each row execute function private.stamp_cms_audit();

create trigger content_localizations_stamp_cms_audit
before insert or update on public.content_localizations
for each row execute function private.stamp_cms_audit();

create trigger content_drafts_stamp_cms_audit
before insert or update on public.content_drafts
for each row execute function private.stamp_cms_audit();

alter table public.content_types enable row level security;
alter table public.subjects enable row level security;
alter table public.contents enable row level security;
alter table public.content_localizations enable row level security;
alter table public.content_drafts enable row level security;
alter table public.content_subjects enable row level security;

revoke all on table public.content_types from anon, authenticated;
revoke all on table public.subjects from anon, authenticated;
revoke all on table public.contents from anon, authenticated;
revoke all on table public.content_localizations from anon, authenticated;
revoke all on table public.content_drafts from anon, authenticated;
revoke all on table public.content_subjects from anon, authenticated;

grant select, update on table public.content_types to authenticated;
grant select, insert, update on table public.subjects to authenticated;
grant select, insert, update on table public.contents to authenticated;
grant select, insert, update on table public.content_localizations to authenticated;
grant select, insert, update on table public.content_drafts to authenticated;
grant select, insert, delete on table public.content_subjects to authenticated;

create policy "active studio members can read content types"
on public.content_types
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

create policy "admins can update content types"
on public.content_types
for update
to authenticated
using (
  exists (
    select 1
    from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role = 'admin'
  )
);

create policy "active studio members can read subjects"
on public.subjects
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

create policy "active studio members can create subjects"
on public.subjects
for insert
to authenticated
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update subjects"
on public.subjects
for update
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read contents"
on public.contents
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

create policy "active studio members can create contents"
on public.contents
for insert
to authenticated
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update contents"
on public.contents
for update
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read localizations"
on public.content_localizations
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

create policy "active studio members can create localizations"
on public.content_localizations
for insert
to authenticated
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update localizations"
on public.content_localizations
for update
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read drafts"
on public.content_drafts
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

create policy "active studio members can create drafts"
on public.content_drafts
for insert
to authenticated
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update drafts"
on public.content_drafts
for update
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read content subjects"
on public.content_subjects
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

create policy "active studio members can link subjects"
on public.content_subjects
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can unlink subjects"
on public.content_subjects
for delete
to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

insert into public.content_types (name, slug, sort_order)
values
  ('Article', 'article', 10),
  ('Book Summary', 'book-summary', 20),
  ('Fact', 'fact', 30),
  ('Thought', 'thought', 40),
  ('Idea', 'idea', 50),
  ('Life Lesson', 'life-lesson', 60),
  ('Guide', 'guide', 70),
  ('Video Insight', 'video-insight', 80)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    updated_at = now();

comment on table public.content_types is 'Locked V1 ABHIDEA content-type dictionary. Content Type is distinct from Subject.';
comment on table public.subjects is 'Studio-managed subject taxonomy for logical content items.';
comment on table public.contents is 'Language-neutral logical ABHIDEA content identity.';
comment on table public.content_localizations is 'Stable English/Hindi edition identity linked to one logical content item.';
comment on table public.content_drafts is 'Private mutable Studio draft state using ABHIDEA structured block JSON.';
comment on table public.content_subjects is 'Private working relation between logical content and Subjects.';

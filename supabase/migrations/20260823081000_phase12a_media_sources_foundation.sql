create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  author_or_org text null check (author_or_org is null or char_length(author_or_org) <= 300),
  url text not null unique check (url ~* '^https?://[^[:space:]]+$'),
  source_type text null check (source_type is null or char_length(source_type) <= 80),
  published_on date null,
  accessed_on date null,
  link_status text not null default 'unchecked'
    check (link_status in ('unchecked', 'healthy', 'redirected', 'broken', 'blocked')),
  last_checked_at timestamptz null,
  last_http_status smallint null
    check (last_http_status is null or last_http_status between 100 and 599),
  last_error text null check (last_error is null or char_length(last_error) <= 1000),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_sources (
  localization_id uuid not null references public.content_localizations(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  citation_label text null check (citation_label is null or char_length(citation_label) <= 240),
  note text null check (note is null or char_length(note) <= 2000),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (localization_id, source_id)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'supabase'
    check (char_length(btrim(provider)) between 1 and 80),
  original_filename text not null
    check (char_length(btrim(original_filename)) between 1 and 500),
  private_storage_key text null unique,
  public_storage_key text null unique,
  mime_type text not null check (char_length(btrim(mime_type)) between 1 and 120),
  width integer null check (width is null or width > 0),
  height integer null check (height is null or height > 0),
  byte_size bigint not null check (byte_size >= 0),
  alt_text text null check (alt_text is null or char_length(alt_text) <= 500),
  caption text null check (caption is null or char_length(caption) <= 2000),
  credit text null check (credit is null or char_length(credit) <= 500),
  source_url text null check (source_url is null or source_url ~* '^https?://[^[:space:]]+$'),
  media_kind text not null default 'image'
    check (media_kind in ('image', 'document', 'audio', 'video', 'other')),
  asset_state text not null default 'staged'
    check (asset_state in ('staged', 'ready', 'retired')),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_usages (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_assets(id) on delete restrict,
  content_id uuid not null references public.contents(id) on delete cascade,
  localization_id uuid null references public.content_localizations(id) on delete cascade,
  usage_kind text not null check (char_length(btrim(usage_kind)) between 1 and 80),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index media_usages_identity_idx
  on public.media_usages (media_id, content_id, localization_id, usage_kind) nulls not distinct;
create index content_sources_source_id_idx on public.content_sources(source_id);
create index content_sources_localization_sort_idx
  on public.content_sources(localization_id, sort_order);
create index sources_created_by_idx on public.sources(created_by);
create index sources_updated_by_idx on public.sources(updated_by);
create index content_sources_created_by_idx on public.content_sources(created_by);
create index content_sources_updated_by_idx on public.content_sources(updated_by);
create index media_assets_created_by_idx on public.media_assets(created_by);
create index media_assets_updated_by_idx on public.media_assets(updated_by);
create index media_assets_state_created_idx
  on public.media_assets(asset_state, created_at desc);
create index media_usages_media_id_idx on public.media_usages(media_id);
create index media_usages_content_id_idx on public.media_usages(content_id);
create index media_usages_localization_id_idx
  on public.media_usages(localization_id) where localization_id is not null;
create index media_usages_created_by_idx on public.media_usages(created_by);
create index media_usages_updated_by_idx on public.media_usages(updated_by);

create trigger sources_touch_updated_at
before update on public.sources
for each row execute function private.touch_updated_at();

create trigger content_sources_touch_updated_at
before update on public.content_sources
for each row execute function private.touch_updated_at();

create trigger media_assets_touch_updated_at
before update on public.media_assets
for each row execute function private.touch_updated_at();

create trigger media_usages_touch_updated_at
before update on public.media_usages
for each row execute function private.touch_updated_at();

create or replace function private.validate_media_usage_localization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.localization_id is not null and not exists (
    select 1
    from public.content_localizations cl
    where cl.id = new.localization_id
      and cl.content_id = new.content_id
  ) then
    raise exception 'Media usage localization does not belong to content'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_media_usage_localization()
from public, anon, authenticated;

create trigger media_usages_validate_localization
before insert or update on public.media_usages
for each row execute function private.validate_media_usage_localization();

alter table public.sources enable row level security;
alter table public.content_sources enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_usages enable row level security;

revoke all on public.sources, public.content_sources, public.media_assets, public.media_usages
from anon, authenticated;

grant select, insert, update on public.sources to authenticated;
grant select, insert, update, delete on public.content_sources to authenticated;
grant select on public.media_assets to authenticated;
grant select, insert, update, delete on public.media_usages to authenticated;

create policy "active studio members can read sources"
on public.sources for select to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can create sources"
on public.sources for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (select auth.uid()) = updated_by
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update sources"
on public.sources for update to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  (select auth.uid()) = updated_by
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read content sources"
on public.content_sources for select to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can create content sources"
on public.content_sources for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (select auth.uid()) = updated_by
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update content sources"
on public.content_sources for update to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  (select auth.uid()) = updated_by
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can unlink content sources"
on public.content_sources for delete to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read media assets"
on public.media_assets for select to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can read media usages"
on public.media_usages for select to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can create media usages"
on public.media_usages for insert to authenticated
with check (
  (select auth.uid()) = created_by
  and (select auth.uid()) = updated_by
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can update media usages"
on public.media_usages for update to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  (select auth.uid()) = updated_by
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "active studio members can remove media usages"
on public.media_usages for delete to authenticated
using (
  exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'media-private',
    'media-private',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
  ),
  (
    'media-public',
    'media-public',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
  );

create policy "studio can read private media objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'media-private'
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "studio can upload reserved private media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media-private'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.media_assets ma
    where ma.id::text = (storage.foldername(name))[3]
      and ma.created_by = (select auth.uid())
      and ma.asset_state = 'staged'
  )
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create policy "studio can replace own reserved private media"
on storage.objects for update to authenticated
using (
  bucket_id = 'media-private'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.media_assets ma
    where ma.id::text = (storage.foldername(name))[3]
      and ma.created_by = (select auth.uid())
      and ma.asset_state = 'staged'
  )
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
)
with check (
  bucket_id = 'media-private'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1 from public.media_assets ma
    where ma.id::text = (storage.foldername(name))[3]
      and ma.created_by = (select auth.uid())
      and ma.asset_state = 'staged'
  )
  and exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

alter table public.media_assets
  add column optimized_storage_key text null unique,
  add column optimized_byte_size bigint null check (optimized_byte_size is null or optimized_byte_size > 0),
  add column optimized_at timestamptz null;

create or replace function private.prepare_media_optimized_variant_impl(p_media_id uuid)
returns table(storage_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_asset public.media_assets%rowtype;
  v_storage_key text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.studio_members sm
    where sm.user_id = v_user_id
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception 'Active Studio membership required' using errcode = '42501';
  end if;

  select * into v_asset
  from public.media_assets ma
  where ma.id = p_media_id;

  if not found
    or v_asset.media_kind <> 'image'
    or v_asset.asset_state <> 'ready'
    or v_asset.private_storage_key is null
    or v_asset.optimized_storage_key is not null
  then
    raise exception 'Media asset is not eligible for optimization' using errcode = '22023';
  end if;

  v_storage_key := format('optimized/%s/main.webp', v_asset.id);
  return query select v_storage_key;
end;
$$;

revoke all on function private.prepare_media_optimized_variant_impl(uuid)
from public, anon, authenticated;
grant execute on function private.prepare_media_optimized_variant_impl(uuid)
to authenticated;

create or replace function public.prepare_media_optimized_variant(p_media_id uuid)
returns table(storage_key text)
language sql
security invoker
set search_path = ''
as $$
  select * from private.prepare_media_optimized_variant_impl(p_media_id);
$$;

revoke all on function public.prepare_media_optimized_variant(uuid) from public, anon;
grant execute on function public.prepare_media_optimized_variant(uuid) to authenticated;

create or replace function private.finalize_media_optimized_variant_impl(
  p_media_id uuid,
  p_storage_key text,
  p_width integer,
  p_height integer
)
returns public.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_asset public.media_assets%rowtype;
  v_metadata jsonb;
  v_actual_size bigint;
  v_actual_mime text;
  v_expected_key text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.studio_members sm
    where sm.user_id = v_user_id
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  ) then
    raise exception 'Active Studio membership required' using errcode = '42501';
  end if;

  if p_width is null
    or p_height is null
    or p_width < 1
    or p_height < 1
    or p_width > 1920
    or p_height > 1920
  then
    raise exception 'Optimized dimensions are invalid' using errcode = '22023';
  end if;

  select * into v_asset
  from public.media_assets ma
  where ma.id = p_media_id
  for update;

  if not found
    or v_asset.media_kind <> 'image'
    or v_asset.asset_state <> 'ready'
    or v_asset.private_storage_key is null
    or v_asset.optimized_storage_key is not null
  then
    raise exception 'Media asset is not eligible for optimization' using errcode = '22023';
  end if;

  v_expected_key := format('optimized/%s/main.webp', v_asset.id);
  if p_storage_key is null or p_storage_key <> v_expected_key then
    raise exception 'Optimized media path does not match asset' using errcode = '22023';
  end if;

  select so.metadata into v_metadata
  from storage.objects so
  where so.bucket_id = 'media-private'
    and so.name = p_storage_key
  limit 1;

  if v_metadata is null then
    raise exception 'Optimized private object was not found' using errcode = '22023';
  end if;

  v_actual_size := nullif(v_metadata ->> 'size', '')::bigint;
  v_actual_mime := nullif(v_metadata ->> 'mimetype', '');

  if v_actual_size is null or v_actual_size < 1 or v_actual_size > 10485760 then
    raise exception 'Optimized media size is invalid' using errcode = '22023';
  end if;

  if v_actual_mime <> 'image/webp' then
    raise exception 'Optimized media must be WebP' using errcode = '22023';
  end if;

  update public.media_assets
  set optimized_storage_key = p_storage_key,
      optimized_byte_size = v_actual_size,
      width = p_width,
      height = p_height,
      optimized_at = now(),
      updated_by = v_user_id
  where id = p_media_id
  returning * into v_asset;

  return v_asset;
end;
$$;

revoke all on function private.finalize_media_optimized_variant_impl(uuid, text, integer, integer)
from public, anon, authenticated;
grant execute on function private.finalize_media_optimized_variant_impl(uuid, text, integer, integer)
to authenticated;

create or replace function public.finalize_media_optimized_variant(
  p_media_id uuid,
  p_storage_key text,
  p_width integer,
  p_height integer
)
returns public.media_assets
language sql
security invoker
set search_path = ''
as $$
  select private.finalize_media_optimized_variant_impl(
    p_media_id,
    p_storage_key,
    p_width,
    p_height
  );
$$;

revoke all on function public.finalize_media_optimized_variant(uuid, text, integer, integer)
from public, anon;
grant execute on function public.finalize_media_optimized_variant(uuid, text, integer, integer)
to authenticated;

create policy "studio can upload reserved optimized private media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'media-private'
  and exists (
    select 1
    from public.media_assets ma
    where ma.id::text = (storage.foldername(name))[2]
      and name = ('optimized/' || ma.id::text || '/main.webp')
      and ma.media_kind = 'image'
      and ma.asset_state = 'ready'
      and ma.private_storage_key is not null
      and ma.optimized_storage_key is null
  )
  and exists (
    select 1
    from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);
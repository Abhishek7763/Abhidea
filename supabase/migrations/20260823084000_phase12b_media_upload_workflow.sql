create or replace function private.reserve_media_upload_impl(
  p_original_filename text,
  p_mime_type text,
  p_byte_size bigint,
  p_alt_text text default null,
  p_caption text default null,
  p_credit text default null,
  p_source_url text default null
)
returns table(media_id uuid, storage_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_media_id uuid := gen_random_uuid();
  v_extension text;
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

  if p_original_filename is null or char_length(btrim(p_original_filename)) not between 1 and 500 then
    raise exception 'Invalid media filename' using errcode = '22023';
  end if;

  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp', 'image/avif') then
    raise exception 'Unsupported image type' using errcode = '22023';
  end if;

  if p_byte_size is null or p_byte_size < 1 or p_byte_size > 10485760 then
    raise exception 'Image must be between 1 byte and 10 MiB' using errcode = '22023';
  end if;

  if p_alt_text is not null and char_length(p_alt_text) > 500 then
    raise exception 'Alt text is too long' using errcode = '22023';
  end if;
  if p_caption is not null and char_length(p_caption) > 2000 then
    raise exception 'Caption is too long' using errcode = '22023';
  end if;
  if p_credit is not null and char_length(p_credit) > 500 then
    raise exception 'Credit is too long' using errcode = '22023';
  end if;
  if p_source_url is not null and p_source_url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Source URL must be http or https' using errcode = '22023';
  end if;

  v_extension := case p_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    when 'image/avif' then 'avif'
  end;
  v_storage_key := format('uploads/%s/%s/original.%s', v_user_id, v_media_id, v_extension);

  insert into public.media_assets (
    id,
    provider,
    original_filename,
    mime_type,
    byte_size,
    alt_text,
    caption,
    credit,
    source_url,
    media_kind,
    asset_state,
    created_by,
    updated_by
  ) values (
    v_media_id,
    'supabase',
    btrim(p_original_filename),
    p_mime_type,
    p_byte_size,
    nullif(btrim(coalesce(p_alt_text, '')), ''),
    nullif(btrim(coalesce(p_caption, '')), ''),
    nullif(btrim(coalesce(p_credit, '')), ''),
    nullif(btrim(coalesce(p_source_url, '')), ''),
    'image',
    'staged',
    v_user_id,
    v_user_id
  );

  return query select v_media_id, v_storage_key;
end;
$$;

revoke all on function private.reserve_media_upload_impl(text, text, bigint, text, text, text, text)
from public, anon, authenticated;

create or replace function public.reserve_media_upload(
  p_original_filename text,
  p_mime_type text,
  p_byte_size bigint,
  p_alt_text text default null,
  p_caption text default null,
  p_credit text default null,
  p_source_url text default null
)
returns table(media_id uuid, storage_key text)
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.reserve_media_upload_impl(
    p_original_filename,
    p_mime_type,
    p_byte_size,
    p_alt_text,
    p_caption,
    p_credit,
    p_source_url
  );
$$;

revoke all on function public.reserve_media_upload(text, text, bigint, text, text, text, text)
from public, anon;
grant execute on function public.reserve_media_upload(text, text, bigint, text, text, text, text)
to authenticated;

create or replace function private.finalize_media_upload_impl(
  p_media_id uuid,
  p_storage_key text
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
  v_expected_extension text;
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

  select * into v_asset
  from public.media_assets ma
  where ma.id = p_media_id
  for update;

  if not found or v_asset.created_by <> v_user_id then
    raise exception 'Media reservation not found' using errcode = '42501';
  end if;

  if v_asset.asset_state <> 'staged' or v_asset.private_storage_key is not null then
    raise exception 'Media reservation is no longer pending' using errcode = '22023';
  end if;

  v_expected_extension := case v_asset.mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    when 'image/avif' then 'avif'
    else null
  end;
  v_expected_key := format('uploads/%s/%s/original.%s', v_user_id, v_asset.id, v_expected_extension);

  if p_storage_key is null or p_storage_key <> v_expected_key then
    raise exception 'Media storage path does not match reservation' using errcode = '22023';
  end if;

  select so.metadata into v_metadata
  from storage.objects so
  where so.bucket_id = 'media-private'
    and so.name = p_storage_key
  limit 1;

  if v_metadata is null then
    raise exception 'Uploaded media object was not found' using errcode = '22023';
  end if;

  v_actual_size := nullif(v_metadata ->> 'size', '')::bigint;
  v_actual_mime := nullif(v_metadata ->> 'mimetype', '');

  if v_actual_size is null or v_actual_size < 1 or v_actual_size > 10485760 then
    raise exception 'Uploaded media size is invalid' using errcode = '22023';
  end if;

  if v_actual_mime not in ('image/jpeg', 'image/png', 'image/webp', 'image/avif') then
    raise exception 'Uploaded media type is invalid' using errcode = '22023';
  end if;

  update public.media_assets
  set private_storage_key = p_storage_key,
      mime_type = v_actual_mime,
      byte_size = v_actual_size,
      asset_state = 'ready',
      updated_by = v_user_id
  where id = p_media_id
  returning * into v_asset;

  return v_asset;
end;
$$;

revoke all on function private.finalize_media_upload_impl(uuid, text)
from public, anon, authenticated;

create or replace function public.finalize_media_upload(p_media_id uuid, p_storage_key text)
returns public.media_assets
language sql
security invoker
set search_path = ''
as $$
  select private.finalize_media_upload_impl(p_media_id, p_storage_key);
$$;

revoke all on function public.finalize_media_upload(uuid, text) from public, anon;
grant execute on function public.finalize_media_upload(uuid, text) to authenticated;

create or replace function private.cancel_media_upload_impl(p_media_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_asset public.media_assets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_asset
  from public.media_assets ma
  where ma.id = p_media_id
  for update;

  if not found then
    return;
  end if;

  if v_asset.created_by <> v_user_id
    or v_asset.asset_state <> 'staged'
    or v_asset.private_storage_key is not null
    or exists (select 1 from public.media_usages mu where mu.media_id = p_media_id)
  then
    raise exception 'Media reservation cannot be cancelled' using errcode = '42501';
  end if;

  delete from public.media_assets where id = p_media_id;
end;
$$;

revoke all on function private.cancel_media_upload_impl(uuid)
from public, anon, authenticated;

create or replace function public.cancel_media_upload(p_media_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_media_upload_impl(p_media_id);
$$;

revoke all on function public.cancel_media_upload(uuid) from public, anon;
grant execute on function public.cancel_media_upload(uuid) to authenticated;

create or replace function private.update_media_metadata_impl(
  p_media_id uuid,
  p_alt_text text default null,
  p_caption text default null,
  p_credit text default null,
  p_source_url text default null
)
returns public.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_asset public.media_assets%rowtype;
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

  if p_alt_text is not null and char_length(p_alt_text) > 500 then
    raise exception 'Alt text is too long' using errcode = '22023';
  end if;
  if p_caption is not null and char_length(p_caption) > 2000 then
    raise exception 'Caption is too long' using errcode = '22023';
  end if;
  if p_credit is not null and char_length(p_credit) > 500 then
    raise exception 'Credit is too long' using errcode = '22023';
  end if;
  if p_source_url is not null and p_source_url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Source URL must be http or https' using errcode = '22023';
  end if;

  update public.media_assets
  set alt_text = nullif(btrim(coalesce(p_alt_text, '')), ''),
      caption = nullif(btrim(coalesce(p_caption, '')), ''),
      credit = nullif(btrim(coalesce(p_credit, '')), ''),
      source_url = nullif(btrim(coalesce(p_source_url, '')), ''),
      updated_by = v_user_id
  where id = p_media_id
    and asset_state in ('staged', 'ready')
  returning * into v_asset;

  if not found then
    raise exception 'Editable media asset not found' using errcode = '22023';
  end if;

  return v_asset;
end;
$$;

revoke all on function private.update_media_metadata_impl(uuid, text, text, text, text)
from public, anon, authenticated;

create or replace function public.update_media_metadata(
  p_media_id uuid,
  p_alt_text text default null,
  p_caption text default null,
  p_credit text default null,
  p_source_url text default null
)
returns public.media_assets
language sql
security invoker
set search_path = ''
as $$
  select private.update_media_metadata_impl(
    p_media_id,
    p_alt_text,
    p_caption,
    p_credit,
    p_source_url
  );
$$;

revoke all on function public.update_media_metadata(uuid, text, text, text, text)
from public, anon;
grant execute on function public.update_media_metadata(uuid, text, text, text, text)
to authenticated;

create policy "studio can clean failed private media uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'media-private'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1
    from public.media_assets ma
    where ma.id::text = (storage.foldername(name))[3]
      and ma.created_by = (select auth.uid())
      and ma.asset_state = 'staged'
      and ma.private_storage_key is null
      and not exists (
        select 1 from public.media_usages mu where mu.media_id = ma.id
      )
  )
  and exists (
    select 1
    from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

# Phase 12A — Media + Sources Data/Security Foundation

## Objective

Create the dependency-safe database and Storage boundary required by Phase 12 before opening upload or deletion UI.

Master Plan Phase 12 requires:

- media upload/optimization
- Media Library
- alt/caption
- credit/source
- where-used
- safe deletion/replacement
- Source Library
- content-source linking
- broken-link state foundation
- no orphan destructive behavior

This checkpoint builds only the foundation. Upload/optimization and operational Media/Source UI follow in later Phase 12 checkpoints.

## Source model

`public.sources`

- reusable source identity
- title, author/organization, URL, source type
- publication/access dates
- link health foundation: unchecked / healthy / redirected / broken / blocked
- last checked time, HTTP status and bounded error text
- actor attribution and timestamps

`public.content_sources`

- links a source to one localized edition
- citation label, editorial note and sort order
- source deletion is not exposed to browser roles
- unlinking a citation is allowed for active Studio members

Sources remain private Studio working data. Public publication snapshots will receive resolved safe citation JSON in a later Phase 12 publish-integration checkpoint.

## Media model

`public.media_assets`

- provider-neutral asset registry
- stable UUID used by content instead of permanent provider URLs
- original filename, MIME type, dimensions and byte size
- alt text, caption, credit and source URL
- private/public Storage keys
- staged / ready / retired lifecycle
- actor attribution and timestamps

`public.media_usages`

- where-used registry
- media → logical content + optional localized edition
- usage kind
- duplicate usage protection with `NULLS NOT DISTINCT`
- trigger blocks a localization/content mismatch

Media assets are intentionally read-only to normal authenticated browser table writes in 12A. A controlled reservation/upload workflow will be added in 12B.

## Storage boundary

Two buckets are created:

- `media-private` — private staged uploads
- `media-public` — public approved delivery objects

Both are limited to 10 MiB images in 12A:

- JPEG
- PNG
- WebP
- AVIF

Private upload path contract:

`uploads/<auth.uid()>/<media-asset-uuid>/<filename>`

An authenticated upload is accepted only when:

1. caller is an active Studio `admin|creator`
2. second folder segment is the caller UID
3. third folder segment matches a staged `media_assets` reservation owned by the caller

Private object reads are Studio-only. Direct Storage DELETE is not exposed. Public-bucket writes are not exposed yet.

## Public metadata decision

Phase 3 originally allowed anonymous `media_assets` rows when `public_storage_key` was non-null. 12A intentionally does **not** grant anon table access because the same registry row also contains `private_storage_key`. A later public resolver/snapshot can expose only safe fields without leaking private object keys.

## Security properties

- RLS enabled on all new public tables
- anon has no Source/Media registry access
- authenticated non-Studio users fail RLS
- Media registry browser INSERT/UPDATE/DELETE is not granted
- Source records cannot be directly deleted
- media object deletion is not exposed
- public-bucket writes are not exposed
- no service-role key is introduced
- no public `SECURITY DEFINER` function is introduced

## Verification before commit

The full migration was executed inside a live Supabase transaction and rolled back.

Verified during that probe:

- four tables created successfully
- two buckets created successfully
- three private Storage policies created successfully
- anon Source SELECT = false
- anon Media SELECT = false
- authenticated direct Media INSERT = false
- rollback left zero Phase 12 tables, buckets or policies behind

## Deferred to Phase 12B+

- media reservation RPC
- actual upload UI
- image metadata extraction and optimization
- public promotion/replacement workflow
- Media Library UI and where-used display
- Source Library UI
- editor source linking UI
- editor media/figure selection
- publish snapshot integration for sources/media
- dependency-checked retirement/deletion
- automated broken-link checking

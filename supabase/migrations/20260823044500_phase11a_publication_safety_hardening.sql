-- ABHIDEA Phase 11A follow-up: remove overlapping permissive SELECT policies
-- and cover revision/publication foreign keys reported by the Supabase advisor.

drop policy if exists "public can read published snapshots" on public.published_localizations;
drop policy if exists "active studio members can read all publication snapshots" on public.published_localizations;

create policy "public can read published snapshots"
on public.published_localizations
for select
to anon
using (publication_state = 'published');

create policy "authenticated can read publication snapshots"
on public.published_localizations
for select
to authenticated
using (
  publication_state = 'published'
  or exists (
    select 1 from public.studio_members sm
    where sm.user_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role in ('admin', 'creator')
  )
);

create index content_revisions_created_by_idx
  on public.content_revisions(created_by);
create index published_localizations_content_type_id_idx
  on public.published_localizations(content_type_id);
create index published_localizations_published_by_idx
  on public.published_localizations(published_by);
create index published_localizations_updated_by_idx
  on public.published_localizations(updated_by);
create index published_localizations_revision_localization_idx
  on public.published_localizations(revision_id, localization_id);

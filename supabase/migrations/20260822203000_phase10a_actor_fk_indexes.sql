-- Phase 10A follow-up: cover audit actor foreign keys reported by the Supabase performance advisor.

create index subjects_created_by_idx on public.subjects(created_by);
create index subjects_updated_by_idx on public.subjects(updated_by);
create index contents_created_by_idx on public.contents(created_by);
create index contents_updated_by_idx on public.contents(updated_by);
create index content_localizations_created_by_idx on public.content_localizations(created_by);
create index content_localizations_updated_by_idx on public.content_localizations(updated_by);
create index content_drafts_created_by_idx on public.content_drafts(created_by);
create index content_drafts_updated_by_idx on public.content_drafts(updated_by);
create index content_subjects_created_by_idx on public.content_subjects(created_by);

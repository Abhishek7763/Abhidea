-- Phase 11F advisor hardening: cover the Trash actor foreign key.
create index content_localizations_trashed_by_idx
  on public.content_localizations(trashed_by)
  where trashed_by is not null;

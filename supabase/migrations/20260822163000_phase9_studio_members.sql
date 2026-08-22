-- Phase 9A: Studio authorization foundation.
-- Roles are stored in protected database state, never user-editable metadata.

create table if not exists public.studio_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'creator')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_members enable row level security;

revoke all on table public.studio_members from anon;
revoke all on table public.studio_members from authenticated;
grant select on table public.studio_members to authenticated;

drop policy if exists "studio members can read own role" on public.studio_members;
create policy "studio members can read own role"
on public.studio_members
for select
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.studio_members is
  'ABHIDEA Studio authorization source. Rows are provisioned administratively; users can only read their own Studio membership.';

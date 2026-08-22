# Phase 9 — Auth + Studio Shell

Status: IMPLEMENTATION IN PROGRESS

## Scope
- Supabase Auth with cookie-based SSR for Next.js.
- Server-verified identity using `supabase.auth.getClaims()`.
- Studio authorization from protected database state, never user-editable metadata.
- Roles: `admin`, `creator`.
- `/studio/login` public auth entry point.
- `/studio` and future Studio routes protected server-side.
- Mobile-first Studio shell with dashboard/content/media/settings navigation.
- Authenticated Studio routes must remain dynamic/non-cacheable.

## Security rules
- No service-role/secret key in browser code.
- Publishable key only in public environment variables.
- No authorization from `user_metadata`.
- No public signup UI in V1; Studio membership is provisioned administratively.
- RLS enabled for every exposed Studio authorization table.
- Users may read only their own Studio membership and cannot self-promote.

## Checkpoints
- 9A Security foundation + Studio shell.
- 9B Supabase SSR clients + login/logout + route protection.
- 9C role/status enforcement + final mobile/accessibility QA.

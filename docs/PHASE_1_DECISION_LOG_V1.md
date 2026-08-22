# ABHIDEA — Phase 1 Decision Log v1

Date: 22 August 2026
Status: Frozen for V1 unless explicitly reopened by the owner.

## Product identity

- Product: ABHIDEA
- Tagline: Read • Learn • Think • Grow
- Public UI language: English
- Reading editions: English and Hindi
- Primary product identity: the Reader
- AI role: assistant, not autonomous publisher

## Architecture

- Architectural style: modular monolith
- One Next.js repository/application
- Separate Public and Studio route groups/layouts
- Public experience: server-first
- Studio experience: authenticated, dynamic and interaction-heavy
- Studio/editor JavaScript must not leak into normal Reader bundles

## Technology baseline

Implementation baseline to be pinned during Phase 2:
- Next.js 16.x current stable/Active-LTS line
- React 19.2-compatible line
- TypeScript strict
- Tailwind CSS 4.x
- Node.js 24 LTS
- Supabase PostgreSQL/Auth/RLS/Storage
- Vercel
- GitHub

Exact patch versions must be checked immediately before dependency installation.

## V1 content types

Initial content types:
1. Article
2. Book Summary
3. Fact
4. Thought
5. Idea
6. Life Lesson
7. Guide
8. Video Insight

Content Type and Subject are separate dimensions.

## Public information architecture

Core public areas:
- Homepage
- Explore
- Search
- Search results
- Content-type and subject browsing where useful
- English Reader
- Hindi Reader
- About / Creator profile
- 404/error states

## Studio information architecture

Core groups:
- Overview
- Content
- Discovery
- Publishing
- Assets
- Website
- Tools
- System

Studio is a separate operational product, not a decorative admin page.

## Public URL strategy

Canonical Reader direction:
- `/en/read/<slug>`
- `/hi/read/<localized-slug>`

Rules:
- One conceptual content item may have independent English/Hindi localizations.
- Content Type remains metadata rather than a mandatory permanent Reader path segment.
- Slug changes should use redirect records where appropriate.
- Drafts, previews and Studio routes must not be indexable.

## Canonical content direction

ABHIDEA owns a versioned structured-document schema independent of any editor library.

Core direction:
- `schemaVersion`
- structured `blocks`
- safe rendering of known blocks
- malformed/unknown blocks must fail safely
- no uncontrolled raw HTML as the permanent content contract

Editor choice must not become the irreversible database format.

## Theme strategy

First-class themes:
- Light
- Dark
- Reader Eye Comfort

Use semantic CSS/design tokens rather than hard-coded page-specific colors.

## Search strategy

V1:
- PostgreSQL/Supabase lexical search
- Search Service abstraction
- published-only public index
- title/summary/body/metadata indexing
- English/Hindi/Roman-Hindi/Hinglish-aware aliases where practical

Semantic/vector/RAG search is future scope, not a V1 dependency.

## Media strategy

- Production media initially in Supabase Storage
- Database stores stable media records/IDs
- Content references `mediaId`, not permanent provider URLs
- Media Service abstraction permits later migration to R2/S3/another provider
- No base64 media inside PostgreSQL

## Authentication and authorization

- Supabase Auth
- Server-side session/identity verification
- RLS on exposed sensitive application tables
- Owner and Admin roles for V1
- Authorization data must not rely on user-editable metadata
- Service-role/secret keys must never be exposed to public client code
- Public users must never read drafts/private learning notes or write protected data

## Editorial lifecycle

Required lifecycle capabilities:
- stable draft identity immediately
- autosave
- resume
- independent English/Hindi localization state
- working draft separated from live published state
- meaningful revisions
- preview
- preflight
- publish
- trash/restore
- activity log

Editing a published item must never destroy the current live version before the replacement is safely published.

## Reader baseline

Reader gets highest design priority.

Core V1 Reader:
- long-form typography
- real Hindi/Devanagari testing
- structured content renderer
- language switch
- responsive figures/media
- conditional TOC
- sources
- closure blocks
- related knowledge
- Reader settings
- Eye Comfort
- reading progress
- browser/device speech synthesis with graceful fallback
- reduced-motion support

## Deployment strategy

Branches:
- `main` — production only
- `staging` — integrated milestone preview/QA
- `work/*` — active development, frequent commits

Policy:
- do not develop directly on `main`
- suppress unnecessary Vercel work-branch previews where possible
- local/build/type/test verification before staging
- stage milestones, not every tiny commit

## Explicitly deferred from V1

Unless the owner reopens scope:
- public accounts/profiles
- comments/community
- reactions/likes/followers
- synced bookmarks/highlights
- personalized recommendations
- vector/semantic search dependency
- public RAG assistant
- LMS/course/quiz engine
- advanced Learning Paths
- full offline Studio editing
- arbitrary drag-and-drop website builder
- enterprise approval chains/permission matrix
- fake trending/social proof

## Phase 1 Gate

PASS.

This Decision Log converts the approved Master Plan into the implementation baseline. Any material V1 scope addition after this point requires explicit owner approval.

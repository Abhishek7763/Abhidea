# ABHIDEA — Phase 5 Information Architecture / Routing

Date: 22 August 2026
Status: Implementation baseline for Public and Studio routes.

## Public route map

- `/` — Homepage
- `/explore` — browse/discovery landing page
- `/explore/type/[slug]` — Content Type hub
- `/explore/subject/[slug]` — Subject hub
- `/search` — Search UI and query-param results (`q`, `type`, `subject`, `locale`)
- `/about` — Creator / About profile
- `/en/read/[slug]` — canonical English Reader
- `/hi/read/[slug]` — canonical Hindi Reader

## Public navigation map

Primary desktop/mobile navigation:
- Home → `/`
- Explore → `/explore`
- About → `/about`
- Search → `/search`

Footer utility:
- Admin Login → `/studio`

Reader URLs are not placed in global navigation; they are reached from published content cards/search results.

## Content hub rules

- Content Type answers **what kind of content this is** and uses `/explore/type/[slug]`.
- Subject answers **what the content is about** and uses `/explore/subject/[slug]`.
- Topic/Tag remain filters/metadata in V1 and do not automatically get indexable public pages.
- Search remains a separate job from Explore and uses query parameters rather than generating uncontrolled indexable route combinations.

## Reader URL rules

Canonical Reader routes remain:
- `/en/read/<slug>`
- `/hi/read/<localized-slug>`

Content Type is metadata and is not part of the canonical Reader path.
Missing/unpublished Reader localizations return not found rather than showing the wrong language or draft content.

## Studio route map

Reserved namespace: `/studio`

V1 operational groups:
- `/studio` — Overview
- `/studio/content` — Content
- `/studio/content/[id]` — Editor/workspace
- `/studio/media` — Media
- `/studio/sources` — Sources
- `/studio/website` — Website settings
- `/studio/tools` — Tools / import / AI Help
- `/studio/system` — System health / activity / admin

Phase 5 only establishes the namespace and metadata/security boundary. Full Supabase Auth and operational Studio routes are Phase 9+.

## Admin protection strategy

- `/studio` and descendants are never part of public navigation except the small intentional Admin Login footer link.
- Studio metadata is `noindex, nofollow`.
- `robots` disallows `/studio/`.
- No draft/private data is rendered by Phase 5/6 Studio placeholder routes.
- Real identity/role verification is introduced with Supabase Auth in Phase 9 and remains server/database enforced.

## Metadata route strategy

- Public canonical metadata belongs to Public pages/Reader localizations.
- Search is not intended as an indexable result surface.
- Studio is noindex/nofollow.
- `sitemap.ts` lists intentionally crawlable stable public routes and later published Reader URLs.
- `robots.ts` disallows Studio and search-result crawling.
- Reader language relationships/canonical metadata are implemented with actual published content in Reader/SEO phases.

## 404 / error rules

- Unknown Content Type/Subject slugs return 404.
- Missing/unpublished Reader slugs return 404.
- Global error boundary keeps a working retry action.
- Visible navigation only points to implemented routes.

## Phase 5 Gate

PASS when the route structure is implemented and CI confirms there are no conflicting App Router routes or dead global-navigation targets.

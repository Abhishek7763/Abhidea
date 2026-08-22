# ABHIDEA — Phase 7 Signature Reader Core

Date: 22 August 2026
Status: PASS

## Objective

Build ABHIDEA's primary product identity: a calm, bilingual, structured Reader that can later consume `published_localizations.body_json` without coupling the public renderer to a CMS editor library.

## Structured document contract

The Reader implements ABHIDEA schema version 1:

```json
{
  "schemaVersion": 1,
  "blocks": []
}
```

Supported core blocks:
- paragraph
- heading (H2/H3)
- quote
- ordered/unordered list
- callout
- figure by stable `mediaId`
- divider
- closure: ABHIDEA's Take / Conclusion

Safety behavior:
- no uncontrolled raw HTML rendering
- unknown blocks are ignored safely
- malformed blocks are ignored safely
- unsupported/malformed documents render a generic non-destructive fallback
- missing figure media renders a safe text fallback
- duplicate block IDs are deterministically de-duplicated so generated DOM/TOC anchors remain unique

## Reader core implemented

- English long-form typography
- Hindi/Devanagari long-form typography
- responsive reader measure and hierarchy
- conditional table of contents when enough headings exist
- responsive figures through `next/image`
- provider-neutral media resolver boundary
- source/reference section
- clearly distinguished ABHIDEA's Take
- Conclusion block
- Related Knowledge cards
- article metadata
- English/Hindi language switch
- locale/language semantics
- canonical and language-alternate metadata for QA fixtures
- keyboard-focus-compatible links and landmarks
- reduced-motion inherits the global design-system contract
- unsafe/non-HTTP source URLs are not emitted as clickable links

## QA fixtures

Two long-form non-published Reader fixtures exist only to verify the Reader before live Supabase publication data is connected:

- English: `/en/read/learning-system-demo`
- Hindi: `/hi/read/seekhne-ki-pranali-demo`

Both fixtures are explicitly marked as QA samples and emit `noindex, nofollow` metadata. All other Reader slugs continue to return a real HTTP 404.

The fixture pair exercises the same structured block contract in both languages and includes headings, paragraphs, lists, callouts, quote, figure, Sources, ABHIDEA's Take, Conclusion and Related Knowledge.

## Intentional Phase boundary

Not included in Phase 7 because it belongs to Phase 8:
- font size controls
- line-spacing controls
- reading-width controls
- Eye Comfort Reader controls
- reading progress
- speech/audio Reader
- auto-follow
- share controls

Not included because it belongs to later backend/CMS phases:
- Supabase live Reader query
- Draft/preview access
- publishing workflow
- media library upload/resolution service

A granular loading indicator is also intentionally deferred until real asynchronous content/data boundaries exist. A broad Public loading boundary is not reintroduced because it previously masked `notFound()` HTTP semantics.

## Final gate evidence

Technical verification:
- [x] dependency install passes
- [x] format hygiene passes
- [x] lint passes
- [x] strict typecheck passes
- [x] automated Reader structured-document tests pass
- [x] production build passes
- [x] release PR #15 from `staging` to `main` passed the full repository gate
- [x] release merged to `main` as `00576dd04892b628dbd7b0bca928e00b29dd480c`

Owner visual QA on 22 August 2026:
- [x] English QA Reader visual review
- [x] Hindi/Devanagari QA Reader visual review
- [x] language-switch experience approved
- [x] responsive Reader presentation approved
- [x] TOC, figure, Sources, ABHIDEA's Take, Conclusion and Related Knowledge approved

Production verification:
- [x] Vercel production deployment `dpl_C1HpjzAmkJZdDQWmUBWCbmtkGdsN` reached READY
- [x] canonical `https://abhidea.vercel.app/` returns HTTP 200
- [x] English QA Reader returns HTTP 200 with `noindex, nofollow`, canonical and Hindi alternate metadata
- [x] Hindi QA Reader returns HTTP 200 with `noindex, nofollow`, canonical and English alternate metadata
- [x] unknown Reader slug returns real HTTP 404 with `noindex`
- [x] production build was bootstrapped from the exact merged release SHA and contains both EN/HI Reader routes

## Phase 7 gate

PASS.

Phase 7 is closed. Phase 8 may now add Reader controls, Eye Comfort behavior, reading progress, browser/device speech synthesis and related interaction features without changing the Phase 7 structured-document contract.

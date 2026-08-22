# ABHIDEA — Phase 7 Signature Reader Core

Date: 22 August 2026
Status: VISUAL QA PASS — RELEASE VERIFICATION PENDING

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

## Gate evidence

Technical verification:
- [x] dependency install passes
- [x] format hygiene passes
- [x] lint passes
- [x] strict typecheck passes
- [x] automated Reader structured-document tests pass
- [x] production build passes
- [x] English and Hindi Reader routes are present in the successful Vercel preview build output
- [x] figure uses responsive `next/image` rendering with useful alt text in the fixture contract

Owner visual QA on 22 August 2026:
- [x] English QA Reader visual review
- [x] Hindi/Devanagari QA Reader visual review
- [x] language-switch experience approved
- [x] responsive Reader presentation approved
- [x] TOC, figure, Sources, ABHIDEA's Take, Conclusion and Related Knowledge approved

Release verification still required before final PASS:
- [ ] release PR from `staging` to `main` passes the full repository gate
- [ ] production English QA Reader returns HTTP 200
- [ ] production Hindi QA Reader returns HTTP 200
- [ ] production unknown Reader slug returns real HTTP 404 with noindex behavior
- [ ] production release is READY on the canonical ABHIDEA Vercel project

Phase 7 becomes final PASS only after those production checks succeed.

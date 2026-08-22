# ABHIDEA — Phase 7 Signature Reader Core

Date: 22 August 2026
Status: IMPLEMENTATION COMPLETE — VERIFICATION PENDING

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

## Gate

Before Phase 7 becomes PASS:
- [ ] dependency install passes
- [ ] lint passes
- [ ] strict typecheck passes
- [ ] production build passes
- [ ] English QA Reader renders successfully
- [ ] Hindi QA Reader renders successfully
- [ ] language switch resolves correctly
- [ ] unknown Reader slug remains HTTP 404
- [ ] mobile-size English visual review
- [ ] mobile-size Hindi/Devanagari visual review
- [ ] desktop Reader visual review
- [ ] figure is responsive and has useful alt text
- [ ] TOC, Sources, closures and Related Knowledge are usable

Phase 7 becomes PASS only after these checks succeed.

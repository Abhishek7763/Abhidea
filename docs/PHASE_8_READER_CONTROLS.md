# ABHIDEA — Phase 8 Reader Controls

Date: 22 August 2026
Status: IMPLEMENTATION IN PROGRESS
Branch: `work/reader-controls`

## Objective

Add optional Reader interaction tools without changing the Phase 7 structured-document contract or converting the server-rendered Reader into a client-heavy application.

## Architecture rule

The Reader remains server-first. Interactive controls are isolated client islands and store device preferences locally. Reader preferences are not content data and are not written to Supabase in V1.

## Chunk 1 — Reading preferences

Implemented on the work branch:
- persistent text-size control: small / standard / large
- persistent line-spacing control: compact / standard / relaxed
- persistent reading-width control: narrow / standard / wide
- Reader-only Eye Comfort toggle
- reset action
- English/Hindi control labels
- `aria-pressed` state for selectable controls
- minimum mobile touch target treatment
- Eye Comfort correctly overrides Light, Dark and System-Dark Reader colors
- isolated `ReaderControls` client component mounted inside the server-rendered Reader

Storage key:
- `abhidea-reader-settings-v1`

## Later Phase 8 chunks

Still pending:
- reading progress
- browser/device speech synthesis
- play / pause / resume / stop behavior
- graceful speech fallback
- heading-aware speech flow / optional auto-follow where practical
- share controls
- final responsive and accessibility QA

## Verification state

No staging merge, CI run or deployment has been triggered for Phase 8 yet. The first implementation chunk remains isolated on `work/reader-controls` until the next controlled verification checkpoint.

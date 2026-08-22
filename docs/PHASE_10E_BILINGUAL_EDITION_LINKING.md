# ABHIDEA Phase 10E — Bilingual Edition Linking

Status: implementation checkpoint
Date: 2026-08-22
Base staging SHA: `ed6728c805e1bbe0ec2b2df4671136b525126216`

## Goal

Link English and Hindi drafts under one logical content identity while keeping localized writing independent.

The existing data model already provides the relationship:

- `contents` is the shared language-neutral identity.
- `content_localizations` stores one English and one Hindi edition per content item.
- `content_drafts` stores localized title, slug, summary, body and editorial state.
- Content Type and Subjects remain shared at the logical content level.

No extra bilingual link table is introduced.

## Workflow

From an existing Studio draft editor, the user can see whether the other language edition exists. If it exists, Studio opens that real editor. If it is missing, Studio opens a real Add Edition form.

The new edition starts with blank localized title, slug, summary and body fields. Studio does not copy English writing into Hindi or Hindi writing into English. Saving creates only the missing localization and its draft, then opens the new editor.

## Database change

Migration: `supabase/migrations/20260822223000_phase10e_linked_edition_rpc.sql`

The linked-edition database function resolves the shared content identity from the source localization, validates that the target is the other supported locale, rejects a duplicate counterpart, and creates the localization plus private draft in one transaction.

Existing Studio membership checks, table permissions and row-level policies remain active.

## Scope boundary

Phase 10E does not add public Reader delivery, preview, publishing, revisions, autosave, media, translation automation or SEO localization fields.

## Verification gate

Before merge:

- repository format, lint, typecheck, tests and production build must pass
- linked-edition migration must apply once
- English and Hindi probe drafts must share one `content_id`
- localized title, slug and body must remain independent
- duplicate counterpart creation must fail
- rollback probe must leave zero permanent test rows
- Supabase security and performance advisors must be checked

Production `main` remains untouched.

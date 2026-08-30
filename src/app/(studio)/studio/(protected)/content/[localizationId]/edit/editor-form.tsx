"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { updateStudioDraftAction } from "@/app/(studio)/studio/(protected)/content/actions";
import type { StudioEditorialStatus } from "@/features/studio-content-model";
import {
  createStudioEditorBlock,
  serializeStudioEditorDocument,
  STUDIO_EDITOR_BLOCK_TYPES,
  type StudioDraftUpdateState,
  type StudioEditableBlock,
  type StudioEditableDocument,
  type StudioEditorBlockType,
} from "@/features/studio-editor-model";

import { FigureMediaPicker } from "./figure-media-picker";

const INITIAL_STATE: StudioDraftUpdateState = { status: "idle", message: "", fieldErrors: {} };

const BLOCK_LABELS: Record<StudioEditorBlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  quote: "Quote",
  list: "List",
  callout: "Callout",
  figure: "Figure",
  divider: "Divider",
  closure: "Closure",
};

type StudioEditorFormProps = Readonly<{
  localizationId: string;
  lockVersion: number;
  title: string;
  slug: string;
  summary: string;
  status: StudioEditorialStatus;
  document: StudioEditableDocument;
}>;

function cloneBlocks(document: StudioEditableDocument): StudioEditableBlock[] {
  return document.blocks.map((block) =>
    block.type === "list" ? { ...block, items: [...block.items] } : { ...block },
  );
}

function FieldError({ message }: Readonly<{ message?: string }>) {
  return message ? <span className="studio-draft-field-error">{message}</span> : null;
}

export function StudioEditorForm({ localizationId, lockVersion, title, slug, summary, status, document }: StudioEditorFormProps) {
  const [state, formAction, isPending] = useActionState(updateStudioDraftAction, INITIAL_STATE);
  const [blocks, setBlocks] = useState<StudioEditableBlock[]>(() => cloneBlocks(document));
  const [editorialStatus, setEditorialStatus] = useState<StudioEditorialStatus>(status);
  const idCounter = useRef(0);

  function replaceBlock(id: string, update: (block: StudioEditableBlock) => StudioEditableBlock) {
    setBlocks((current) => current.map((block) => (block.id === id ? update(block) : block)));
  }

  function addBlock(type: StudioEditorBlockType) {
    let sequence = idCounter.current;
    let id = "";
    do {
      sequence += 1;
      id = `edit-${sequence}`;
    } while (blocks.some((block) => block.id === id));
    idCounter.current = sequence;
    setBlocks((current) => [...current, createStudioEditorBlock(type, id)]);
  }

  function removeBlock(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const savingReady = editorialStatus === "ready";

  return (
    <form className="studio-editor-form" action={formAction}>
      <input type="hidden" name="localizationId" value={localizationId} />
      <input type="hidden" name="expectedLockVersion" value={lockVersion} />
      <input type="hidden" name="documentJson" value={serializeStudioEditorDocument(blocks)} />

      {state.status !== "idle" ? (
        <div className="studio-draft-form-error" data-kind={state.status} role={state.status === "conflict" ? "alert" : "status"}>
          {state.message}
        </div>
      ) : null}

      <section className="studio-panel studio-draft-section" aria-labelledby="editor-details-heading">
        <div>
          <p className="studio-kicker">Draft details</p>
          <h2 id="editor-details-heading">Identity for this edition</h2>
          <p>When the content is complete, mark it Ready and save. That saved Ready state unlocks the separate Publish action above.</p>
        </div>

        <div className="studio-draft-fields">
          <label>
            <span>Editorial state</span>
            <select
              name="editorialStatus"
              value={editorialStatus}
              onChange={(event) => {
                const value = event.target.value;
                setEditorialStatus(value === "ready" ? "ready" : value === "needs_review" ? "needs_review" : "draft");
              }}
            >
              <option value="draft">Draft — private work</option>
              <option value="needs_review">Needs review</option>
              <option value="ready">Ready — unlock Publish after save</option>
            </select>
            <FieldError message={state.fieldErrors.editorialStatus} />
          </label>

          <div className="studio-ready-shortcut" data-ready={savingReady ? "true" : "false"}>
            <div>
              <strong>{savingReady ? "Ready selected" : "Still a private draft"}</strong>
              <p>
                {savingReady
                  ? "Save now. After reload, Publish will be unlocked if the saved content passes preflight. Figure media is promoted only when you explicitly publish."
                  : "When writing is complete, choose Ready. Nothing goes live until you separately press Publish."}
              </p>
            </div>
            {!savingReady ? (
              <button type="button" onClick={() => setEditorialStatus("ready")}>
                Mark Ready
              </button>
            ) : null}
          </div>

          <label>
            <span>Title</span>
            <input name="title" type="text" defaultValue={title} maxLength={180} required />
            <FieldError message={state.fieldErrors.title} />
          </label>
          <label>
            <span>Slug</span>
            <input name="slug" type="text" defaultValue={slug} maxLength={180} autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
            <FieldError message={state.fieldErrors.slug} />
          </label>
          <label>
            <span>Summary</span>
            <textarea name="summary" defaultValue={summary} rows={4} maxLength={1200} />
            <FieldError message={state.fieldErrors.summary} />
          </label>
        </div>
      </section>

      <section className="studio-editor-workspace" aria-labelledby="structured-body-heading">
        <header className="studio-editor-heading">
          <div>
            <p className="studio-kicker">Structured body</p>
            <h2 id="structured-body-heading">ABHIDEA blocks</h2>
            <p>Each control maps directly to the same schemaVersion 1 blocks the Reader already understands.</p>
          </div>
          <span>{blocks.length} blocks</span>
        </header>

        <div className="studio-editor-addbar" aria-label="Add a block">
          {STUDIO_EDITOR_BLOCK_TYPES.map((type) => (
            <button key={type} type="button" onClick={() => addBlock(type)} disabled={blocks.length >= 300}>
              + {BLOCK_LABELS[type]}
            </button>
          ))}
        </div>

        {blocks.length === 0 ? (
          <div className="studio-panel studio-draft-inline-empty">This draft has no body blocks yet. Add a Paragraph, Heading, Figure, List or another supported block above.</div>
        ) : (
          <div className="studio-editor-blocks">
            {blocks.map((block, index) => (
              <article className="studio-editor-block" key={block.id}>
                <header>
                  <div><span>{index + 1}</span><strong>{BLOCK_LABELS[block.type]}</strong></div>
                  <div className="studio-editor-block-actions">
                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="Move block up">↑</button>
                    <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} aria-label="Move block down">↓</button>
                    <button type="button" onClick={() => removeBlock(block.id)} aria-label="Delete block">Delete</button>
                  </div>
                </header>

                {block.type === "paragraph" ? <textarea aria-label="Paragraph text" rows={6} value={block.text} onChange={(event) => replaceBlock(block.id, (current) => current.type === "paragraph" ? { ...current, text: event.target.value } : current)} /> : null}

                {block.type === "heading" ? (
                  <div className="studio-editor-grid">
                    <label><span>Level</span><select value={block.level} onChange={(event) => replaceBlock(block.id, (current) => current.type === "heading" ? { ...current, level: event.target.value === "3" ? 3 : 2 } : current)}><option value="2">Heading 2</option><option value="3">Heading 3</option></select></label>
                    <label><span>Heading text</span><input value={block.text} onChange={(event) => replaceBlock(block.id, (current) => current.type === "heading" ? { ...current, text: event.target.value } : current)} /></label>
                  </div>
                ) : null}

                {block.type === "quote" ? (
                  <div className="studio-editor-stack">
                    <textarea aria-label="Quote text" rows={5} value={block.text} onChange={(event) => replaceBlock(block.id, (current) => current.type === "quote" ? { ...current, text: event.target.value } : current)} />
                    <input aria-label="Quote attribution" placeholder="Attribution (optional)" value={block.attribution ?? ""} onChange={(event) => replaceBlock(block.id, (current) => current.type === "quote" ? { ...current, attribution: event.target.value } : current)} />
                  </div>
                ) : null}

                {block.type === "list" ? (
                  <div className="studio-editor-stack">
                    <select aria-label="List style" value={block.style} onChange={(event) => replaceBlock(block.id, (current) => current.type === "list" ? { ...current, style: event.target.value === "ordered" ? "ordered" : "unordered" } : current)}><option value="unordered">Bulleted list</option><option value="ordered">Numbered list</option></select>
                    <textarea aria-label="List items" rows={6} value={block.items.join("\n")} onChange={(event) => replaceBlock(block.id, (current) => current.type === "list" ? { ...current, items: event.target.value.split("\n") } : current)} placeholder="One item per line" />
                  </div>
                ) : null}

                {block.type === "callout" ? (
                  <div className="studio-editor-stack">
                    <div className="studio-editor-grid">
                      <label><span>Tone</span><select value={block.tone} onChange={(event) => replaceBlock(block.id, (current) => { if (current.type !== "callout") return current; const tone = event.target.value; return { ...current, tone: tone === "key-idea" || tone === "warning" ? tone : "note" }; })}><option value="note">Note</option><option value="key-idea">Key idea</option><option value="warning">Warning</option></select></label>
                      <label><span>Title</span><input value={block.title ?? ""} onChange={(event) => replaceBlock(block.id, (current) => current.type === "callout" ? { ...current, title: event.target.value } : current)} placeholder="Optional" /></label>
                    </div>
                    <textarea aria-label="Callout text" rows={5} value={block.text} onChange={(event) => replaceBlock(block.id, (current) => current.type === "callout" ? { ...current, text: event.target.value } : current)} />
                  </div>
                ) : null}

                {block.type === "figure" ? (
                  <FigureMediaPicker
                    block={block}
                    onChange={(next) => replaceBlock(block.id, (current) => current.type === "figure" ? next : current)}
                  />
                ) : null}

                {block.type === "divider" ? <p className="studio-editor-divider-note">Reader divider — no text content.</p> : null}

                {block.type === "closure" ? (
                  <div className="studio-editor-stack">
                    <div className="studio-editor-grid">
                      <label><span>Variant</span><select value={block.variant} onChange={(event) => replaceBlock(block.id, (current) => current.type === "closure" ? { ...current, variant: event.target.value === "abhidea-take" ? "abhidea-take" : "conclusion" } : current)}><option value="conclusion">Conclusion</option><option value="abhidea-take">ABHIDEA&apos;s Take</option></select></label>
                      <label><span>Title</span><input value={block.title} onChange={(event) => replaceBlock(block.id, (current) => current.type === "closure" ? { ...current, title: event.target.value } : current)} /></label>
                    </div>
                    <textarea aria-label="Closure text" rows={6} value={block.text} onChange={(event) => replaceBlock(block.id, (current) => current.type === "closure" ? { ...current, text: event.target.value } : current)} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <FieldError message={state.fieldErrors.documentJson} />
      </section>

      <div className="studio-draft-savebar" data-ready={savingReady ? "true" : "false"}>
        <div>
          <strong>{savingReady ? "Save readiness for publishing" : "Save private draft"}</strong>
          <span>
            {savingReady
              ? "After this save, the page reloads and Publish unlocks if preflight passes. Figure media remains private until Publish."
              : `Lock version ${lockVersion}. Saving remains private and does not change the live Reader.`}
          </span>
        </div>
        <div className="studio-draft-save-actions">
          <Link href="/studio/content">Back</Link>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : savingReady ? "Save as Ready" : "Save draft"}
          </button>
        </div>
      </div>
    </form>
  );
}

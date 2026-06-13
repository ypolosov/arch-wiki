---
description: Publish docs/architecture as a full 1:1 Confluence KB mirror (cross-links, optional RU translation) — create/update/delete reconciled, human-gated, then record the ledger.
argument-hint: (uses integrations.confluence from .arch-wiki/config.json)
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch
---

Publish the Confluence KB mirror (CAP-2). `docs/architecture` is the source of truth;
Confluence is a **read-only 1:1 mirror** with a visibility filter.

1. `arch-wiki lint --severity high` first — a `duplicate-basename` collapses the mirror; fix before
   publishing. Then **save the plan to a file**: `arch-wiki render-confluence --all > /tmp/aw-mirror.json`.
   It holds `data.pages` (parent-first `PageEnvelope`s: `body`, `parentSource`, `contentHash`,
   `alreadyPublished`, `drifted`, `pageId`, `restore`) + `data.orphans`, plus `data.language` and
   `data.preserveTerms`. Exit 2 ("no confluence.space") → tell the SA to fill `integrations.confluence`.
2. `ToolSearch "mcp confluence"`; none → "MCP not configured, see CLAUDE.md#MCP-Setup", stop.
3. **Human gate:** show the create / update / **DELETE** lists; orphan deletes need explicit confirmation.

**`publish` is a 2-pass cycle** — a cross-link resolves to a real URL only once its target page has a
page-id in the ledger. Pass 1 creates pages; pass 2 updates the now-drifted linking pages. Re-run
`render-confluence` between passes. (English mirror: a link to a not-yet-created page stays plain text on
pass 1. RU mirror: it is reserved as a `…/pages/pending` masked link so the *translatable* body is byte-stable
across passes — pass 2 changes only the restore value, so you do **not** re-translate the page.)

Note: repo-relative links (`../iterations/`, `CLAUDE.md`, `c4/…`) are **not** wiki cross-links and are
neutralized to plain text by Core (they would be dead hrefs in Confluence); `data.pages[].warnings` lists them.

**RU projection (when `data.language` is set, e.g. `"ru"`).** The mirror is a TRANSLATED projection; the
canon stays English in git. For each page, BEFORE publishing, translate its `body` to `data.language`:
translate prose, headings and link **labels**; keep **verbatim** every `%%AWP<n>%%` placeholder (Core
masked code / link-URLs / artifact-ids there) and every term in `data.preserveTerms`. Then restore the
placeholders deterministically — pipe the translated body back through Core:
`arch-wiki finalize-confluence --source <relPath> --plan /tmp/aw-mirror.json < translated.md` → publish the
`data.body` from its output. If it reports `missing` (a placeholder was dropped) or exits 2, **re-translate**
that page — never publish a page that lost protected content. **Title (v0.7):** translate `data.titleLabel`
(keep `data.preserveTerms` verbatim) and set the page title to `<data.titlePrefix> <translated label>` — the
id prefix (`UC-014:`) stays byte-exact, no mixed-language headings. When `data.language` is null, publish
`body` + `title` as-is (English).

4. **Pass 1 — create/update parent-first.** For each page in plan order: [translate + `finalize-confluence`
   if `language`] → `createConfluencePage` / `updateConfluencePage` (`contentFormat: markdown`, `spaceId`,
   `parentId` = the parent source's recorded page-id) → `arch-wiki record-page --source <relPath> --page
   <pageId> --hash <contentHash>` (`contentHash` is over the English source, so it is the same whether or
   not you translated — idempotency holds). Skip pages with `alreadyPublished && !drifted`.
   **Destination-drift safety:** before an update, compare the page's Confluence version against the ledger;
   if it was hand-edited in Confluence after publish, WARN and skip unless the SA forces it.
5. **Pass 2 — re-render, update drifted.** Re-run `arch-wiki render-confluence --all > /tmp/aw-mirror.json`.
   Now every page is in the ledger, so previously-unresolved `[[wikilinks]]` resolve to root-relative
   `/wiki/spaces/<space>/pages/<id>` links and their linking pages report `drifted:true`. Translate+finalize
   (if `language`) and update each drifted page, then `record-page` again. Repeat until `drifted` is empty
   (normally one extra pass) — idempotent.
6. Confirmed orphans: delete the Confluence page, then `arch-wiki record-page --source <relPath> --delete`.
   **NEVER** delete a Confluence page that is absent from the ledger.
7. Report created/updated/deleted/skipped counts + URLs.

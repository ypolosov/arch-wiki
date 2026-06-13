---
description: Publish docs/architecture as a full 1:1 Confluence KB mirror (RU, cross-links) — create/update/delete reconciled, human-gated, then record the ledger.
argument-hint: (uses integrations.confluence from .arch-wiki/config.json)
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch
---

Publish the Confluence KB mirror (CAP-2). `docs/architecture` is the source of truth;
Confluence is a **read-only 1:1 mirror** with a visibility filter. The map step is **thin**
— Core renders the body; you only feed it to the MCP and handle diagram embeds.

1. `arch-wiki lint --severity high` first — a `duplicate-basename` collapses the mirror; fix
   before publishing. Then `arch-wiki render-confluence --all` → `MirrorPlan`: `pages`
   (parent-first `PageEnvelope`s with `body`, `parentSource`, `contentHash`, `alreadyPublished`,
   `drifted`, `pageId`) + `orphans` (delete candidates). Exit 2 ("no confluence.space") → tell
   the SA to fill `integrations.confluence`.
2. `ToolSearch "mcp confluence"`; none → "MCP not configured, see CLAUDE.md#MCP-Setup", stop.
3. **Human gate:** show the create / update / **DELETE** lists; orphan deletes need explicit confirmation.
4. Create/update **parent-first** (`createConfluencePage`/`updateConfluencePage`,
   `contentFormat: markdown`, `spaceId`, `parentId` = the parent source's recorded page-id).
   Skip pages with `alreadyPublished && !drifted`. **Destination-drift safety:** before an
   update, compare the page's Confluence version against the ledger; if it was hand-edited in
   Confluence after publish, WARN and skip unless the SA forces it.
5. Cross-links: published targets already render as page-id links; unpublished ones render as
   plain text — a second `publish` run resolves them once every page has a page-id (idempotent).
6. After each create/update: `arch-wiki record-page --source <relPath> --page <pageId> --hash <contentHash>`.
7. Confirmed orphans: delete the Confluence page, then `arch-wiki record-page --source <relPath>
   --delete`. **NEVER** delete a Confluence page that is absent from the ledger.
8. Report created/updated/deleted/skipped counts + URLs.

---
description: Pull the Product Owner's "User Story Log" from Confluence (read-only) into raw/_synced snapshots, reconcile orphans, then feed the normal ingest.
argument-hint: (uses integrations.upstream.userStoryLog from .arch-wiki/config.json)
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch
---

Pull the PO User Story Log (CAP-1). The PO owns the source; we snapshot it READ-ONLY for
traceability + offline determinism. The CLI is the authorized writer of `raw/_synced/` —
never Edit/Write it by hand.

1. `arch-wiki pull-stories --plan` → `cloudId`, `rootPageId`, `childTitlePrefix`, and
   `alreadyPulled` (pageId+contentHash). Exit 2 ("no userStoryLog config") → tell the SA to
   fill `integrations.upstream.userStoryLog` in `.arch-wiki/config.json`.
2. `ToolSearch "mcp confluence"`; if none → "MCP not configured, see CLAUDE.md#MCP-Setup", stop.
3. Enumerate children of `rootPageId` via `getConfluencePageDescendants` (paginate the
   `cursor` until exhausted, ~50 pages, depth 1–2). Keep those whose title starts with
   `childTitlePrefix`. Collect their page-ids as the LIVE set.
4. For each live story: `getConfluencePage(..., contentFormat: markdown)` → pipe the body to
   `arch-wiki record-story --page <id> --title <title> --page-version <v> [--parent <id>] [--slug <s>]`
   (`--page-version` = the page's Confluence `version.number`; `cac` reserves `--version`). Use `--slug`
   for non-latin titles. Idempotent: unchanged → no-op; changed → `drifted:true`.
5. **Orphan reconcile (human-gated):** `arch-wiki prune-stories --live <comma-sep live page-ids>` is a
   **plan by default** — it lists the orphan snapshots (stories that disappeared upstream) and deletes
   nothing. Show that list to the SA, then re-run with `--commit` to actually delete the snapshots +
   ledger rows.
6. Report pulled/unchanged/drifted/pruned counts and remind: run
   `/arch-wiki:ingest raw/_synced/user-story-log/` to turn stories into UC/QA/CON drivers.

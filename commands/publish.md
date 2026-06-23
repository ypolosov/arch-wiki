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
   `alreadyPublished`, `drifted`, `pageId`, `ledgerPageVersion`, `realizedBy`, `restore`) + `data.orphans`,
   plus `data.language`, `data.preserveTerms`, the MCP create params `data.cloudId` + numeric `data.spaceId`
   (and `data.spaceKey` for URLs), and plan-level `data.warnings`. Exit 2 ("no confluence.space") → tell the
   SA to fill `integrations.confluence`.
   **Preflight:** if `data.warnings` is non-empty, surface it and STOP until fixed — typically the numeric
   `data.spaceId` or `data.cloudId` is missing (createConfluencePage needs the NUMERIC space id, not the KEY
   → HTTP 400). Get the numeric id once with `getConfluenceSpaces(keys:["<KEY>"])` and put it in
   `integrations.confluence.spaceId`.
2. `ToolSearch "mcp confluence"`; none → "MCP not configured, see CLAUDE.md#MCP-Setup", stop.
3. **Human gate:** show the create / update / **DELETE** lists; orphan deletes need explicit confirmation.

**`publish` is a 2-pass cycle** — a cross-link resolves to a real URL only once its target page has a
page-id in the ledger. Pass 1 creates pages; pass 2 updates the now-drifted linking pages. Re-run
`render-confluence` between passes. (English mirror: a link to a not-yet-created page stays plain text on
pass 1. RU mirror: it is reserved as a `…/pages/pending` masked link so the *translatable* body is byte-stable
across passes — pass 2 changes only the restore value, so you do **not** re-translate the page.)

Note: repo-relative links (`../iterations/`, `CLAUDE.md`, `c4/…`) are **not** wiki cross-links and are
neutralized to plain text by Core (they would be dead hrefs in Confluence); `data.pages[].warnings` lists them.
The mirror is a **curated projection**, not a byte copy — the git source-of-truth never reaches Confluence.
Core removes, before the content hash: the `## Sources` provenance section, and `CLAUDE.md` (the Layer-3
meta-doc) is excluded entirely. Every other repo-internal git reference is **RENAMED in place to a human
phrase** (v0.8.5 DELETE→RENAME), not deleted — deleting a path from prose left dangling verbs/connectives
(`risk tracked in.`) and broken asides; a rename keeps the sentence whole. The deterministic map
(`humanizeRepoRef`): `risks.md`→"the risk register", `gap-analysis`→"the gap analysis", `kanban`→"the
backlog", `glossary`→"the glossary", `utility-tree`→"the utility tree", `c4/src/model.c4` (or a bare `c4/`
or a glob `c4/src/*.c4`)→"the C4 model" (`views.c4`→"the C4 views", `deployment.c4`→"the C4 deployment
view"), `raw/…`→"the source brief", `*.csv`→"the data file", `docs/architecture/…`→"the architecture wiki",
`CLAUDE.md`→"the contributor guide"; `.foam/…` is dropped. This applies in prose, inline code, parentheticals
(`(from raw/x)`→`(from the source brief)`), connective citations (`tracked in \`risks.md\``→`tracked in the
risk register`), `**Source:**` fields (the git path is renamed, any non-git remainder — Jira ref /
attribution — kept), and a wikilink to an excluded register (`[[risks]]`→"the risk register"). A register
wikilink that carries a **record id** — an id-shaped alias or an anchor (`[[risks#^C-003|C-003]]`) — keeps
that id (`C-003`) instead of the generic name, so traceability and grammar survive (`Resolves C-003`, not
`Resolves the risk register`). Rename seams are cleaned: a duplicated article (`the the backlog`) and an
adjacent repeat of the same phrase (`the source brief, the source brief`) collapse to one (v0.8.6).
`data.pages[].warnings` lists each curation. The curation runs in pipeline order **after** cross-link
resolution + repo-relative-link neutralisation (so a link whose label is itself a path, `[c4/src/x.c4](…)`,
is collapsed and renamed — no broken empty link) and **before** the C4-image stub (so the stub keeps its
diagram `source` path). A markdown-form cross-link to a mirrored neighbour (`[ADR-0023](0023-…md)`) is
resolved to its `/wiki` page (not only `[[wikilinks]]`). **Acceptance has two tiers:** (i) repo-internal
source paths MUST be absent (from the body AND from the RU-mask `restore` values); (ii) external/POC git URLs
in ADRs (`bitbucket.org/…`, `git.shakuro.com`) are decision-evidence and are **kept by design**. The path
matcher is a strict anchored allowlist with a left word-boundary, so C4 element ids
(`product.gaming.brand.core.service`), domain terms and words merely containing a root (`draw/`) are never
touched. (A bare repo root that was the sole content of a table cell or list bullet renames to its phrase;
the repo-structure table in `index.md` is the typical case.)

**Incremental publish:** `render-confluence --page <relPath>` emits the target page **plus its full ancestor
chain** (parent-first), so you can publish one branch and still create parents before children — the mirror
keeps its hierarchy instead of flattening. `--all` is the default full mirror.

**Reverse trace edge (v0.8).** Core appends a `**Realized by:** [KEY](…/browse/KEY)` line to a page's `body`
when the artifact has `realized_by` Jira issues — the mirror page links back to its issue (forward link is in
the issue body). It is part of `body`, so it translates/protects like the rest in RU and re-publishes when the
realizing issue changes. Needs `integrations.jira.siteUrl` (or falls back to `confluence.siteUrl`); absent →
no link + a page warning.

**C4 / local images (v0.8, stub).** Local image embeds (`![..](../c4/x.png)`) become a deterministic
"C4 diagram placeholder" in `body` (the MCP has no attachment-upload tool). The mirror reflects WHERE a
diagram belongs without a broken image; attach the real diagram in the Confluence UI for now (full embedding
is deferred). `data.pages[].warnings` lists the stubbed sources.

**RU projection (when `data.language` is set, e.g. `"ru"`).** The mirror is a TRANSLATED projection; the
canon stays English in git. For each page, BEFORE publishing, translate its `body` to `data.language`:
translate prose, headings and link **labels**; keep **verbatim** every `%%AWP<n>%%` placeholder. Core masks
code / link-URLs / artifact-ids **and** every `data.preserveTerms` term (config `confluence.preserveTerms` +
glossary bold terms) into those placeholders — so protected content is enforced by Core, NOT left to the
translator's discretion (`data.preserveTerms` is informational: it lists what was masked). Then restore the
placeholders deterministically — pipe the translated body back through Core:
`arch-wiki finalize-confluence --source <relPath> --plan /tmp/aw-mirror.json < translated.md` → publish the
`data.body` from its output. If it reports `missing` (a placeholder was dropped) or exits 2, **re-translate**
that page — never publish a page that lost protected content. **Title (v0.7):** translate `data.titleLabel`
(keep `data.preserveTerms` verbatim) and set the page title to `<data.titlePrefix> <translated label>` — the
id prefix (`UC-014:`) stays byte-exact, no mixed-language headings. **Structural labels stay English:** the
QA-scenario 6-part labels (Source / Stimulus / Artifact / Environment / Response / Measure), arc42 section
markers and ADD field names / structural table headers — translate only their VALUES/prose, not the labels.
To keep a label English deterministically, add it to `confluence.preserveTerms`: Core then masks every
occurrence to a placeholder (it is a Core mask, not a translator instruction). When `data.language` is null,
publish `body` + `title` as-is (English).

4. **Pass 1 — create/update parent-first.** For each page in plan order: [translate + `finalize-confluence`
   if `language`] → `createConfluencePage` / `updateConfluencePage` (`cloudId: data.cloudId`,
   `spaceId: data.spaceId` (the NUMERIC id — NOT `spaceKey`), `contentFormat: markdown`, `parentId` = the
   parent source's recorded page-id) → `arch-wiki record-page --source <relPath> --page <pageId> --from-plan
   /tmp/aw-mirror.json --page-version <version returned by create/update>` (`--from-plan` reads the page's
   CURRENT `contentHash` from the saved plan — do NOT hand-copy `--hash`; on pass 2 cross-link resolution
   changes the hash and a stale copy records a false drift; `--page-version` stores the new Confluence version
   as the drift baseline). `contentHash` is over the English source, so it is the same whether or not you
   translated. Skip pages with `alreadyPublished && !drifted`.
   **Destination-drift safety (deterministic):** before an update, `getConfluencePage` the live version and
   compare it to `data.pages[].ledgerPageVersion`. If the live version is HIGHER, the page was hand-edited in
   Confluence after the last publish — **WARN and skip** (do not clobber) unless the SA explicitly forces it.
   If `ledgerPageVersion` is **null** (a pre-0.8 ledger row, or a page never recorded with a version) there is
   no baseline to compare against — skip the compare, update normally, then `record-page --page-version <v>` to
   establish the baseline for next time.
5. **Pass 2 — re-render, update drifted.** Re-run `arch-wiki render-confluence --all > /tmp/aw-mirror.json`.
   Now every page is in the ledger, so previously-unresolved `[[wikilinks]]` resolve to root-relative
   `/wiki/spaces/<space>/pages/<id>` links and their linking pages report `drifted:true`. Translate+finalize
   (if `language`) and update each drifted page, then `record-page` again. Repeat until `drifted` is empty
   (normally one extra pass) — idempotent.
6. Confirmed orphans: delete the Confluence page, then `arch-wiki record-page --source <relPath> --delete`.
   **NEVER** delete a Confluence page that is absent from the ledger.
7. Report created/updated/deleted/skipped counts + URLs.

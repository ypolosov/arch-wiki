# Architecture Wiki — Schema (Karpathy LLM-Wiki, Layer 3)

> **Template.** Copy this file to `docs/architecture/CLAUDE.md` in your project
> and adapt the project-specific parts (the C4 model shape at the bottom). The
> `arch-wiki` plugin reads this file at runtime and obeys it. Everything above
> the "C4 / LikeC4 rules" section is methodology and is meant to stay as-is.

This file is the **schema** that governs how the LLM ingests, structures, links,
and queries the Solution Architecture wiki under `docs/architecture/`. It is the
contract behind the `arch-wiki` plugin operations (`/arch-wiki:ingest`,
`/arch-wiki:query`, `/arch-wiki:lint`, and the generators).

> Mental model (Karpathy): **Foam is the IDE, the LLM is the programmer, the wiki
> is the codebase, this file is the compiler config.** Knowledge *compounds* —
> every ingest strengthens existing connections, it does not just add bulk.

## Three layers

| Layer | Location | Who edits |
|---|---|---|
| **1 · Raw** (immutable sources) | `raw/` | humans only; LLM **reads, never writes** |
| **2 · Wiki** (synthesis) | everything else under `docs/architecture/` | LLM maintains, human curates |
| **3 · Schema** (rules) | this file | human |

## Methodology roles (the ontology)

- **ADD 3.0** = design process. Inputs = drivers (`drivers/`); the iterative loop
  is logged in `iterations/` (ITER-NN).
- **arc42** = documentation container. The 12 hubs in `arc42/` map sections to
  artifacts (see table below).
- **C4 / LikeC4** = visual notation. Source of truth = `c4/src/*.c4`.
- **ADR (MADR)** = decision ledger. `adrs/` (arc42 §9).

### arc42 → artifact map
| arc42 | Source |
|---|---|
| §1 Introduction & Goals | `drivers/use-cases/` |
| §2 Constraints | `drivers/constraints/` |
| §3 Context & Scope | `c4` context view |
| §4 Solution Strategy | key ADRs + `iterations/` |
| §5 Building Block View | `c4` containers/components |
| §6 Runtime View | `c4` dynamic views + UC flows |
| §7 Deployment View | `c4/src/deployment.c4` |
| §8 Crosscutting Concepts | `drivers/concerns/` |
| §9 Architecture Decisions | `adrs/` |
| §10 Quality Requirements | `drivers/quality-attributes/` |
| §11 Risks & Tech Debt | `risks.md` |
| §12 Glossary | `glossary.md` |

## ID schemes & filenames (do not invent new schemes)

| Type | ID | Filename | Folder | `type:` |
|---|---|---|---|---|
| Use case | `UC-NNN` | `UC-NNN-kebab.md` | `drivers/use-cases/` | `use-case` |
| Quality attribute | `QA-NNN` | `QA-NNN-kebab.md` | `drivers/quality-attributes/` | `quality-attribute` |
| Constraint | `CON-NNN` | `CON-NNN-kebab.md` | `drivers/constraints/` | `constraint` |
| Concern | `CONC-NNN` | `CONC-NNN-kebab.md` | `drivers/concerns/` | `concern` |
| Decision | `ADR-NNNN` | `NNNN-kebab.md` (4-digit, no `ADR-` prefix in filename) | `adrs/` | `adr` |
| Iteration | `ITER-NN` | `ITER-NN.md` | `iterations/` | `iteration` |
| Entity | — | `kebab.md` | `entities/` | `entity` |
| Concept / answer | — | `kebab.md` | `concepts/` | `concept` |
| arc42 hub | — | `NN-kebab.md` | `arc42/` | `arc42` |

- Next ADR number = highest existing `NNNN` in `adrs/` + 1, zero-padded to 4.
- Use the Foam templates in `.foam/templates/` as the canonical page skeletons.
  These are synced **one-way** from the plugin via `arch-wiki sync-templates`
  (default reports drift; `--force` writes). Templates you author yourself
  (no `arch-wiki:template` marker) are **never overwritten** — to replace one,
  delete it first, then re-sync.
- New Layer-2 pages MUST carry frontmatter `type:` (drives graph coloring) and
  relevant `tags:`.

## Wikilink convention (graph edges)

- Link by filename-without-extension with a readable alias:
  `[[QA-001-api-response-time|QA-001 · API Response Time]]`.
- A wikilink to a not-yet-created note is an intentional **placeholder** — fine,
  it marks future work; a markdown link to a missing file is a **broken link** —
  not fine.
- Cross-link **bidirectionally in spirit**: when an ADR cites QA-003 as a driver,
  the value of the graph is that QA-003's backlinks now show that ADR. Do not
  hand-maintain backlinks (Foam derives them) — just ensure forward links exist.
- Reuse existing content with embeds `![[note#^anchor]]` instead of copy-paste.

## Operations

### `/arch-wiki:ingest <raw/file>`
1. Read the source in `raw/` (never modify it).
2. Extract candidate drivers (UC/QA/CON/CONC) and decisions.
3. Create/update Layer-2 pages from templates; place by the ID scheme above.
4. Wire `[[wikilinks]]` to every entity/decision/driver mentioned.
5. **Flag contradictions** with existing pages via
   `arch-wiki record-risk --source ingest --id <ID> --conflict "<one-liner>"`
   (idempotent row in `risks.md`) plus a note on the affected page — do not
   silently overwrite recorded decisions.
6. Each page touched gets/refreshes a **Sources** section pointing back to the raw file.

### Functional rules from the Product Owner: `/arch-wiki:pull-stories` (CAP-1)
The PO maintains a read-only Confluence "User Story Log" (`integrations.upstream.userStoryLog`).
`pull-stories` snapshots it (+ its child stories) into `raw/_synced/user-story-log/` via the
Confluence MCP — the CLI is the authorized writer (never hand-edit `raw/_synced/`); re-pulls
are idempotent (drift by contentHash) and orphans are reconciled with `prune-stories`. Then
`/arch-wiki:ingest raw/_synced/user-story-log/` turns stories into drivers. The log is
**advisory** (inspiration); drivers are the SA's canon — ingest dedups, never duplicates.

### Design process: `hypothesis` → `questionnaire` → `ingest` → `render-issue` → `trace`
- **`/arch-wiki:hypothesis <title> [from raw/<file>]`** — scaffold a `concept`
  hypothesis with traceability frontmatter (`status: hypothesis`, `source`,
  `realizes_driver`) and an auto kanban card (so it is not an orphan).
- **`/arch-wiki:questionnaire <qaw|rozanski|driver-gap> <topic>`** — scaffold a
  questionnaire skeleton into `raw/questionnaires/`; the CLI is the authorized
  author of that raw file (do not Edit/Write `raw/` by hand). Answers come back in
  the same file (`status: answered`, tag answers `closes: <id>`).
- **`/arch-wiki:ingest raw/questionnaires/<file>`** → `arch-wiki ingest-questionnaire`
  returns a traceability report (answers→drivers, unanswered, contradictions).
- **`render-issue`** — the SA chooses what to turn into a `[Arch]`/`[Techdesign]`
  issue (from `kanban.md`); never auto-create from gaps. Human-gated, idempotent on
  `(sourceId, kind, role)`; records the trace via `record-issue`.
- **`/arch-wiki:trace <ID>`** — walk raw → driver → ADR → issue → showcase.

These three files are the **source of truth** (Confluence is a read-only projection),
each updated only via the CLI — never edited by hand:
- `utility-tree.md` = QAW output (`arch-wiki update-utility-tree`).
- `gap-analysis.md` = derived from lint (`arch-wiki update-gap-analysis`).
- `kanban.md` = backlog/intent (`arch-wiki update-kanban`; moves need explicit `--column`).

### `/arch-wiki:query <question>`
1. Answer from the **synthesized wiki**, not by re-reading `raw/`.
2. Cite the wiki pages used (as wikilinks).
3. If the answer is durable and reusable, offer to persist it as a
   `concepts/<topic>.md` page wired into the graph.

### `/arch-wiki:lint`
Audit and report (then propose fixes / append to `risks.md`):
- Orphan pages and broken wikilinks / unresolved placeholders.
- QA scenario with no linked ADR **or** no linked C4 element.
- Driver (UC/QA/CON/CONC) with no coverage in any ADR/iteration (gap analysis).
- ADR with `status: superseded`/`deprecated` but no link to its successor.
- C4 element ⟷ wiki entity drift — the **deterministic verdict is
  `arch-wiki validate-c4`** (model from the LikeC4 MCP / `likec4 export json`); this
  LLM-lint line only adds nuance the rule cannot judge.
- Terminology drift: terms used across pages but absent from `glossary.md`.
- Missing referenced pages (e.g. `utility-tree`, `gap-analysis`).

## C4 / LikeC4 rules

> **Project-specific — adapt to your model.** The element kinds, views, and
> system/subsystem names below are declared by *your* `c4/src/*.c4` sources.
> List them here so ingest/lint know the canonical vocabulary of your system.

- Edit only `c4/src/*.c4`. Element kinds & deployment nodes are declared in
  `specification.c4`; views in `views.c4`.
- After any C4 change run `cd c4 && npm run validate` (and `npm run build` to
  regenerate the static site / `npm run export` for PNGs).
- Record your top-level system and its subsystems here, e.g.:
  `Top system is <system> with subsystems <a>, <b>, <c>.`

## MCP-Setup — integrations & navigation aids

External side-effects (issues, publish, notifications) go through **MCP servers**
declared in the target's `.mcp.json` or at user scope — **never hardcode secrets**;
pass them as `${ENV}`. Commands that need one (`render-issue`, `publish`) first
`ToolSearch` for it and stop with this setup hint if absent.

> **Restart after a plugin update.** The `arch-wiki` binary on `PATH` and the MCP tool
> registry are both resolved **at session start**. After `claude plugin update …`, the
> previous CLI version keeps answering until you restart the session (verify with
> `arch-wiki version` — or call the new version by full path); likewise a newly-added MCP
> server exposes its tools only after a restart. Use **one MCP server name per endpoint**
> — several servers pointing at the same endpoint register the tools of only one.

**Confluence mirror language (`/arch-wiki:publish`).** By default the mirror is published in English
(the wiki canon). Set `integrations.confluence.language` (e.g. `"ru"`) to publish a TRANSLATED
projection: the canon stays English in `docs/architecture/**`, and `publish` translates prose / headings /
link-labels **and the page title** (label only — the `UC-014:` id prefix stays byte-exact) at publish time
while Core protects structural spans (code, link URLs, artifact ids) and keeps every term in
`integrations.confluence.preserveTerms` — plus **bold** terms from `glossary.md` — verbatim. The content
hash is over the English source, so a translated mirror never drifts on its own; a not-yet-published
cross-link is reserved as a `…/pages/pending` masked link so the translation is reused across the 2-pass
publish (not re-translated). Repo-relative links (`../iterations/`, `CLAUDE.md`) are dead in Confluence →
Core neutralizes them to plain text.

**Issue → mirror trace (`/arch-wiki:issue`).** The issue body stays self-contained (inlined excerpts); a
`## Источник` section links each referenced artifact to its Confluence mirror page (from the published-pages
ledger — the human-navigable trace; the ledger + `realized_by` frontmatter remain the machine trace). Set
`integrations.confluence.siteUrl` (e.g. `https://acme.atlassian.net`) for absolute links; absent →
root-relative `/wiki/…` (resolves from Jira on the same Atlassian site). Publish the mirror first so the
targets have page-ids — an unmirrored target yields no link (a warning, not a failure).

**Foam MCP** and **LikeC4 MCP** are **read-only navigation aids** (Foam: wikilinks /
backlinks / tags graph; LikeC4: `read-project-summary` / `search-element` /
`query-graph`). They help humans/agents explore — they are **NOT authoritative**.
Every verdict on links / orphans / coverage / C4-drift / ids / scaffold comes only
from `arch-wiki` (the deterministic Core). The CLI never calls these MCPs; if they
are absent, every `arch-wiki` operation is unaffected. LikeC4 stays hand-authored
(`c4/src/*.c4`); the cartographer **proposes**, `arch-wiki validate-c4` **judges**.

### `/arch-wiki:validate-c4`
Get the model JSON from the LikeC4 MCP (`read-project-summary`) — or `likec4 export
json` in headless/CI — and pipe it to `arch-wiki validate-c4 --stdin`. Core compares
C4 elements ⟷ wiki entities deterministically (policy `c4.consistency` +
`.arch-wiki/c4-baseline.json` for adoption); do not recompute its verdict by eye.

## Invariants
- Never edit files in `raw/`.
- Never delete or rewrite an accepted ADR — supersede it with a new ADR and link
  back (record the transition in an `iterations/` entry, mirroring ITER-01).
- `glossary.md` is the single source of truth for domain terms.
- Prefer updating an existing page over creating a near-duplicate.

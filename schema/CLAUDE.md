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
- C4 element in `c4/src/*.c4` not referenced by any driver/ADR (and vice-versa).
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

## Invariants
- Never edit files in `raw/`.
- Never delete or rewrite an accepted ADR — supersede it with a new ADR and link
  back (record the transition in an `iterations/` entry, mirroring ITER-01).
- `glossary.md` is the single source of truth for domain terms.
- Prefer updating an existing page over creating a near-duplicate.

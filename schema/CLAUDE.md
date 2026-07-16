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

## Language convention

- **Raw (Layer 1)** — any language; author/source notes (often the team's working language).
- **Wiki graph (Layer 2: drivers, ADRs, concepts, entities, C4)** — **English**. This is the
  source of truth and the whole corpus is English. **Author every new artifact in English even
  when the raw source or the discussion is in another language.** (The mirror pipeline assumes
  an English canon: the content hash is over the English body and translation runs English →
  target — so a non-English graph would break drift-stability and translation.)
- **Confluence mirror (projection)** — translated at publish time per `.arch-wiki/config.json`
  `integrations.confluence.language` (when set) + `preserveTerms`, via `/arch-wiki:publish`
  (`finalize-confluence`). **Never hand-author the graph in the mirror language** — the projection
  is generated, not written.

## Methodology roles (the ontology)

This wiki is an **FPF Domain Principle Framework (DPF)** — a domain specialization of the
First Principles Framework for solution architecture. Each methodology maps onto an explicit
FPF *kind* so every command, agent, and skill shares one vocabulary and the classic category
errors are ruled out by construction: *a recipe is not the work* (a method ≠ its enactment)
and *a backlog card is not performed work* (a plan ≠ what happened).

| Methodology element | FPF kind | Role |
|---|---|---|
| **ADD 3.0** | `U.Method` (A.3.1) | the reusable *way of doing* design; inputs = drivers (`drivers/`). Not the work. |
| the **`add-method` skill** | `U.MethodDescription` (A.3.2) | the episteme that *describes* ADD. A description ≠ an enactment. |
| **`ITER-NN`** iteration log | `U.Work` (A.15.1) | a *dated enactment* of ADD — what actually happened. Not proof the design is "done". |
| a **`kanban.md` card** / iteration goal | `U.WorkPlan` (A.15.2) | *intended* work. A card is not performed work. |
| **arc42** | publication / access carrier | the 12 hubs in `arc42/` *expose* artifacts (see table below); they do no work and are not a method. |
| **C4 / LikeC4** | notation / View | the *visual notation* of the structure; hand-authored in `c4/src/*.c4`. The blocks it draws are described in **arc42 §5** (responsibilities / interfaces); `validate-c4` reports drift between model and wiki. |
| **ADR (MADR)** | decision-episteme ledger | append-only record of decisions (the *why*); `adrs/` (arc42 §9). |
| a **driver** (UC/QA/CON/CONC) | problem-side episteme (C.2.P) | the stable problem inputs a decision must cite (a decision cites its drivers, not vice-versa). |

> **The C4 model is the structure's notation — not a second wiki.** You hand-author it in
> `c4/src/*.c4`; **arc42 §5 (Building Block View)** is where a block's *responsibilities and
> interfaces* are described (ADD 3.0 step 5). Do not restate the model's ids/kinds/relationships
> in prose — that is a second source of truth. When notation and wiki disagree it is **drift to
> reconcile**: `arch-wiki validate-c4` judges it deterministically (never eyeballed), and
> `c4.consistency.requireDocumentation` is **opt-in** — the plugin does NOT demand a wiki page
> per model element by default.

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
- QA Measure well-formedness (`qa-measure-untestable`, low, FPF C.16): a stated Measure that carries
  no numeric threshold — a wish, not a Characteristic on a Scale. Unpack the "-ility" via the QA
  template's **Quality Bundle** (Characteristic · Scale · Polarity · Target · Window · Scope —
  FPF C.25 / A.18 / A.2.6 USM).
- Driver (UC/QA/CON/CONC) with no coverage in any ADR/iteration (gap analysis).
- Driver **live-covered only by non-accepted** ADR(s) — "paper coverage": a `proposed`/
  `superseded`/`deprecated` decision does not *live-cover* a driver (`driver-not-live-covered`,
  low; FPF B.3.3 assurance-from-evidence / A.2.4 status-is-not-authority). It is not a hard
  gap (an inbound decision exists) but it is not yet a ratified one.
- ADR with `status: superseded`/`deprecated` but no link to its successor.
- Accepted ADR with an empty candidate set (`adr-options-empty`, low, FPF C.32.ADA): a present but
  empty `## Considered Options` section — a decision recorded with no alternatives (robust to any
  option format). An ABSENT section is left to `/arch-wiki:review` adequacy; whether a *filled* set is
  substantive/distinct is an LLM judgement, not a deterministic count.
- Utility-tree ScoringMethod (`utility-priority-illformed`, low, FPF A.19): a `utility-tree.md`
  priority cell that is present but not an ATAM **(Importance,Difficulty)** H/M/L pair — accepts the
  short marker `H` and the pair `H,M`/`(H,M)`/`H/M`; an unset placeholder (`—`, TBD) is never flagged.
  The tree is an **Evaluation CharacteristicSpace**: `update-utility-tree` returns the whole tree
  `ranked` by a deterministic importance-dominant score (bands L 4–6 < M 7–9 < H 10–12).
- C4 element ⟷ wiki entity drift — the **deterministic verdict is
  `arch-wiki validate-c4`** (model from the LikeC4 MCP / `likec4 export json`); this
  LLM-lint line only adds nuance the rule cannot judge. When the model source carries **relationships**
  and **views** (full `likec4 export json`; the MCP `read-project-summary` may omit relationships),
  `validate-c4` also reports `c4-relationship-dangling` (an edge endpoint that names no element — model
  integrity, FPF E.17.2) and `c4-element-in-no-view` (a documented-kind element drawn in no view —
  FPF C.30.ASV). Both are **skip-safely**: absent from a summary-only model, they never fire (never
  invented) — low severity, baseline/ignore-suppressible.
- arc42 ⟷ view correspondence (`c4-view-missing`, medium): a `c4`-tagged arc42 hub shows `` `view X` ``
  / `` `deployment view X` `` but the model defines no view `X` — a dangling promise (renamed/dropped
  view). Only those keyword forms count as references; a bare backticked id is not read as one. Also
  skip-safely (no views in the model ⇒ not checked). Scaffold the missing view with
  `arch-wiki scaffold-c4-view --id X`.

**Scaffolding C4 (v0.25).** `arch-wiki scaffold-c4-element` / `scaffold-c4-view` write ONE **new,
additive** `.c4` file each (`model { extend <fqn> { … } }` / `views { view <id> { … } }`) under
`c4.dir`. Core supplies the DSL syntax; **you** supply the semantics (parent/kind/title) — it never
infers structure from prose and never edits your hand-authored sources or their curated layouts.
Idempotent (an existing file is never overwritten); needs a `[c4]` config or exits 2. LikeC4 —
not Core — validates the model: run `npm run validate` after.
- arc42 view-hub correspondence (`view-hub-uncorresponded`, low, FPF E.17.0/C.34): an arc42 hub
  tagged `c4` (a **viewpoint binding**) that shows no C4 view — no `## C4 …` section. The `c4` tag is
  the viewpoint↔view correspondence marker; a bound hub must actually present its view.
- Constraint boundary-norm kind (`constraint-norm-kind-invalid`, medium, FPF A.6.B): a constraint's
  optional `norm_kind:` frontmatter must be `law` | `admissibility` | `deontic` | `work-effect`.
- Terminology drift: terms used across pages but absent from `glossary.md` (LLM judgement).
  Deterministic Core checks over the term sheet: `glossary-near-duplicate` (mint-or-reuse, FPF F.8),
  `glossary-term-unlinked` (a term with no managing-page `[[link]]`, F.17), `deprecated-term-without-successor`
  (F.13), `entity-without-glossary-term` (coverage). The glossary is a **Unified Term Sheet** (FPF F.17):
  `| Term | Definition |`, optionally extended with a `Context` column (the bounded-context sense, A.6.9)
  and a `Status` column (lexical continuity, F.13).
- Missing referenced pages (e.g. `utility-tree`, `gap-analysis`).

### `/arch-wiki:assurance` (evidence & assurance)
Graded, deterministic maturity per driver (FPF B.3.3) + a decay register (FPF B.3.4):
- `arch-wiki assurance` computes each driver's **AssuranceLevel** — **L0** (no accepted
  ADR/iteration covers it, or only non-accepted "paper coverage"), **L1** (live-covered by an
  accepted ADR/iteration), **L2** (also realized by a non-stale `realized_by` issue). Design-time
  coverage and run-time realization stay distinct — never collapsed into one score.
- `arch-wiki update-epistemic-debt` regenerates the managed region of `epistemic-debt.md` — a
  Core-owned derived register (like `gap-analysis.md`) consolidating decay signals: superseded
  citations, paper coverage, stale issues, missing sources, and **overdue evidence** (an artifact
  whose optional `valid_until:` frontmatter has expired past `evidence.debtBudgetDays`, FPF B.3.4).
  Typed provenance frontmatter (`verified_by`/`validated_by` — design-time vs run-time carriers,
  FPF A.10) is machine-read and mirror-stripped. Notes outside the markers survive; never hand-edit
  inside them. It is an **internal register — excluded from the Confluence mirror**.
- `arch-wiki waive-debt --subject <id> --reason <…> [--until <date>] --by <who>` records a
  human-gated, auditable waiver (FPF B.3.4 CC-ED.5) suppressing a subject's debt until a date.

### `/arch-wiki:review` (adequacy)
Per-kind structural adequacy of design artifacts (FPF C.32.ADA decision-adequacy, C.30.AD):
- `arch-wiki adequacy [--kind <k>] [--id <ID>]` gives each artifact a `band` (`adequate` / `thin` /
  `inadequate`) from checkable `bases` — a **capped structural floor, not a quality score**. `inadequate`
  = a *critical* base fails (ADR with no Decision Outcome / no options / invalid status; a driver at
  AssuranceLevel L0); `thin` = only non-critical bases fail. Bases compose the wave's evidence signals
  (a driver's `covered` base reads its AssuranceLevel; `no-debt` reads `epistemic-debt`). The `options`
  base accepts the MADR-canonical `## Considered Options`, synonym headings (`## Alternatives Considered`,
  `## Options Considered`, `## Alternatives`) and an `### Option N`/`### Alternative N` sub-block layout
  (v0.22); the reserved MADR template slot `0000-template` is a skeleton and is NOT scored.
- The `/arch-wiki:review` command adds the **judgement** the Core cannot (are the options distinct, the
  measure testable, the consequences balanced) via the `adequacy-rubric` skill — read-only, proposes fixes.

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
while Core **masks** structural spans (code, link URLs, artifact ids) AND every term in
`integrations.confluence.preserveTerms` — plus **bold** terms from `glossary.md` **and every Term-column entry
of the Unified Term Sheet** (v0.22, so a plain multi-word glossary term stays English too) — into opaque placeholders,
so they survive translation byte-exact by Core enforcement (not by the translator's discretion). The content
hash is over the English source, so a translated mirror never drifts on its own; a not-yet-published
cross-link is reserved as a `…/pages/pending` masked link so the translation is reused across the 2-pass
publish (not re-translated). Repo-relative links (`../iterations/`, `CLAUDE.md`) are dead in Confluence →
Core neutralizes them to plain text. The mirror is a CURATED projection (not a byte copy): the git
source-of-truth never leaks into Confluence. Core removes (before the content hash) the `## Sources`
provenance section, `**Source:** raw/…` author fields, and repo-internal path references in
prose/code/parentheticals (`raw/…`, `docs/architecture/…`, `c4/src/*.c4`, `.foam/…`, register files,
`*.csv`); `CLAUDE.md` (the Layer-3 meta-doc) is excluded entirely. The wiki schema (rule 6 — Sources stays
in the wiki) is unaffected. Two acceptance tiers: (i) repo-internal source paths MUST disappear;
(ii) external/POC git URLs in ADRs (bitbucket.org/…, git.shakuro.com) are decision-evidence, kept by design.
A strict anchored allowlist means C4 element ids and domain terms are never touched. **Structural/methodology labels stay English** — the QA-scenario
6-part labels (Source/Stimulus/Artifact/Environment/Response/Measure), arc42 section markers and ADD field
names / structural table headers are translated only in their VALUES, not the labels themselves; add a label
to `integrations.confluence.preserveTerms` and Core masks every occurrence to a placeholder (a Core mask, not
a translator instruction) — enforcing it deterministically.

**Confluence publish config (v0.8).** `createConfluencePage`/`updateConfluencePage` need the **numeric**
`integrations.confluence.spaceId` (NOT the space KEY — the key returns HTTP 400; look it up once via
`getConfluenceSpaces(keys:["<KEY>"])`) plus `integrations.confluence.cloudId`; `space` (the KEY) is still used
for the `/wiki/spaces/<KEY>/pages/<id>` cross-link URLs. `render-confluence` runs a preflight and lists any
missing field in `data.warnings`. **Destination-drift guard:** `record-page --page-version <n>` stores the
published Confluence page version in the ledger; before an update, `publish` compares the LIVE version to it
and refuses to clobber a hand-edited page (override only on explicit force) — the verdict is deterministic,
not eyeballed. **Reverse trace edge:** the mirror page links back to its realizing Jira issue (from
`realized_by`); set `integrations.jira.siteUrl` (or it reuses `confluence.siteUrl`) for the absolute
`…/browse/<KEY>` link. **C4 diagrams:** local image embeds become a deterministic placeholder in the mirror
(the MCP has no attachment upload) — attach diagrams manually in Confluence for now.

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

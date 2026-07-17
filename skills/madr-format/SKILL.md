---
description: MADR Architecture Decision Record format, numbering, and status lifecycle as used in docs/architecture/adrs. Use when creating, updating, or superseding an ADR.
---

# ADR (MADR) format

> **FPF kind.** An ADR is a *decision episteme* in an append-only ledger; this skill is its
> `U.MethodDescription` (FPF A.3.2). FPF **C.32.ADR** names the record an *Architecture Decision
> Record **Projection*** — it asks "when is an ADR only a publication projection rather than the
> decision?" The **decision** is the thing (C.32.PAD); the **file** is its record. That distinction is
> what makes the lifecycle below coherent — see *Lifecycle*.

ADRs are the decision *ledger* (arc42 §9) — append-only, one decision per file.
Canonical skeleton: `docs/architecture/adrs/0000-template.md`.

## Filename & numbering
- File: `adrs/NNNN-kebab-title.md` — 4-digit, zero-padded, **no** `ADR-` prefix
  in the filename. Heading is `# ADR-NNNN: Title`.
- Next number = max existing `NNNN` + 1.

## Status — the canon
`proposed | rejected | accepted | deprecated | superseded`

- `- **Status:**` proposed | rejected | accepted | deprecated | superseded
- Core owns this list (`domain/model/AdrStatus.ts`); a test fails if this line drifts from it.
  `lint` reports **`adr-status-unknown`** (high — it blocks `validate-graph`) for anything else,
  because an unrecognised status silently disables every status-driven rule (live-coverage, mirror
  visibility, successor checks).
- **`rejected`** is a real state: the option was considered and turned down. It is not `deprecated`
  (was live, now discouraged) and not `superseded` (replaced by a named successor).
- **`partially` is retired.** It mixed the DECISION's state with its IMPLEMENTATION's. The decision was
  made → `accepted`; how much is built is the assurance layer's business (**L1** decided vs **L2**
  realized) plus a tech-debt row in `risks.md` for the unbuilt part. `arch-wiki normalize-adr-status`
  reports the mapping; `--write` applies it.
- The status is stated in up to three carriers — frontmatter `status:` (**canonical**), the
  `adr/<status>` tag, and the short form's `- **Status:**` body label. Keep them equal;
  `adr-status-inconsistent` reports a disagreement.

## Required structure
**Two generations are in the wild and Core accepts both** — do not rewrite an old record just to
re-shape it (see *Lifecycle*):

| | Current (MADR) | Legacy (tolerated) |
|---|---|---|
| Decision | `## Decision Outcome` → `### Consequences` | `## Decision` |
| Status | frontmatter `status:` + `- **Status:**` | `## Status` section |
| Options | `## Considered Options` (+ `## Pros and Cons of the Options`) | `## Alternatives Considered`, `### Option N` |
| Links | `## More Information` | `## See also` |

Author **new** ADRs in the current form:
- `- **Status:**` / `- **Date:** YYYY-MM-DD`
- `- **Decision Drivers:**` list — wikilink the QA/CON/CONC/UC IDs.
- `## Context and Problem Statement` · `## Decision Drivers` · `## Considered Options`
- `## Decision Outcome` → `### Consequences` (Good/Bad) · `## Pros and Cons of the Options`
- `## More Information` — related ADRs (wikilinked) and realized C4 elements.

## Decision adequacy (FPF C.32.ADA)
- An accepted decision needs a real **candidate set** — ≥2 distinct `## Considered Options`. `lint`
  flags `adr-options-empty` when an accepted ADR's Considered-Options section is present but empty;
  whether a filled set has *enough, genuinely distinct* alternatives is your judgement at `/arch-wiki:review`.
- Record **`## Confirmation`** (how/when the decision is confirmed — a review, test, deployment, or
  metric) and **`## Reopen Triggers`** (what observation would revisit it). These make the decision
  falsifiable rather than a one-way door.

## Lifecycle

**The file is mutable; the decision is not.** "Never rewrite an accepted ADR" is about the DECISION's
content — Context and Problem Statement, Considered Options, Decision Outcome, Consequences, the
rationale. Changing the `status`, adding the cross-links, appending a note: those edit the *record*,
which FPF C.32.ADR calls a **projection** of the decision, and they are prescribed by the method, not a
breach of it. If it were otherwise, superseding could never be recorded at all.

So: a `proposed` ADR is still free to edit — it is not yet binding. Once `accepted`, edit only the
record's own fields; to change the decision, write a new ADR.

| From | To | Meaning |
|---|---|---|
| `proposed` | `accepted` \| `rejected` | ratified, or considered and turned down |
| `accepted` | `superseded` | a **named successor** replaces it |
| `accepted` | `deprecated` | no longer to be followed, **no successor** |
| `rejected` · `superseded` · `deprecated` | — | terminal |

**Superseding — the required side-effects** (all four, or the ledger lies):
1. old ADR: `status: superseded` **and** a link to the successor (`superseded-no-successor` is high);
2. new ADR: `## More Information` links the predecessor;
3. **one line of reason** — was the decision *replaced* by a better option, or did its *rationale
   decay* (a premise stopped holding)? A reader cannot infer which, and it changes what to re-check.
   *(Our convention: no framework prescribes this taxonomy — we ask for it because it is useful.)*
4. record the transition in `iterations/ITER-NN.md` (cf. ITER-01 superseding ADR-0023 with ADR-0027).

`deprecated` needs the same successor link *only if* one exists; if the decision is simply abandoned,
say so in the record — but Core still asks for a link, so point at whatever supersedes it in practice.

## Cross-linking
Every ADR should link: its drivers (QA/CON/CONC/UC), the C4 elements it realizes
(arc42 §3/§5/§6/§7), and related ADRs. This is what makes the Foam backlinks
panel useful.

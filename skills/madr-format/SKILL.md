---
description: MADR Architecture Decision Record format, numbering, and status lifecycle as used in docs/architecture/adrs. Use when creating, updating, or superseding an ADR.
---

# ADR (MADR) format

> **FPF kind.** An ADR is a *decision episteme* in an append-only ledger; this skill is its
> `U.MethodDescription` (FPF A.3.2). Superseding is a decision-adequacy event (FPF C.32.ADA) —
> the old rationale decayed or was replaced — **not** a rewrite of the accepted record.

ADRs are the decision *ledger* (arc42 §9) — append-only, one decision per file.
Canonical skeleton: `docs/architecture/adrs/0000-template.md`.

## Filename & numbering
- File: `adrs/NNNN-kebab-title.md` — 4-digit, zero-padded, **no** `ADR-` prefix
  in the filename. Heading is `# ADR-NNNN: Title`.
- Next number = max existing `NNNN` + 1.

## Required structure
- `- **Status:**` proposed | accepted | deprecated | superseded
- `- **Date:**` YYYY-MM-DD
- `- **Decision Drivers:**` list — wikilink the QA/CON/CONC/UC IDs.
- `## Context and Problem Statement`
- `## Decision Drivers`
- `## Considered Options`
- `## Decision Outcome` → `### Consequences` (Good/Bad)
- `## Pros and Cons of the Options`
- `## More Information` — related ADRs (wikilinked) and realized C4 elements.

## Lifecycle / superseding
- Never rewrite an accepted ADR. To change a decision, write a **new** ADR and:
  - set the old ADR's `Status` to `superseded` and link the successor,
  - set the new ADR's `More Information` to link the predecessor,
  - record the transition in an `iterations/ITER-NN.md` entry (cf. ITER-01
    superseding ADR-0023 with ADR-0027).

## Cross-linking
Every ADR should link: its drivers (QA/CON/CONC/UC), the C4 elements it realizes
(arc42 §3/§5/§6/§7), and related ADRs. This is what makes the Foam backlinks
panel useful.

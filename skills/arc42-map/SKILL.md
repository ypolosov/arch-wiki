---
description: arc42 12-section template and how each section maps to artifacts in the GromTech docs/architecture wiki. Use when placing, cross-referencing, or generating architecture content so it lands in the right arc42 section and folder.
---

# arc42 section map

arc42 is the documentation *container*: 12 sections, each answering "where does
this piece of architecture knowledge live". In this repo each section is a hub
page in `docs/architecture/arc42/NN-*.md` that links to the real artifacts.

| § | Section | Artifact source | Hub |
|---|---------|-----------------|-----|
| 1 | Introduction & Goals | `drivers/use-cases/` (UC-*) + business goals | `arc42/01-introduction-and-goals.md` |
| 2 | Constraints | `drivers/constraints/` (CON-*) | `arc42/02-constraints.md` |
| 3 | Context & Scope | C4 `context` view | `arc42/03-context-and-scope.md` |
| 4 | Solution Strategy | key ADRs + `iterations/` (ITER-*) | `arc42/04-solution-strategy.md` |
| 5 | Building Block View | C4 `containers`/component views | `arc42/05-building-block-view.md` |
| 6 | Runtime View | C4 dynamic views + UC flows | `arc42/06-runtime-view.md` |
| 7 | Deployment View | `c4/src/deployment.c4` | `arc42/07-deployment-view.md` |
| 8 | Crosscutting Concepts | `drivers/concerns/` (CONC-*) | `arc42/08-crosscutting-concepts.md` |
| 9 | Architecture Decisions | `adrs/` (MADR) | `arc42/09-architecture-decisions.md` |
| 10 | Quality Requirements | `drivers/quality-attributes/` (QA-*) | `arc42/10-quality-requirements.md` |
| 11 | Risks & Technical Debt | `risks.md` | `arc42/11-risks-and-technical-debt.md` |
| 12 | Glossary | `glossary.md` | `arc42/12-glossary.md` |

## Rules
- Don't duplicate content into the hubs — hubs *link* to artifacts.
- When a new artifact is created, add a wikilink to it from the matching hub so
  it isn't an orphan.
- arc42 is the skeleton; the substance comes from ADD drivers, ADRs, and C4.

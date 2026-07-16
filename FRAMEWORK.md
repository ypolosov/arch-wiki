# arch-wiki as an FPF Domain Principle Framework — Framework Decision (PFAD)

> **Developer-facing.** This is the framework decision record for the **arch-wiki plugin
> itself**. It is NOT shipped to consuming repositories (the user-facing contract is
> [`schema/CLAUDE.md`](schema/CLAUDE.md)) and is NOT part of any project's wiki. It records
> *why* arch-wiki is structured the way it is, grounded in the First Principles Framework
> (FPF). Ground: FPF `E.4.PFAD` (Principle-Framework Architecture Decision), `E.4.DPF`
> (Domain Principle Framework authoring), `E.4.PFR` (edition discipline), `E.5` (guard-rails).

## Decision

**arch-wiki is a Domain Principle Framework (DPF): a domain specialization of FPF for
solution architecture.** FPF supplies the ontology (holon · Method · Work · Episteme), the
effect-free morphism theory (the Confluence mirror), the evidence & assurance calculus
(`A.10` / `B.3`), the measurement apparatus (`CharacteristicSpace`), and the multi-view
publication kit (`E.17`). The plugin encodes **domain-specific projections** of these; it
does not restate or fork FPF.

## PFAD record (E.4.PFAD slots)

| Slot | Value |
|---|---|
| `frameworkDecisionId` | PFAD-AW-001 |
| `governedFrameworkRef` | arch-wiki — Solution-Architecture DPF |
| `boundedContextRef` | an LLM-maintained `docs/architecture/` wiki (Karpathy LLM-Wiki) |
| `fpfCoreEditionRef` | `FPF-Spec.md` — Core Conceptual Specification, July 2026 |
| `decisionQuestion` | which pattern set carries FPF-grounded solution-architecture guidance? |
| `selectedPatternSetRefs` | ADD 3.0 (`U.Method`, A.3.1) · arc42 (access carrier) · ADR/MADR (decision ledger) · C4/LikeC4 (notation / View, E.5.2) |
| `selectedPatternRelationRefs` | ADD produces ADRs + C4 views; outputs land in arc42 hubs; `ITER-NN` logs the `U.Work` that enacts ADD |
| `dependencyAndEditionRefs` | depends on FPF Core; **no** reverse dependency from Core (`E.5.3` / `E.4.PFR`) |
| `accessCarrierRefs` | the plugin (commands / agents / skills / CLI) — an *access* carrier, not the framework itself |
| `rejectedAlternatives` | (a) land the guidance into `FPF-Spec.md` itself; (b) ship only a checklist with no deterministic Core |
| `refreshOrSupersessionConditions` | refresh when the FPF edition changes, or when the arc42 / ADD / MADR / C4 state-of-the-art shifts (`G.11`) |

## Guard-rails carried (FPF E.5)

- **GR-2 · ~~Notational Independence (E.5.2): wiki entities are the semantic canon; C4/LikeC4 is one
  notation of them.~~ RETRACTED in v0.23.0 — this was fabricated grounding.** The claim did not come
  from any of the four methodologies arch-wiki composes (arc42 + ADD 3.0 + MADR + C4/LikeC4): none of
  them says "entity" (ADD says *element*, arc42 says *Building Block View §5*, C4 says *element*), and
  `c4/src/*.c4` is **hand-authored**, not derived from the wiki — so it is not "one notation of" the
  entities. What is true: the C4 **model** holds the structure (ids, kinds, relationships) and is the
  source of truth for it; **arc42 §5** describes what a block is *for* (responsibility, interfaces);
  C4 **views** are the projections. `validate-c4` reports drift, and the element⟷entity direction is
  **opt-in** (`c4.consistency.requireDocumentation`). See [[arch-wiki-original-scope]] for the rule
  this violated: name the source methodology before canonizing anything.
- **GR-3 · Unidirectional Dependency (E.5.3).** arch-wiki imports FPF; FPF never imports
  arch-wiki. *Note:* page-level `driver → ADR` traceability direction is grounded in `C.2.P`
  / `C.32.PAD` (a decision cites its drivers), **not** GR-3 — GR-3 governs framework-family
  editions, not page links.

## Edition discipline (FPF E.4.PFR / G.11)

arch-wiki tracks a **schema version** (`.arch-wiki/version.json`, `CURRENT_SCHEMA_VERSION`). The
Pattern-Framework edition relations:
- **Supersession / refresh** — a schema bump is applied by `migrate` (idempotent, writes `.arch-wiki/*`
  only, never artifacts); `adopt` onboards a legacy wiki and records a lint baseline so a newly-added
  deterministic rule does not flood a pre-existing corpus.
- **Refresh conditions (G.11)** — re-cut the schema when the FPF edition changes, or the arc42 / ADD /
  MADR / C4 state-of-the-art shifts. New lint rules ship low-severity + baseline-suppressible, one wave
  at a time (no mass churn) — the empirical discipline in `docs/dev/release-loop.md`.
- **Deprecation** — retire a rule/field by dropping it from the schema + a RELEASE note; the managed
  registers (`epistemic-debt.md`, `gap-analysis.md`) keep stable markers across editions.

## Where the kinds are made concrete

- The FPF-kind table: [`schema/CLAUDE.md`](schema/CLAUDE.md) → *Methodology roles (the ontology)*.
- The `FPF kind.` note at the top of each skill: `skills/{add-method,arc42-map,likec4-dsl,madr-format}/SKILL.md`.
- The full FPF-grounded improvement backlog (49 proposals, P0→P2): [`result.md`](result.md).

> **Status:** foundational increment (wave 1) of the FPF improvement plan. This record makes
> the FPF-conformance claim inspectable and durable rather than tribal; subsequent Core rules
> (AssuranceLevel, epistemic-debt, C4↔wiki morphism checks, QA CSLC/Q-Bundle, …) reference the
> vocabulary fixed here.

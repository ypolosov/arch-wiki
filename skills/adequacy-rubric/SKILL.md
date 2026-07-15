---
description: Per-kind architecture-artifact adequacy rubric (FPF C.32.ADA decision-adequacy, C.30.AD description-adequacy, E.21 pattern-quality). Use with /arch-wiki:review to judge whether an ADR / driver / QA / iteration is adequate beyond the deterministic structural floor.
---

# Adequacy rubric (FPF C.32.ADA / C.30.AD / E.21)

`arch-wiki adequacy` computes a **capped structural floor** deterministically: a `band`
(`adequate` / `thin` / `inadequate`) from checkable `bases`. This rubric is the **judgement layer** —
whether the *content* is adequate, not just present. A structurally-`adequate` artifact can still be
substantively thin; a `thin` one may be fine for its stage. **Never invent facts** (status, coverage) —
judge, propose, and let the human/Core decide.

## The bases (what Core already checks — do not recompute)

- **ADR:** `drivers-linked` (≥1 driver), `options` (Considered Options section), `decision` (Decision
  Outcome section), `status` (valid), `successor-linked` (if superseded/deprecated) — all **critical**;
  `consequences` — non-critical.
- **Driver (UC/QA/CON/CONC):** `covered` (AssuranceLevel ≥ L1) — **critical**; `sourced`, `no-debt` —
  non-critical.
- **Iteration:** `drivers-linked`, `decisions-linked` — non-critical.
- **Concept/Entity:** `linked` (not orphan), `sourced` (concept) — non-critical.

## The judgement layer (what YOU add)

- **ADR (C.32.ADA):** Are the Considered Options genuinely *distinct alternatives* (not one option +
  strawmen)? Does the Decision Outcome state *why* and cite the drivers it satisfies? Are the Consequences
  **balanced** (both Good and Bad, not only upsides)? Is the status honest (an `accepted` ADR whose
  rationale has decayed should be revisited, not left)? A superseded ADR must link its successor *and* say
  what changed.
- **Driver (C.30.AD):** For a QA, is the **Measure testable** (a threshold + scale, e.g. "p95 < 200ms"),
  not a wish ("fast")? Is the driver at L0 a real gap or merely awaiting a ratified ADR (see `assurance`)?
- **Iteration:** Does it record which drivers moved partial→complete (the Drivers Impact), or is it a bare
  log?
- **Cross-cutting:** Prefer proposing a *ratified decision* (L0→L1) or *recorded realization* (L1→L2) over
  cosmetic edits. Route decayed evidence to `epistemic-debt.md`, contradictions to `risks.md`.

## Output discipline
Report **inadequate → thin → adequate**; name the failing base(s) and the one concrete fix. Propose only —
`/arch-wiki:review` never edits artifacts, never fabricates an `accepted` status or a coverage link.

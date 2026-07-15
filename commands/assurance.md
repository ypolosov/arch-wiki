---
description: Report graded AssuranceLevel (L0/L1/L2) per driver and regenerate the epistemic-debt decay register — deterministic Core (read-only report + one managed-region write).
argument-hint: (no args; operates on the whole wiki)
allowed-tools: Bash(arch-wiki:*)
---

Report driver **assurance** and refresh the **epistemic-debt** register (FPF B.3.3 / B.3.4).
The verdicts are deterministic and Core-owned — you only narrate.

1. `arch-wiki assurance` → each driver's `AssuranceLevel` + a `summary` (L0/L1/L2 counts). Levels
   are a domain projection of FPF B.3.3 (assurance is *computed from evidence*, not asserted):
   - **L0 Unsubstantiated** — no accepted ADR / iteration covers it (or only non-accepted "paper coverage").
   - **L1 Substantiated** — live-covered by an accepted ADR / iteration, not yet realized.
   - **L2 Realized** — additionally traced to a non-stale `realized_by` issue.
   Design-time coverage and run-time realization are kept distinct — never collapsed into one score.
2. `arch-wiki update-epistemic-debt` → regenerate the managed region of `epistemic-debt.md`
   (FPF B.3.4 — evidence is perishable): superseded citations, paper coverage, stale issues, missing
   sources. It writes ONLY between the `<!-- arch-wiki:debt:* -->` markers; human notes outside them
   survive. It is an internal health register — **excluded from the Confluence mirror**.
3. Narrate: the L0/L1/L2 distribution; the L0 drivers that most need a ratified decision; the debt
   rows by kind (incl. **overdue-evidence** from expired `valid_until`). Propose ratifying `proposed`
   ADRs (→ L1) or recording realization (→ L2) — never fabricate coverage, and never hand-edit
   `epistemic-debt.md` (it is Core-regenerated). To accept a debt item for now, use the human-gated
   `arch-wiki waive-debt --subject <id> --reason <…> [--until <date>] --by <who>` (FPF B.3.4 CC-ED.5).

---
description: Audit the architecture wiki graph integrity — orphans, broken links, uncovered drivers, superseded ADRs, terminology drift — and propose fixes.
argument-hint: "[--fix to apply low-risk fixes] [path to scope]"
---

You are running the **Lint** operation of the LLM-Wiki.

Args: `$ARGUMENTS`

1. Read `docs/architecture/CLAUDE.md` for the invariants and the Lint checklist.
2. Delegate the audit to the **architecture-linter** subagent (read-only). It checks:
   - orphan pages and broken wikilinks / unresolved placeholders,
   - QA scenarios with no linked ADR or no linked C4 element,
   - drivers (UC/QA/CON/CONC) with no coverage in any ADR/iteration,
   - ADRs marked superseded/deprecated without a link to the successor,
   - C4 elements not referenced by any driver/ADR (and the reverse),
   - terminology used across pages but missing from `glossary.md`,
   - referenced-but-missing pages (e.g. `utility-tree`, `gap-analysis`).
3. Present findings as a prioritized report grouped by category, each item with
   the offending file and a concrete fix.
4. Append new genuine risks/debt to `docs/architecture/risks.md`.
5. Only if `--fix` is present: apply **low-risk** fixes (add a missing wikilink,
   fix a typo'd link target, add a hub link for an orphan). Never auto-edit ADR
   decisions, drivers' substance, or `raw/`. Report every change.

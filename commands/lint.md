---
description: Audit the architecture wiki graph integrity with deterministic rules, then triage and explain the findings.
argument-hint: "[--severity high] [--changed <files>]"
allowed-tools: Bash(arch-wiki:*), Task
---

Run the **Lint** operation. Args: `$ARGUMENTS`

1. Run the deterministic linter (pre-approved): `arch-wiki lint --json` (pass through
   any `--severity`/`--changed`). The CLI owns the reproducible rules — orphans,
   typo'd/broken wikilinks, broken markdown links, uncovered drivers, and superseded
   ADRs without successors — and already suppresses the adoption baseline.
2. Hand the findings JSON to the **architecture-linter** subagent. It groups by
   severity, explains each with a concrete fix, runs the **judgement-based** checks
   the CLI cannot (QA↔C4 linkage, terminology drift vs `glossary.md`), and proposes
   `risks.md` rows.
3. Present a prioritized report and append genuine new risks to `docs/architecture/risks.md`.
   Never auto-edit ADR substance, drivers, or `raw/`.

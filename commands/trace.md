---
description: Trace an artifact end-to-end — raw source → driver → ADR → issue → showcase — and narrate the chain.
argument-hint: <ID>
allowed-tools: Bash(arch-wiki:*)
---

Trace an artifact. Args: `$ARGUMENTS`

This is almost purely deterministic — the CLI computes the chain; you only narrate it.

1. Run `arch-wiki trace <ID>`. The JSON `data` carries `raw` (provenance, each with
   an `exists` flag), `drivers`, `adrs`, `issues` (each with a `stale` flag when the
   `realized_by` frontmatter has no matching ledger row), and `showcase`.
2. Narrate the chain for the human in one or two sentences, e.g. "QA-007 came from
   raw/notes-2026.md via a QAW questionnaire, decided by ADR-0012, realized by
   GRM-431." Flag any `exists:false` raw source or `stale:true` issue as a problem.
3. Do not recompute anything — report exactly what the CLI returned.

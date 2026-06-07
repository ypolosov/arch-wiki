---
description: Scaffold a new ADD design iteration log (ITER-NN) with drivers addressed, decisions, and a driver-impact table.
argument-hint: <iteration title>
allowed-tools: Bash(arch-wiki:*)
---

Create a new ADD iteration. Title: `$ARGUMENTS`

The deterministic `arch-wiki` CLI owns the ITER-NN number, filename, template,
and arc42 hub backlink — never compute these by hand.

1. Run the scaffolder (pre-approved): `arch-wiki scaffold iter --title "$ARGUMENTS"`
2. From the JSON result, report `data.path`.
3. Following the `add-method` skill (the ADD loop), help fill **Drivers Addressed**
   (wikilinked), **Decisions Made** (wikilinked ADRs), and the **Drivers Impact**
   table. If this iteration supersedes a decision, follow the `madr-format`
   superseding rules (link old↔new ADR, set the old ADR's status).

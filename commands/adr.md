---
description: Scaffold the next-numbered MADR Architecture Decision Record with drivers wired as wikilinks.
argument-hint: <short decision title> [--drivers QA-003,CON-006,...]
allowed-tools: Bash(arch-wiki:*)
---

Create a new ADR. Title/args: `$ARGUMENTS`

The deterministic `arch-wiki` CLI owns the id, filename, template, driver
wikilinks, and arc42 hub backlink — never compute these by hand.

1. Parse `$ARGUMENTS`: an optional `--drivers a,b,c` flag and the remaining text as the title.
2. Run the scaffolder (pre-approved): `arch-wiki scaffold adr --title "<title>" [--drivers <ids>]`
3. From the JSON result, report `data.path` and any `data.unresolvedDrivers` (placeholder links to revisit).
4. Following the `madr-format` skill, help the curator draft the **Context**,
   **Considered Options**, and **Decision Outcome** prose only. Remind them to run
   `/arch-wiki:lint` before promoting the status to `accepted`.

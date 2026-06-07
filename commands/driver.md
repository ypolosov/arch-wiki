---
description: Scaffold a new ADD architectural driver (use case, quality attribute, constraint, or concern) from its template.
argument-hint: <uc|qa|con|conc> <title>
allowed-tools: Bash(arch-wiki:*)
---

Create a new ADD driver. Args: `$ARGUMENTS`

The deterministic `arch-wiki` CLI owns the id, folder, filename, template, and
arc42 hub backlink — never compute these by hand.

1. The first token of `$ARGUMENTS` is the kind (`uc|qa|con|conc`); the rest is the title.
2. Run the scaffolder (pre-approved): `arch-wiki scaffold <uc|qa|con|conc> --title "<title>"`
3. From the JSON result, report `data.path`.
4. Following the `add-method` skill, help fill the body. For `qa`, ensure the
   scenario has all six parts (Source/Stimulus/Artifact/Environment/Response/
   **testable Measure**). Suggest related drivers/ADRs to cross-link.

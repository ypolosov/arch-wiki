---
description: Scaffold a new ADD architectural driver (use case, quality attribute, constraint, or concern) from the right template.
argument-hint: <uc|qa|con|conc> <title>
---

Create a new ADD driver. Args: `$ARGUMENTS`

1. Parse the first token as the kind: `uc` → use case, `qa` → quality attribute,
   `con` → constraint, `conc` → concern. The rest is the title.
2. Follow the `add-method` skill and `docs/architecture/CLAUDE.md`. For `qa`,
   ensure the scenario has all six parts (Source/Stimulus/Artifact/Environment/
   Response/Measure) with a **testable Measure**.
3. Compute the next ID for that kind (max existing NNN + 1, zero-padded to 3) and
   create the file in the right folder from the matching template:
   - `uc`  → `drivers/use-cases/UC-NNN-<kebab>.md` (template `use-case.md`)
   - `qa`  → `drivers/quality-attributes/QA-NNN-<kebab>.md` (template `quality-attribute.md`)
   - `con` → `drivers/constraints/CON-NNN-<kebab>.md` (template `constraint.md`)
   - `conc`→ `drivers/concerns/CONC-NNN-<kebab>.md` (template `concern.md`)
4. Add a wikilink to it from the matching arc42 hub (§1 UC, §10 QA, §2 CON, §8 CONC).
5. Report the path and suggest related drivers/ADRs to cross-link.

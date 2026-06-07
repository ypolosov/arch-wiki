---
description: Ingest an immutable source from raw/ into the architecture wiki — extract drivers/decisions, create/update pages, wire wikilinks, flag contradictions.
argument-hint: <path under docs/architecture/raw/ (or a topic to locate)>
---

You are running the **Ingest** operation of the LLM-Wiki.

Source argument: `$ARGUMENTS`

1. Read and fully internalize the schema in `docs/architecture/CLAUDE.md`
   (ID schemes, arc42 map, wikilink convention, operation rules). It is the contract.
2. Locate the raw source: if `$ARGUMENTS` is a path, use it; otherwise search
   `docs/architecture/raw/` for the best match. **Never modify files in `raw/`.**
3. Delegate the extraction pass to the **architecture-ingestor** subagent, passing
   it the source path and the schema rules. It will:
   - extract candidate UC/QA/CON/CONC and decisions,
   - create/update Layer-2 pages from `.foam/templates/`, placed per the ID scheme,
   - wire `[[wikilinks]]` to every entity/driver/decision mentioned,
   - flag contradictions with existing pages as rows in `risks.md`,
   - add a **Sources** section to each touched page pointing back to the raw file.
4. Summarize for the curator: pages created/updated, new links, and any
   contradictions or open questions that need a human decision. Do not invent
   ADR decisions — propose them as `proposed` status for review.

## Ingesting an answered questionnaire

If `$ARGUMENTS` points at `raw/questionnaires/<file>` (an answered questionnaire):

1. Run `arch-wiki ingest-questionnaire --from raw/questionnaires/<file>`. The
   deterministic CLI returns `{method, related_drivers, answers, unanswered,
   contradictions}` — answers attributed to drivers via explicit `closes: <id>` tags.
2. For drivers in `unanswered`, judge (semantically) whether any untagged answer
   actually closes them; for genuine closures, scaffold/update the driver via
   `arch-wiki scaffold …` (topological order, parents first).
3. For each `contradictions` row, run `arch-wiki record-risk --source ingest
   --id <id> --conflict "<…>"` (idempotent).
4. Finish with `arch-wiki validate-graph` (exit 2 forces you to fix links first).

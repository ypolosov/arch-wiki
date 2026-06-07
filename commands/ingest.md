---
description: Ingest an immutable source from raw/ into the architecture wiki — extract drivers/decisions, create/update pages, wire wikilinks, flag contradictions.
argument-hint: <path under docs/architecture/raw/ (or a topic to locate)>
allowed-tools: Bash(arch-wiki:*), Read, Task, ToolSearch, mcp__local-rag__query_documents
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

## Enriching drivers with Related Patterns (books-rag, graceful)

Optional reference layer — skip silently if local-rag is unavailable.

1. `arch-wiki books-plan enrich --drivers QA-007,UC-001` → a deterministic query
   plan pinned to `local-rag`.
2. Before querying, probe `ToolSearch "mcp local-rag query"` / `mcp__local-rag__status`.
   If unavailable, emit a warning and stop here (the drivers are still produced).
3. Run `mcp__local-rag__query_documents` per query; collect a typed `BooksAnswer[]`
   (each keyed `enrich:<id>`, with `{source, score, excerpt}` hits).
4. `arch-wiki ingest --enrich --rag-results '<BooksAnswer[] JSON>'` — Core writes a
   `## Related Patterns` section per driver (an empty section with a `none` marker
   when a driver had zero hits). Never set ids/paths/frontmatter from RAG.

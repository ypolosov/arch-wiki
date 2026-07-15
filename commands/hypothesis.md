---
description: Draft an architecture hypothesis from a raw source or topic — scaffold a concept page with traceability frontmatter and a kanban backlog card.
argument-hint: <title> [from raw/<file>]
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch, mcp__local-rag__query_documents
---

Draft a hypothesis. Args: `$ARGUMENTS`

The deterministic `arch-wiki` CLI owns the id-less filename (`hypothesis-<slug>.md`),
the traceability frontmatter, and the kanban card — never write these by hand.

1. Read `docs/architecture/CLAUDE.md` (the schema/contract) for the methodology map.
2. Parse `$ARGUMENTS`: the title, and optionally a `raw/<file>` to derive it from.
3. If a raw source is given, read it and (optionally) consult **books-rag**
   (`mcp__local-rag__query_documents`, graceful if unavailable) for relevant
   DDD/arc42 patterns — to enrich the prose, never to set ids/paths/frontmatter.
4. Scaffold (pre-approved): `arch-wiki hypothesis --title "<title>" [--from raw/<file>]
   [--driver-candidate <UC|QA…>]`. This writes `status: hypothesis`, a `source`
   back-reference, an optional `realizes_driver` placeholder, and auto-adds a
   `kanban.md` backlog card (so the page is not an orphan).
5. From the JSON result report `data.path` and `data.kanbanCard`. The scaffold now includes a
   **Problem Card** (FPF C.22.2 / B.5.2): help fill its fields — **Prompt**, **Scope cut**,
   **Why not just a wish**, **Rival** (a named competing hypothesis), **Acceptance probe** (the
   observation that would confirm OR refute it), **Next use** — then the Hypothesis prose. Author in
   **English** (the graph is the English source of truth, even when the raw source is not). `lint` flags
   `hypothesis-unfalsifiable` / `hypothesis-no-rival` if the Acceptance-probe / Rival fields are missing.

---
description: Answer a question from the synthesized architecture wiki (not by re-reading raw sources); optionally persist the answer as a concept page.
argument-hint: <your question about the architecture>
---

You are running the **Query** operation of the LLM-Wiki.

Question: `$ARGUMENTS`

1. Read `docs/architecture/CLAUDE.md` for conventions, then answer using the
   **synthesized wiki** under `docs/architecture/` — the arc42 hubs, drivers,
   ADRs, iterations, entities, concepts, glossary. Start from
   `docs/architecture/index.md` and follow wikilinks.
2. Do **not** re-read `raw/` to answer — the wiki is the compiled knowledge. (If
   the wiki lacks the answer, say so and suggest `/arch-wiki:ingest`.)
3. Cite the wiki pages you used as wikilinks (e.g. `[[09-architecture-decisions]]`,
   `[[QA-003-platform-availability|QA-003]]`).
4. If the answer is durable and reusable, offer to persist it as
   `docs/architecture/concepts/<topic>.md` (from the `concept` template), wired
   into the graph with wikilinks and a Sources section. Only write it if the user
   confirms.

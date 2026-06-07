---
description: Scaffold a stakeholder questionnaire (QAW, Rozanski/Woods, or driver-gap) into raw/questionnaires and draft its questions.
argument-hint: <qaw|rozanski|driver-gap> <topic>
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch, mcp__local-rag__query_documents
---

Build a questionnaire. Args: `$ARGUMENTS`

The deterministic `arch-wiki` CLI owns the skeleton, the filename, and the
frontmatter (`method`, `topic`, `related_drivers`, `status: open`) — it is the
authorized author of the `raw/` skeleton (do not Edit/Write raw/ yourself).

1. Read `docs/architecture/CLAUDE.md` (the schema/contract).
2. Parse `$ARGUMENTS`: first token is the method (`qaw|rozanski|driver-gap`), the
   rest is the topic.
3. For **driver-gap**: first run `arch-wiki lint --json` and read `gap-analysis.md`
   to target the actual uncovered drivers.
4. Scaffold (pre-approved): `arch-wiki questionnaire <method> --topic "<topic>"
   [--related-drivers UC-001,QA-003]`.
5. Fill the prose questions in the created file (RU):
   - **qaw** — phrase business-driver elicitation and candidate QA scenarios.
   - **rozanski** — stakeholder×concern grid + per-viewpoint questions; consult
     **books-rag** (`mcp__local-rag__query_documents`, graceful) for viewpoint examples.
   - **driver-gap** — one targeted question per uncovered driver from step 3.
6. Report `data.path`. Answers come back into the same file; later run `/arch-wiki:ingest`.

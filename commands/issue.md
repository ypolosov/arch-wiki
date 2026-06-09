---
description: Create a self-contained Jira/GitLab issue from a chosen driver/ADR — inline the relevant text (no wiki ids, no links), human-gated, then create via MCP and record the trace.
argument-hint: <ID> <arch|techdesign> [be|fe|do]
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch
---

Create an issue. Args: `$ARGUMENTS`

**ADD discipline: issues are NEVER auto-created from gaps.** The SA chooses what to turn
into an issue (from `kanban.md` / `lint`); this command renders and creates exactly one.

1. Parse `$ARGUMENTS`: source id, kind (`arch|techdesign`), optional role for techdesign.
2. `arch-wiki render-issue --from <ID> --kind <k> [--role be|fe|do]` → gives `issueTitle`,
   `contentHash`, and idempotency flags. If `alreadyCreated:true, drifted:false` → STOP (no
   dup). If `drifted:true` → ask the SA whether to update the existing `key`; never dup. If
   it exits 2 ("no [tasks] config") → tell the SA to fill `.arch-wiki/config.json` first.
3. `Read` the source artifact AND the decisions/constraints it references (its `## Related`
   ADRs/constraints) — extract the relevant requirement/decision/constraint text.
4. Compose a **self-contained RU issue body**. RULES:
   - **Inline** the relevant text from each referenced artifact — the reader must understand
     it without opening the wiki.
   - **Do NOT mention wiki artifact ids** (QA-…, ADR-…, CON-…) and **do NOT add links** — the
     trace lives in the ledger + `realized_by` frontmatter, not the issue body.
   - **No provenance footer.**
   - Sections (arch): Контекст · Цель · Объём (in/out) · Артефакт-результат · Требования и
     ограничения · DoD · Приоритет. (techdesign: see its payload template's sections.)
5. **Human gate:** show the composed issue to the SA; get explicit approval before any write.
6. `ToolSearch "mcp jira|gitlab"`; if none → "MCP not configured, see CLAUDE.md#MCP-Setup"
   and stop. Otherwise create the issue (project from `integrations.jira.projectKey`).
7. `arch-wiki record-issue --id <ID> --key <KEY> --kind <k> [--role] --hash <contentHash>`
   (writes the ledger + `realized_by`). Report the new issue key/URL.

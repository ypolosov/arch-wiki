---
description: Create a self-contained Jira/GitLab issue from a chosen driver/ADR — inline the relevant text with the Confluence-mirror link embedded at each artifact's first mention, human-gated, then create via MCP and record the trace.
argument-hint: <ID> <arch|techdesign> [be|fe|do]
allowed-tools: Bash(arch-wiki:*), Read, ToolSearch
---

Create an issue. Args: `$ARGUMENTS`

**ADD discipline: issues are NEVER auto-created from gaps.** The SA chooses what to turn
into an issue (from `kanban.md` / `lint`); this command renders and creates exactly one.

1. Parse `$ARGUMENTS`: source id, kind (`arch|techdesign`), optional role for techdesign.
2. `arch-wiki render-issue --from <ID> --kind <k> [--role be|fe|do]` → gives `issueTitle`,
   `contentHash`, `traceLinks`, and idempotency flags. If `alreadyCreated:true, drifted:false`
   → STOP (no dup). If `drifted:true` → ask the SA whether to update the existing `key`; never
   dup. If it exits 2 ("no [tasks] config") → tell the SA to fill `.arch-wiki/config.json` first.
3. `Read` the source artifact AND the decisions/constraints it references (its `## Related`
   ADRs/constraints) — extract the relevant requirement/decision/constraint text.
4. Compose a **self-contained RU issue body**. RULES:
   - **Inline** the relevant text from each referenced artifact — the reader must understand
     the issue body without opening the wiki.
   - **Embed each artifact's Confluence-mirror link INLINE at its first mention** — exactly like the
     wiki mirror does, e.g. `Keycloak ([ADR-011](url)) отвечает за identity`. Take the url from
     `data.traceLinks` (`{id,title,url}`), matching by `id`/`title`. **Do NOT add a `## Источник`
     section, a bullet dump, or a meta-note** ("ссылки встроены выше" etc.) — the body ends on its
     last meaningful section. A bare artifact id only ever appears as a link label, never as plain text.
   - If a referenced artifact has a `traceLinks` entry but isn't naturally named in the prose, weave a
     short inline mention carrying its link rather than listing it separately.
   - If `data.traceLinks` is empty, add no links and tell the SA to run `/arch-wiki:publish` first
     (targets must be mirrored to resolve a link). Absolute links need `integrations.confluence.siteUrl`;
     otherwise they are root-relative (still resolve from Jira on the same Atlassian site). The ledger +
     `realized_by` frontmatter remain the machine trace.
   - **No footer.**
   - Sections (arch): Контекст · Цель · Объём (in/out) · Артефакт-результат · Требования и
     ограничения · DoD · Приоритет. (techdesign: see its payload template's sections.)
5. **Human gate:** show the composed issue to the SA; get explicit approval before any write.
6. `ToolSearch "mcp jira|gitlab"`; if none → "MCP not configured, see CLAUDE.md#MCP-Setup"
   and stop. Otherwise create the issue (project from `integrations.jira.projectKey`).
7. `arch-wiki record-issue --id <ID> --key <KEY> --kind <k> [--role] --hash <contentHash>`
   (writes the ledger + `realized_by`). Report the new issue key/URL.

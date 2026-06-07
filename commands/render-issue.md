---
description: Render a deterministic Jira/GitLab issue payload from a chosen driver/ADR, show it for human approval, then create it via MCP and record the trace.
argument-hint: <ID> <arch|techdesign> [be|fe|do]
allowed-tools: Bash(arch-wiki:*), ToolSearch
---

Render an issue payload. Args: `$ARGUMENTS`

**ADD discipline: issues are NEVER auto-created from gaps.** The SA chooses what to
turn into an issue (from `lint` / `kanban.md`); this command renders and creates
exactly one, with a human gate before any side-effect.

1. Parse `$ARGUMENTS`: source id, kind (`arch|techdesign`), optional role for techdesign.
2. Render (pre-approved): `arch-wiki render-issue --from <ID> --kind <arch|techdesign>
   [--role be|fe|do]`. The CLI returns an `IntentEnvelope` with the RU `payload`,
   `contentHash`, and idempotency flags (`alreadyCreated`, `drifted`, `key`).
   - `alreadyCreated:true, drifted:false` → an identical issue exists; STOP (no dup).
   - `alreadyCreated:true, drifted:true` → issue exists but the payload changed;
     ask the SA whether to update/supersede the existing `key`. Do NOT create a dup.
3. Prefix and language come from `.arch-wiki/config.json` — if `render-issue` exits 2
   ("no [tasks] config"), tell the SA to fill the project profile first.
4. **Human gate:** show the rendered RU `payload` to the SA and get explicit approval.
5. On approval: `ToolSearch "mcp jira|gitlab"`; if none → tell the SA "MCP not
   configured, see CLAUDE.md#MCP-Setup" and stop. Otherwise map the payload to the
   tool's params and create the issue.
6. Record the trace: `arch-wiki record-issue --id <ID> --key <KEY> --kind <kind>
   [--role <role>] --hash <contentHash>` (writes the ledger + `realized_by`).

---
description: Check that the LikeC4 model and the wiki entities agree — get the model from the LikeC4 MCP (read-only), pipe it to the deterministic Core check, and report drift.
argument-hint: "[--establish-baseline] [--severity high|medium|low]"
allowed-tools: Bash(arch-wiki:*), ToolSearch
---

Validate C4 ⟷ wiki consistency. Args: `$ARGUMENTS`

The verdict is **deterministic and Core-owned** — you only fetch the model and narrate
the findings. LikeC4 stays hand-authored; this never edits `*.c4`.

1. `ToolSearch "mcp likec4"`. If present, call **`read-project-summary`** to get the
   model (elements + kinds + views). For the **relationship/view** checks (step 3) you need
   the full graph — prefer **`likec4 export json`** (elements + `relations` + `views`), since
   `read-project-summary` may omit relationships. If the MCP is absent → tell the SA "LikeC4 MCP
   not configured, see CLAUDE.md#MCP-Setup", and fall back to `arch-wiki validate-c4 --source regex`
   (lossy: top-level `*.c4` declarations only, no relationships/views).
2. Pipe the model JSON to Core: `arch-wiki validate-c4 --stdin [--severity <level>]`.
   Core compares each C4 element against the wiki entities deterministically, using
   the project policy (`c4.consistency.requireDocumentation`, default system+container)
   and suppressing `.arch-wiki/c4-baseline.json`. The report echoes `relationshipCount` /
   `viewCount` (null when the source omitted them). Exit 2 ⇒ drift found.
3. Narrate the findings: `c4-element-without-wiki-entity` (model has it, wiki doesn't)
   and `wiki-entity-without-c4-element` (vice-versa). For real drift, suggest either a
   wiki entity, an explicit `c4: <ElementId>` frontmatter mapping, or a proposed `*.c4`
   edit (cartographer) — never silently reconcile. When the model carries relationships/views,
   also narrate `c4-relationship-dangling` (an edge endpoint naming no element — a broken model)
   and `c4-element-in-no-view` (a documented-kind element drawn in no view). Both are **skip-safely**:
   a summary-only model (no relations/views) never triggers them.
4. **Adoption:** on a legacy model/wiki, first run `arch-wiki validate-c4 --establish-baseline`
   (with the model on stdin) to record current mismatches as known; afterwards only new
   drift is reported.

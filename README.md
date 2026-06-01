# arch-wiki

A Claude Code plugin that turns `docs/architecture/` into an **LLM-driven
Solution Architecture wiki** (Andrej Karpathy's LLM-Wiki model) over a Foam
knowledge graph that combines **arc42 + ADD 3.0 + ADR (MADR) + C4/LikeC4**.

The plugin is **agnostic to the target system** — it ships the methodology
scaffold, not any one project's architecture. The behavioral contract (ID
schemes, arc42 map, wikilink rules, operation semantics) lives in a
`docs/architecture/CLAUDE.md` file **inside the consuming repository**; every
command and agent in this plugin reads and obeys that schema at runtime.

## Setup in your project

This plugin operates on a `docs/architecture/` wiki in the repo where you run
it. To bootstrap it:

1. Copy the schema template [`schema/CLAUDE.md`](schema/CLAUDE.md) to
   `docs/architecture/CLAUDE.md` in your repo.
2. Adapt the project-specific bits (the **C4 / LikeC4 rules** section) to your
   system's model — element kinds, views, top-level system and subsystems.
3. Run `/arch-wiki:ingest` / `/arch-wiki:query` / `/arch-wiki:lint` from your
   repo root.

Everything above the C4 section in the schema is methodology and is meant to
stay as-is.

## Commands

| Command | Purpose |
|---|---|
| `/arch-wiki:ingest <raw/file>` | Read an immutable source, extract drivers/decisions, create/update wiki pages, wire wikilinks, flag contradictions. |
| `/arch-wiki:query <question>` | Answer from the synthesized wiki (not raw); optionally persist the answer as a `concepts/` page. |
| `/arch-wiki:lint` | Audit graph integrity (orphans, broken links, uncovered drivers, superseded ADRs, terminology drift). |
| `/arch-wiki:adr <title>` | Scaffold the next-numbered MADR ADR with drivers wired as wikilinks. |
| `/arch-wiki:driver <uc\|qa\|con\|conc> <title>` | Scaffold a new ADD driver from the right template. |
| `/arch-wiki:iteration <title>` | Scaffold a new ADD iteration log. |

## Agents

- `architecture-ingestor` — heavy raw→wiki extraction passes.
- `architecture-linter` — read-only integrity audit.
- `architecture-cartographer` — keeps C4 ↔ drivers ↔ ADR cross-links consistent.

## Skills (model-invoked)

`arc42-map`, `add-method`, `madr-format`, `likec4-dsl` — the methodology
knowledge Claude pulls in automatically when working on the wiki.

## Local development

```bash
claude --plugin-dir ./.claude/plugins/arch-wiki   # load without installing
/reload-plugins                                    # pick up edits
claude plugin validate ./.claude/plugins/arch-wiki # validate structure
```

## License

[MIT](LICENSE)

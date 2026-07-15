# arch-wiki

A Claude Code plugin that turns `docs/architecture/` into an **LLM-driven
Solution Architecture wiki** (Andrej Karpathy's LLM-Wiki model) over a Foam
knowledge graph that combines **arc42 + ADD 3.0 + ADR (MADR) + C4/LikeC4**.

The plugin is **agnostic to the target system** — it ships the methodology
scaffold, not any one project's architecture. The behavioral contract (ID
schemes, arc42 map, wikilink rules, operation semantics) lives in a
`docs/architecture/CLAUDE.md` file **inside the consuming repository**; every
command and agent in this plugin reads and obeys that schema at runtime.

## Installation

Two ways to install, depending on whether you're *using* the plugin or
*developing* it.

### A · Pinned release from the marketplace — for use in any project

Install from the [`ypolosov-marketplace`](https://github.com/ypolosov/ypolosov-marketplace)
catalog. Add the marketplace once, then install:

```text
/plugin marketplace add ypolosov/ypolosov-marketplace
/plugin install arch-wiki@ypolosov-marketplace
```

or from the CLI:

```bash
claude plugin marketplace add ypolosov/ypolosov-marketplace
claude plugin install arch-wiki@ypolosov-marketplace
```

**About the version.** Claude Code has **no install-time `@version` flag** — you
cannot write `arch-wiki@ypolosov-marketplace@0.1.0`. The installed version is the
one *pinned by the marketplace entry*: its `version` field (currently `0.1.0`)
plus the git `ref` of the source repo. You always get exactly that pinned
release; a new version reaches you only when the marketplace bumps it, and you
pull it explicitly:

```bash
claude plugin update arch-wiki@ypolosov-marketplace
```

This is the path for normal day-to-day use across your projects: a stable,
reproducible version, installed once at the `user` scope (or `--scope project`
to scope it to one repo).

### B · From a local folder — for development with a fast feedback loop

While editing the plugin, load it straight from its source folder — no install,
no marketplace — so every change is one reload away:

```bash
claude --plugin-dir /path/to/arch-wiki   # load for this session (not installed)
```

Then, after editing any command/agent/skill, pick up the changes without
restarting:

```text
/reload-plugins
```

Validate the plugin structure before committing or releasing:

```bash
claude plugin validate /path/to/arch-wiki --strict
```

This is the path for development and quick iteration: edit → `/reload-plugins`
→ try a command, repeated.

## Setup in your project

Regardless of how you installed it, this plugin operates on a
`docs/architecture/` wiki in the repo where you run it. To bootstrap it:

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
| `/arch-wiki:assurance` | Report graded AssuranceLevel (L0/L1/L2) per driver and regenerate the `epistemic-debt.md` decay register (FPF B.3.3/B.3.4). |
| `/arch-wiki:review` | Score per-kind structural adequacy (adequate/thin/inadequate) of ADRs, drivers, iterations and add the FPF judgement rubric (FPF C.32.ADA/C.30.AD). |
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

## License

[MIT](LICENSE)

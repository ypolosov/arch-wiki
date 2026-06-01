---
description: LikeC4 DSL conventions for the C4 model in docs/architecture/c4. Use when reading or editing *.c4 sources, adding elements/views, or validating/building the C4 site.
---

# LikeC4 (C4-as-code)

LikeC4 is the visual *notation*: textual `*.c4` → interactive C4 diagrams & a
static site. Source of truth: `docs/architecture/c4/src/`. Config:
`c4/.likec4.config.json` (set the project name/title for your target system).

## Files
- `specification.c4` — declares the project's element kinds (e.g. `actor`,
  `system`, plus any domain-specific kinds such as `function`, `integrationApi`)
  and deployment node kinds (e.g. `vpc`, `subnet`, `az`, `k8sNode`, …) + tags.
  Element/deployment kinds are project-defined — read this file to learn them.
- `model.c4` / `global.c4` — the elements and relationships.
- `deployment.c4` — deployment nodes/instances.
- `views.c4` — views, typically: `index`, `context` (C4 L1), `containers`
  (C4 L2), one view per subsystem (L2 subsets), and a deployment view.

## Model shape
Read `specification.c4`, `model.c4`, and `views.c4` to discover the target
system's top-level system, its subsystems, and its actors — these are
project-specific and defined by the consuming repository, not by this plugin.

## Commands (run from `docs/architecture/c4`)
- `npm run validate` — validate the model (run after every edit).
- `npm run start` — local dev server with live preview.
- `npm run build` — generate the static site (`likec4 build --no-use-dot`).
- `npm run export` — export PNGs to `./out` (for embedding in the wiki/site).
- `npm run gen` — code generation (`likec4 gen`).

## Conventions
- Edit only `src/*.c4`; never hand-edit the `.likec4/*.snap` snapshots.
- Map views to arc42: `context`→§3, `containers`/subsystem views→§5, dynamic→§6,
  the deployment view→§7.
- When an ADR introduces/changes a component, reflect it in the model and link
  the C4 element from the ADR's "More Information".

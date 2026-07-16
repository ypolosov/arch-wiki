---
description: LikeC4 DSL conventions for the C4 model in docs/architecture/c4. Use when reading or editing *.c4 sources, adding elements/views, or validating/building the C4 site.
---

# LikeC4 (C4-as-code)

> **What this skill is.** A description of how to author the C4 *notation*. `c4/src/*.c4` is
> **hand-authored** and it holds the **structure**: element ids, kinds, nesting, relationships.
> The wiki does **not** restate that — arc42 §5 says what a block is *for* (responsibility,
> interfaces), ADRs say *why*. `validate-c4` reports drift between model and wiki, and only for
> the kinds a project opts into (`c4.consistency.requireDocumentation`, default: none).

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

## The model is ONE; views are MANY (the core distinction)
LikeC4 separates them and so must you:
- **`model { … }`** — ONE structure: what blocks exist, how they nest, what talks to what. There is
  exactly one model. Never fork it into `as-is.c4` / `to-be.c4` — that duplicates elements and kills
  traceability.
- **`views { … }`** — MANY projections over that one model: each view is a scoped/filtered *look*
  (context L1, containers L2, a per-subsystem subset, a dynamic flow, deployment). Views are where
  "different viewpoints" live.

## Lifecycle (AS-IS vs TO-BE): use tags, not prose
A model that mixes built and planned blocks with the difference buried in free-text metadata cannot
be filtered or viewed. Mark lifecycle with **tags** (a LikeC4 primitive) and let views select:

```c4
specification {
  tag as-built
  tag planned { color #FF8C00 }
  tag deferred { color #808080 }
}
```
Attach per element (or per kind, which tags every instance):
```c4
model {
  payments = container 'Payments' {
    #as-built
  }
  connector = container 'Stripe Connector' {
    #planned            // designed, not in production
  }
}
```
Then project each aspect with a view predicate:
```c4
views {
  view asIsContext {
    title 'Context — as built'
    include *
    exclude element.tag = #planned
    exclude element.tag = #deferred
  }
  view toBeContext {
    title 'Context — target'
    include *                       // built + planned together
  }
  view payments {
    include cloud.* where kind is container and tag is not #deferred
  }
}
```
Predicates support `=`/`is` and `!=`/`is not`, plus a `where` clause combining `kind` and `tag`.
One model (one truth about structure), many projections (as-is, to-be, per-aspect). This is a
**project convention in your `*.c4`** — nothing in Core reads these tags.

> The realized-vs-intended axis for the **wiki** lives elsewhere and IS Core-checked: an ADR's
> `proposed` → `accepted`, and a driver's AssuranceLevel **L1** (covered by an accepted decision)
> → **L2** (realized, traced to a live issue) — see `arch-wiki assurance`. Tags are for the model.

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

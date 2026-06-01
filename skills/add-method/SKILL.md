---
description: Attribute-Driven Design (ADD 3.0) method — architectural drivers, quality attribute scenarios, and the iterative design loop. Use when scaffolding drivers (UC/QA/CON/CONC), running a design iteration, or reasoning about how requirements drive decisions.
---

# ADD 3.0 (Attribute-Driven Design)

ADD (Cervantes & Kazman, *Designing Software Architectures*) is the design
*process/engine*. It turns architectural drivers into design decisions,
iteratively.

## Inputs = architectural drivers
1. **Design purpose** — why we are designing now.
2. **Primary functional requirements** — the key use cases (`UC-NNN`).
3. **Quality attribute scenarios** — measurable (`QA-NNN`).
4. **Constraints** — non-negotiable (`CON-NNN`).
5. **Architectural concerns** — crosscutting (`CONC-NNN`).

## Quality attribute scenario shape
A good QA scenario has six parts: **Source, Stimulus, Artifact, Environment,
Response, Measure** — the Measure must be testable (e.g. "p95 < 200ms"). See the
`quality-attribute` template.

## The ADD iteration loop (logged in `iterations/ITER-NN.md`)
1. Review inputs (drivers) and confirm priorities (utility tree).
2. Establish the iteration goal (which drivers to address).
3. Choose one element of the system to refine.
4. Choose design concepts (patterns, tactics, frameworks) that satisfy the drivers.
5. Instantiate elements and allocate responsibilities; define interfaces.
6. Sketch views (→ C4) and record decisions (→ ADR).
7. Analyze the current design vs the iteration goal; track driver coverage.

## Relationship to the other methods
- ADD **produces** decisions → recorded as **ADRs** (the why).
- ADD **produces** structures → drawn as **C4/LikeC4** views (the picture).
- ADD outputs **live in arc42** sections (the container).
- Iterations capture *which drivers moved from partial → complete* (see ITER-01's
  Drivers Impact table) — this feeds gap analysis and `/arch-wiki:lint`.

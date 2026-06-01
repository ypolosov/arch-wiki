---
description: Scaffold a new ADD design iteration log (ITER-NN) with goal, decisions, and a driver-impact table.
argument-hint: <iteration title>
---

Create a new ADD iteration. Title: `$ARGUMENTS`

1. Follow the `add-method` skill (the 7-step ADD loop) and `docs/architecture/CLAUDE.md`.
2. Compute the next number: list `docs/architecture/iterations/`, take the highest
   `ITER-NN`, add 1, zero-pad to 2 digits.
3. Create `docs/architecture/iterations/ITER-NN.md` from
   `docs/architecture/.foam/templates/iteration.md`, mirroring the structure of
   `ITER-01.md`: Date, Drivers Addressed (wikilinked), Decisions Made (wikilinked
   ADRs), Supersedes, Summary, and a **Drivers Impact** table (Previous → New state).
4. If this iteration supersedes a decision, follow the superseding rules in the
   `madr-format` skill (link old↔new ADR, set old ADR's status).
5. Add a wikilink from `arc42/04-solution-strategy.md`.
6. Report the path.

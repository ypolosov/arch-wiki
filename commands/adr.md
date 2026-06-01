---
description: Scaffold the next-numbered MADR Architecture Decision Record with drivers wired as wikilinks.
argument-hint: <short decision title> [--drivers QA-003,CON-006,...]
---

Create a new ADR. Title/args: `$ARGUMENTS`

1. Follow the `madr-format` skill and the schema in `docs/architecture/CLAUDE.md`.
2. Compute the next number: list `docs/architecture/adrs/`, take the highest
   `NNNN`, add 1, zero-pad to 4 digits.
3. Create `docs/architecture/adrs/NNNN-<kebab-title>.md` from
   `docs/architecture/.foam/templates/adr.md`, with:
   - heading `# ADR-NNNN: <Title>`, `Status: proposed`, today's date,
   - any `--drivers` resolved to wikilinks (e.g. `[[CON-006-sla-targets|CON-006]]`),
     validating that each referenced driver file exists,
   - placeholder sections for Context, Options, Outcome, Consequences.
4. Add a wikilink to the new ADR from `arc42/09-architecture-decisions.md`.
5. Report the path and remind the curator to fill Context/Options/Outcome and run
   `/arch-wiki:lint` before promoting `Status` to `accepted`.

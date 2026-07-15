# arch-wiki — DPF Package-Adequacy & Principle-Adequacy self-evaluation

> **Developer-facing.** Companion to [`FRAMEWORK.md`](FRAMEWORK.md) (the PFAD decision). This is the
> *adequacy instrument* for the arch-wiki Domain Principle Framework — FPF `E.4.DPF.DA` (DPF package
> adequacy) + `E.2.DA` (pillar/principle adequacy) + `E.22` (declare the evaluation purpose, scale
> ceremony to reliance). Not shipped to consuming repos. Re-score it at each release wave.

## Evaluation purpose (E.22)

Purpose = **floor** — verify the plugin clears its own structural floor each release; not an
exceptional-quality audit. Reliance: internal (developer). Ceremony: a scan, not a program.

## DPF package adequacy (E.4.DPF.DA)

| Dimension | Question | Status |
|---|---|---|
| Framework decision recorded | Is the DPF membership a written PFAD, not folklore? | ✅ `FRAMEWORK.md` (PFAD-AW-001) |
| Access carrier separated | Is the user contract (`schema/CLAUDE.md`) distinct from developer records? | ✅ schema ships; FRAMEWORK*/RELEASE* stay local |
| Pattern set grounded | Does every capability cite an FPF pattern id? | ✅ ontology table + per-feature `FPF …` refs |
| Unidirectional dependency | arch-wiki → FPF only (GR-3, E.5.3)? | ✅ no Core reverse import |
| Notational independence | Entities = canon, C4 = one notation (GR-2, E.5.2)? | ✅ schema callout + `validate-c4` |
| Deterministic verdicts | Are verdicts Core-owned, not eyeballed? | ✅ CLI owns lint/assurance/adequacy/c4 |
| Evidence & assurance | Is coverage graded + decay surfaced (A.10/B.3)? | ✅ AssuranceLevel L0/L1/L2 + epistemic-debt |
| Self-evaluation present | Can the framework score itself (E.4.DPF.DA)? | ✅ this file + `arch-wiki adequacy` |
| Edition/refresh discipline | Are refresh conditions written (E.4.PFR/G.11)? | ✅ `FRAMEWORK.md` → Edition discipline (supersession/refresh/deprecation) |

## Principle adequacy (E.2.DA) — the seven engineering principles

Each principle is either upheld by a **mechanism** (deterministic, checkable) or by **doctrine**
(prose the LLM/human must honor). A principle with only doctrine and no mechanism is a candidate for
a future Core rule.

| # | Principle | Upheld by |
|---|---|---|
| 1 | Deterministic-Core-first | mechanism — every verdict is a CLI command; the LLM narrates |
| 2 | English canon, mirror is projection | mechanism — content-hash over English; mirror stripped/translated at publish |
| 3 | Human-gated side-effects | mechanism — issue/publish/waive/delete need explicit approval |
| 4 | Idempotent | mechanism — content-hash keys; upsert-on-drift ledgers |
| 5 | Fail-fast, no silent defaults | mechanism — required-when-used config/flags throw exit 2/1 |
| 6 | Additive / non-destructive | doctrine + mechanism — never rewrite accepted ADR; managed-region registers; migrations touch `.arch-wiki/*` only |
| 7 | MCP for external side-effects, graceful degradation | doctrine — commands `ToolSearch` then stop with a setup hint |

## How to re-score

Run at each wave: `npm test` green · `arch-wiki adequacy --purpose gaps` on gt shows only real
shortfalls · confirm no mirror drift (old-vs-new render diff) · update the ⚠️ rows as they close.
The living improvement ledger is [`docs/dev/release-loop.md`](docs/dev/release-loop.md).

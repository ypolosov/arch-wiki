# arch-wiki release loop — E.23 improvement-loop ledger

> **Developer-facing.** Formalizes the `RELEASE-*.md` / gt-retest cadence as an FPF `E.23`
> Quality-Improvement Loop (Observe → Frame → Change → Verify → Route), with `E.22` purpose
> declaration. Not shipped to consuming repos.

## The loop (per wave)

1. **Observe** — a shortfall or opportunity (from `result.md`, `arch-wiki adequacy --purpose gaps`,
   epistemic-debt, or a gt-retest finding).
2. **Frame** — pick the FPF pattern(s) that ground the change; state the purpose (E.22) and the
   regression risk (esp. the Confluence mirror).
3. **Change** — implement in the deterministic Core first; keep it additive; ship new lint rules
   low-severity, one at a time, baseline-suppressible (no mass churn).
4. **Verify** — `npm test` green; run the affected verbs with the local `dist/cli.cjs` against gt;
   for mirror-touching changes prove neutrality with the **old-vs-new render diff** (0 body/hash
   diff on shared pages). Clean up any test-generated files from the gt tree.
5. **Route** — bump the version (3 synced files), write `RELEASE-<v>-gt-test.md`, commit; the user
   stages the outward release (push/tag/marketplace) and runs the formal gt-retest.

## Ledger (waves)

| Wave | Version | Theme | FPF | Mirror impact |
|---|---|---|---|---|
| 1 | 0.9.0 | FPF DPF framing + status-aware coverage | A.3/A.15, E.4.PFAD, B.3.3 | none (docs + additive lint) |
| 2 | 0.9.0 | Evidence & Assurance (L0/L1/L2 + epistemic-debt) | A.10, B.3.3/B.3.4 | none (register excluded) |
| 3 | 0.10.0 | Adequacy review (`/arch-wiki:review`) | C.32.ADA, C.30.AD, E.21 | none |
| 4 | 0.11.0 | Evidence completion (decay math, waivers, provenance) | A.10, B.3.4 | none (Sources stripped) |
| 5 | 0.12.0 | Lexicon & glossary (Unified Term Sheet) | F.7/F.8/F.13/F.17 | none (preserveTerms deferred) |
| 6 | 0.13.0 | Process loops (ProblemCard, abductive gate, Evolution Loop) | B.4/B.5.2/C.22.2 | none |
| 7 | 0.14.0 | Ontology & self-eval tail (adequacy `--purpose`, instruments) | E.2.DA/E.4.DPF.DA/E.22/E.23 | none |

> Later waves (C4/views, QA templates, projection gate, ADR) carry higher mirror risk — each gets an
> explicit render-diff proof and a gt-retest callout in its RELEASE note.

## Operational gates (FPF A.21) & projection surfaces

The deterministic verdicts ARE operational gates — pass/fail decisions with logged results:
`lint` (graph integrity + the wave rules), `validate-c4` (C4 ⟷ wiki), `verify-mirror` (outbound
faithfulness), `adequacy` (structural floor). Each is register-backed (a JSON envelope, a
baseline, a managed register) — a "clean" verdict is a *publication* of that source, not a new claim.

Projection surfaces and their faithfulness discipline:
- **Outbound** — the Confluence mirror (MVPK PlainView): guarded by `verify-mirror` (tiers i/ii).
- **Inbound** — `pull-stories` snapshots the PO User Story Log (a probe-coupled boundary read,
  C.26.1): the CLI is the sole authorized writer of `raw/_synced/`, idempotent by contentHash,
  orphan-reconciled — the inbound analogue of the outbound gate. (A deterministic inbound
  faithfulness check is a candidate for a future wave.)
- **DESCRIPTION-USE** — `query` answers from the graph and may persist a `concepts/` page (an
  EpistemicViewing morphism, A.6.2): persisted answers must carry a `## Sources` provenance trail.

## Deferred / dropped (with rationale)

- **`driver-depends-on-decision` lint (C.2.P/C.32.PAD)** — *dropped*. FPF would separate problem-side
  from solution-side, but arch-wiki's convention is *bidirectional-in-spirit* linking: a driver
  forward-links its realizing ADRs as a navigation aid while Foam derives the backlinks. Enforcing the
  rule would flood every gt QA and contradict the QA template. The direction that matters (ADR → its
  drivers) is already upheld; no valid target remains.
- **preserveTerms-as-Term-column** (W5) — *deferred*. Mirror-touching via RU translation; a render
  diff can't prove RU-safety, so it needs a user-gated publish/RU re-test.
- **E.4.PFR edition discipline** — *deferred to W12*.

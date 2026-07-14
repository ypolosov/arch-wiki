import { GraphSnapshot } from '../model/Graph';
import { computeAssurance } from './Assurance';
import { gatherSupersededCitations } from './LintRuleSet';

/**
 * Epistemic debt (FPF B.3.4 — evidence is perishable; decay accrues and must be
 * surfaced, not hidden). This CONSOLIDATES decay signals Core already computes into
 * one deterministic register, so re-validation can be planned instead of discovered
 * by accident. It mints no new judgement — every row is a fact over the graph/ledger:
 *   superseded-citation — a live design artifact leans on a superseded/deprecated ADR;
 *   paper-coverage      — a driver is covered only by non-accepted decisions (L0);
 *   stale-issue         — `realized_by` names an issue with no ledger row (broken trace);
 *   missing-source      — `source:` points at a file that no longer exists on disk.
 */
export type DebtKind = 'missing-source' | 'paper-coverage' | 'stale-issue' | 'superseded-citation';

export interface DebtRow {
  kind: DebtKind;
  /** Basename the debt is attached to. */
  subject: string;
  detail: string;
}

export interface EpistemicDebtContext {
  /** Issue keys present in the ledger (a `realized_by` key absent here is stale). */
  ledgerIssueKeys: ReadonlySet<string>;
  /** All wiki-relative file paths (a `source:` absent here no longer exists). */
  fileSet: ReadonlySet<string>;
}

/** Gather every decay signal into a sorted, deterministic debt list. No I/O. */
export function gatherEpistemicDebt(g: GraphSnapshot, ctx: EpistemicDebtContext): DebtRow[] {
  const rows: DebtRow[] = [];

  // 1. Live design artifacts citing a superseded/deprecated ADR (Core already narrows
  //    this to live dependencies — excludes ADR→ADR, iterations, register/index pages).
  for (const c of gatherSupersededCitations(g)) {
    rows.push({
      kind: 'superseded-citation',
      subject: c.citingFile.replace(/^.*\//, '').replace(/\.md$/, ''),
      detail: `cites ${c.targetStatus} ADR [[${c.targetAdr}]]`,
    });
  }

  // 2. Paper coverage: drivers at L0 whose only inbound decisions are non-accepted.
  for (const a of computeAssurance(g, { ledgerIssueKeys: ctx.ledgerIssueKeys })) {
    if (a.level === 'L0' && a.nonLiveCoverers.length > 0) {
      rows.push({
        kind: 'paper-coverage',
        subject: a.driver,
        detail: `covered only by non-accepted ADR(s): ${a.nonLiveCoverers.join(', ')}`,
      });
    }
  }

  // 3. Stale issues: a `realized_by` key with no ledger row (the two-way trace broke).
  for (const p of g.pages) {
    const rb = (p.frontmatter as { realized_by?: unknown }).realized_by;
    if (!Array.isArray(rb)) continue;
    for (const k of [...new Set(rb.map(String))].sort()) {
      if (!ctx.ledgerIssueKeys.has(k)) {
        rows.push({
          kind: 'stale-issue',
          subject: p.basename,
          detail: `realized_by ${k} has no ledger row (stale trace)`,
        });
      }
    }
  }

  // 4. Missing source: `source:` frontmatter → a file that is gone (same check as trace).
  for (const p of g.pages) {
    const src = (p.frontmatter as { source?: unknown }).source;
    if (typeof src === 'string' && src && !ctx.fileSet.has(src)) {
      rows.push({
        kind: 'missing-source',
        subject: p.basename,
        detail: `source \`${src}\` no longer exists on disk`,
      });
    }
  }

  // De-dup: a page may link the same superseded ADR from several sections (Decision
  // Drivers + prose + More Information), yielding identical rows — collapse to one.
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    const key = `${r.kind}|${r.subject}|${r.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) ||
      a.subject.localeCompare(b.subject) ||
      a.detail.localeCompare(b.detail),
  );
}

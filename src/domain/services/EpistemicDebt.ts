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
 *   missing-source      — a `source`/`verified_by`/`validated_by` carrier no longer exists;
 *   overdue-evidence    — a `valid_until` carrier has expired past the debt budget.
 * A human-gated waiver (CC-ED.5) suppresses a subject's rows.
 */
export type DebtKind =
  | 'missing-source'
  | 'overdue-evidence'
  | 'paper-coverage'
  | 'stale-issue'
  | 'superseded-citation';

export interface DebtRow {
  kind: DebtKind;
  /** Basename the debt is attached to. */
  subject: string;
  detail: string;
}

export interface EpistemicDebtContext {
  /** Issue keys present in the ledger (a `realized_by` key absent here is stale). */
  ledgerIssueKeys: ReadonlySet<string>;
  /** All wiki-relative file paths (a path carrier absent here no longer exists). */
  fileSet: ReadonlySet<string>;
  /** Reference "now" for `valid_until` decay; omit/null → skip time-based debt. */
  now?: Date | null;
  /** Grace days before an expired `valid_until` counts as debt (default 0). */
  budgetDays?: number;
  /** Subjects with an active waiver (CC-ED.5) — excluded from the register. */
  waivedSubjects?: ReadonlySet<string>;
}

const DAY_MS = 86_400_000;

/** Path-shaped evidence carriers on a page (source + typed provenance). */
function carriers(fm: Record<string, unknown>): string[] {
  const out: string[] = [];
  const src = fm.source;
  if (typeof src === 'string' && src) out.push(src);
  for (const key of ['verified_by', 'validated_by'] as const) {
    const v = fm[key];
    if (Array.isArray(v)) for (const c of v) if (typeof c === 'string' && c) out.push(c);
    else if (typeof v === 'string' && v) out.push(v);
  }
  return [...new Set(out)];
}

/** Gather every decay signal into a sorted, de-duplicated, deterministic debt list. No I/O. */
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

  for (const p of g.pages) {
    const fm = p.frontmatter as Record<string, unknown>;

    // 3. Stale issues: a `realized_by` key with no ledger row (the two-way trace broke).
    const rb = fm.realized_by;
    if (Array.isArray(rb)) {
      for (const k of [...new Set(rb.map(String))].sort()) {
        if (!ctx.ledgerIssueKeys.has(k)) {
          rows.push({ kind: 'stale-issue', subject: p.basename, detail: `realized_by ${k} has no ledger row (stale trace)` });
        }
      }
    }

    // 4. Missing carrier: a path-shaped `source`/`verified_by`/`validated_by` that is gone.
    for (const c of carriers(fm)) {
      if (c.includes('/') && !ctx.fileSet.has(c)) {
        rows.push({ kind: 'missing-source', subject: p.basename, detail: `evidence carrier \`${c}\` no longer exists on disk` });
      }
    }

    // 5. Overdue evidence: `valid_until` expired past the budget (FPF B.3.4).
    if (ctx.now) {
      const vu = fm.valid_until;
      if (vu != null && vu !== '') {
        const t = Date.parse(String(vu));
        if (Number.isNaN(t)) {
          rows.push({ kind: 'overdue-evidence', subject: p.basename, detail: `unparseable valid_until: ${String(vu)}` });
        } else {
          const overdueDays = Math.floor((ctx.now.getTime() - t) / DAY_MS) - (ctx.budgetDays ?? 0);
          if (overdueDays > 0) {
            const budget = ctx.budgetDays ? `, budget ${ctx.budgetDays}d` : '';
            rows.push({ kind: 'overdue-evidence', subject: p.basename, detail: `evidence overdue ${overdueDays}d (valid_until ${String(vu)}${budget})` });
          }
        }
      }
    }
  }

  // De-dup identical rows, drop waived subjects (CC-ED.5), then sort deterministically.
  const seen = new Set<string>();
  const waived = ctx.waivedSubjects ?? new Set<string>();
  return rows
    .filter((r) => {
      if (waived.has(r.subject)) return false;
      const key = `${r.kind}|${r.subject}|${r.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) ||
        a.subject.localeCompare(b.subject) ||
        a.detail.localeCompare(b.detail),
    );
}

import { ArtifactKind } from '../model/ArtifactType';
import { GraphSnapshot, pagesOfKind } from '../model/Graph';
import { kindOfPage } from '../model/WikiPage';

/**
 * Graded assurance for architectural drivers (FPF B.3.3: an assurance level is
 * *computed from evidence*, not asserted; A.2.4: a proposed/superseded decision
 * carries no authority, so it does not *live-cover* a driver; A.10: the covering
 * decision and the realizing issue are the driver's verification / validation edges).
 *
 * The ladder is a DOMAIN PROJECTION of B.3.3 (arch-wiki has no formal proofs, so no
 * FPF-"Axiomatic" L3): a driver is
 *   L0 Unsubstantiated — no live (accepted ADR / iteration) decision covers it;
 *   L1 Substantiated   — live-covered, but not yet realized;
 *   L2 Realized        — live-covered AND traced to a non-stale ledger issue.
 * Design-time coverage (verifiedBy) and run-time realization (validatedBy) are kept
 * distinct and never collapsed into one score.
 */
export type AssuranceLevel = 'L0' | 'L1' | 'L2';

export const DRIVER_KINDS: ArtifactKind[] = [
  'use-case',
  'quality-attribute',
  'constraint',
  'concern',
];

export interface DriverAssurance {
  /** Driver basename (no `.md`). */
  driver: string;
  file: string;
  kind: ArtifactKind;
  level: AssuranceLevel;
  /** Accepted-ADR / iteration basenames that live-cover the driver. */
  liveCoverers: string[];
  /** `basename [status]` for non-accepted ADRs that link the driver (do not live-cover). */
  nonLiveCoverers: string[];
  /** Non-stale `realized_by` issue keys (present in the ledger). */
  realizedBy: string[];
  /** One-line, deterministic explanation of the level. */
  reason: string;
}

export interface AssuranceContext {
  /** Issue keys present in the ledger — used to reject stale `realized_by` entries. */
  ledgerIssueKeys?: ReadonlySet<string>;
}

/**
 * Compute the AssuranceLevel of every driver from the graph (+ optional ledger).
 * Deterministic and sorted. An iteration always live-covers (it records enacted
 * work); an ADR live-covers only when `status: accepted`.
 */
export function computeAssurance(g: GraphSnapshot, ctx: AssuranceContext = {}): DriverAssurance[] {
  const ledgerKeys = ctx.ledgerIssueKeys ?? new Set<string>();

  const liveCov = new Map<string, string[]>();
  const nonLiveCov = new Map<string, string[]>();
  for (const c of pagesOfKind(g, ['adr', 'iteration'])) {
    const isIter = kindOfPage(c) === 'iteration';
    const status = isIter
      ? 'accepted'
      : String((c.frontmatter as { status?: unknown }).status ?? '').toLowerCase();
    const live = isIter || status === 'accepted';
    for (const l of c.links) {
      if (live) {
        const arr = liveCov.get(l.target);
        if (arr) arr.push(c.basename);
        else liveCov.set(l.target, [c.basename]);
      } else {
        const label = `${c.basename} [${status || 'no status'}]`;
        const arr = nonLiveCov.get(l.target);
        if (arr) arr.push(label);
        else nonLiveCov.set(l.target, [label]);
      }
    }
  }

  const out: DriverAssurance[] = [];
  for (const d of pagesOfKind(g, DRIVER_KINDS)) {
    const kind = kindOfPage(d)!;
    const liveCoverers = [...new Set(liveCov.get(d.basename) ?? [])].sort();
    const nonLiveCoverers = [...new Set(nonLiveCov.get(d.basename) ?? [])].sort();
    const rb = (d.frontmatter as { realized_by?: unknown }).realized_by;
    const realizedBy = Array.isArray(rb)
      ? [...new Set(rb.map(String))].filter((k) => ledgerKeys.has(k)).sort()
      : [];

    let level: AssuranceLevel;
    let reason: string;
    if (liveCoverers.length === 0) {
      level = 'L0';
      reason =
        nonLiveCoverers.length > 0
          ? `no live decision — only non-accepted: ${nonLiveCoverers.join(', ')}`
          : 'no accepted ADR or iteration covers it';
    } else if (realizedBy.length > 0) {
      level = 'L2';
      reason = `live-covered by ${liveCoverers.join(', ')}; realized by ${realizedBy.join(', ')}`;
    } else {
      level = 'L1';
      reason = `live-covered by ${liveCoverers.join(', ')}; not yet realized`;
    }
    out.push({
      driver: d.basename,
      file: d.relPath,
      kind,
      level,
      liveCoverers,
      nonLiveCoverers,
      realizedBy,
      reason,
    });
  }
  return out.sort((a, b) => a.driver.localeCompare(b.driver));
}

export interface AssuranceSummary {
  L0: number;
  L1: number;
  L2: number;
  total: number;
}

export function summarizeAssurance(rows: readonly DriverAssurance[]): AssuranceSummary {
  const s: AssuranceSummary = { L0: 0, L1: 0, L2: 0, total: rows.length };
  for (const r of rows) s[r.level]++;
  return s;
}

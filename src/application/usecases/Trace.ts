import { DomainError } from '../../domain/errors';
import { ArtifactKind } from '../../domain/model/ArtifactType';
import { buildGraph, pagesOfKind } from '../../domain/model/Graph';
import { kindOfPage } from '../../domain/model/WikiPage';
import { AssuranceLevel, computeAssurance } from '../../domain/services/Assurance';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

const DRIVER_KINDS: ArtifactKind[] = ['use-case', 'quality-attribute', 'constraint', 'concern'];

export interface TraceRaw {
  raw: string;
  /** Whether the raw source still exists on disk (fix #6: advisory, not a throw). */
  exists: boolean;
}

export interface TraceIssue {
  key: string;
  system?: string;
  /** In the page's realized_by frontmatter but not in the ledger (§6.4). */
  stale: boolean;
}

export interface TraceResult {
  id: string;
  basename: string;
  kind: ArtifactKind | null;
  raw: TraceRaw[];
  /** Driver basenames this artifact cites (outgoing). */
  drivers: string[];
  /** ADR basenames (inbound coverage for a driver; outgoing for other nodes). */
  adrs: string[];
  issues: TraceIssue[];
  showcase: { page: string; hash: string }[];
  /** For a driver: computed AssuranceLevel L0/L1/L2 (FPF B.3.3); undefined for non-drivers. */
  assuranceLevel?: AssuranceLevel;
  /** One-line reason behind `assuranceLevel` (deterministic). */
  assuranceReason?: string;
}

export interface TraceDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
}

/**
 * Deterministically walk raw → driver → ADR → issue → showcase for an artifact id
 * and emit the chain (invariant 1: Core computes, the LLM only narrates). Absent
 * seams are `[]`/advisory, never a throw (carve-out b); only an unresolvable id
 * fails fast (exit 2).
 */
export async function trace(id: string, deps: TraceDeps): Promise<TraceResult> {
  const { repo, ledger } = deps;
  const wanted = id?.trim();
  if (!wanted) throw new DomainError('trace: missing <ID>', 1);

  const basename = await repo.resolveBasename(wanted);
  if (!basename) throw new DomainError(`trace: cannot resolve "${wanted}"`, 2);

  const [pages, allFiles, ledgerIssues, ledgerPages] = await Promise.all([
    repo.loadPages(),
    repo.listFiles(),
    ledger.readIssues(),
    ledger.readPages(),
  ]);
  const g = buildGraph(pages);
  const page = g.byBasename.get(basename)!;
  const kind = kindOfPage(page);
  const fileSet = new Set(allFiles);

  // Provenance: source frontmatter → raw file.
  const raw: TraceRaw[] = [];
  const source = (page.frontmatter as { source?: unknown }).source;
  if (typeof source === 'string' && source) {
    raw.push({ raw: source, exists: fileSet.has(source) });
  }

  // Drivers cited (outgoing links resolving to driver-kind pages).
  const driverSet = new Set(pagesOfKind(g, DRIVER_KINDS).map((p) => p.basename));
  const drivers = page.links.map((l) => l.target).filter((t) => driverSet.has(t) && t !== basename);

  // ADR chain: inbound ADRs for a driver, else outgoing ADRs.
  const adrSet = new Set(pagesOfKind(g, ['adr']).map((p) => p.basename));
  let adrs: string[];
  if (kind != null && DRIVER_KINDS.includes(kind)) {
    adrs = pagesOfKind(g, ['adr', 'iteration'])
      .filter((c) => c.links.some((l) => l.target === basename))
      .map((c) => c.basename);
  } else {
    adrs = page.links.map((l) => l.target).filter((t) => adrSet.has(t));
  }

  // Issues: realized_by frontmatter cross-checked against the ledger.
  const ledgerKeys = new Map(ledgerIssues.map((r) => [r.key, r]));
  const realizedBy = (page.frontmatter as { realized_by?: unknown }).realized_by;
  const issues: TraceIssue[] = [];
  const seen = new Set<string>();
  if (Array.isArray(realizedBy)) {
    for (const k of realizedBy.map(String)) {
      const row = ledgerKeys.get(k);
      issues.push({ key: k, system: row?.system, stale: row == null });
      seen.add(k);
    }
  }
  for (const r of ledgerIssues) {
    if (r.sourceId === wanted && !seen.has(r.key)) {
      issues.push({ key: r.key, system: r.system, stale: false });
      seen.add(r.key);
    }
  }

  // Showcase ledger rows about this artifact (v0.5).
  const showcase = ledgerPages
    .filter((r) => r.source === basename || r.source === page.relPath || r.source === wanted)
    .map((r) => ({ page: r.page, hash: r.contentHash }));

  // Graded assurance for a driver node (FPF B.3.3) — undefined for non-drivers.
  let assuranceLevel: AssuranceLevel | undefined;
  let assuranceReason: string | undefined;
  if (kind != null && DRIVER_KINDS.includes(kind)) {
    const row = computeAssurance(g, {
      ledgerIssueKeys: new Set(ledgerIssues.map((r) => r.key)),
    }).find((a) => a.driver === basename);
    assuranceLevel = row?.level;
    assuranceReason = row?.reason;
  }

  return {
    id: wanted,
    basename,
    kind,
    raw,
    drivers: [...new Set(drivers)].sort(),
    adrs: [...new Set(adrs)].sort(),
    issues: issues.sort((a, b) => a.key.localeCompare(b.key)),
    showcase: showcase.sort((a, b) => a.page.localeCompare(b.page)),
    assuranceLevel,
    assuranceReason,
  };
}

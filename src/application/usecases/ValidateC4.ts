import { buildGraph, pagesOfKind } from '../../domain/model/Graph';
import {
  LintFinding,
  Severity,
  SEVERITY_RANK,
  baselineKey,
} from '../../domain/services/LintRuleSet';
import {
  checkC4Consistency,
  C4Model,
  C4ConsistencyPolicy,
} from '../../domain/services/C4Consistency';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface ValidateC4Options {
  policy: C4ConsistencyPolicy;
  /** Record current mismatches as the known baseline instead of reporting them. */
  establishBaseline?: boolean;
  /** Minimum severity to report. */
  severity?: Severity;
}

export interface ValidateC4Report {
  findings: LintFinding[];
  counts: { high: number; medium: number; low: number };
  elementCount: number;
  entityCount: number;
  /** Set on --establish-baseline: number of baselined mismatch keys written. */
  baselineEstablished?: number;
}

const C4_BASELINE_FILE = '.arch-wiki/c4-baseline.json';

/**
 * Deterministic C4↔wiki consistency, mirroring `lintWiki`: Core computes drift
 * findings (the model arrives normalized from the orchestrator — LikeC4 MCP /
 * `likec4 export json`), suppresses an adoption baseline, and stays MCP-free
 * (invariant 1/6). `--establish-baseline` snapshots current mismatches so a
 * legacy model/wiki does not flood the SA — afterwards only delta is reported.
 */
export async function validateC4(
  model: C4Model,
  repo: WikiRepositoryPort,
  opts: ValidateC4Options,
): Promise<ValidateC4Report> {
  const graph = buildGraph(await repo.loadPages());
  const entityCount = pagesOfKind(graph, ['entity']).length;
  const all = checkC4Consistency(model, graph, opts.policy);

  if (opts.establishBaseline) {
    const keys = [...new Set(all.map(baselineKey))].sort();
    await repo.write(C4_BASELINE_FILE, `${JSON.stringify(keys, null, 2)}\n`);
    return {
      findings: [],
      counts: { high: 0, medium: 0, low: 0 },
      elementCount: model.elements.length,
      entityCount,
      baselineEstablished: keys.length,
    };
  }

  const baselineList = await repo.readC4Baseline();
  let findings = all;
  if (baselineList.length) {
    const baseline = new Set(baselineList);
    findings = findings.filter((f) => !baseline.has(baselineKey(f)));
  }
  if (opts.severity) {
    const min = SEVERITY_RANK[opts.severity];
    findings = findings.filter((f) => SEVERITY_RANK[f.severity] >= min);
  }

  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return { findings, counts, elementCount: model.elements.length, entityCount };
}

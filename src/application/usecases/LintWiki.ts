import { buildGraph } from '../../domain/model/Graph';
import { runLint, LintFinding, Severity, SEVERITY_RANK } from '../../domain/services/LintRuleSet';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface LintOptions {
  /** Restrict findings to these wiki-relative paths (hook/changed-file mode). */
  changed?: string[];
  /** Minimum severity to report. */
  severity?: Severity;
}

export interface LintReport {
  findings: LintFinding[];
  counts: { high: number; medium: number; low: number };
}

export async function lintWiki(
  repo: WikiRepositoryPort,
  opts: LintOptions = {},
): Promise<LintReport> {
  const [pages, allFilesList, baselineList] = await Promise.all([
    repo.loadPages(),
    repo.listFiles(),
    repo.readLintBaseline(),
  ]);
  const graph = buildGraph(pages);
  let findings = runLint(graph, { allFiles: new Set(allFilesList) });

  // Suppress findings recorded as a pre-existing baseline at adoption time.
  if (baselineList.length) {
    const baseline = new Set(baselineList);
    findings = findings.filter((f) => !baseline.has(`${f.rule}|${f.file ?? ''}|${f.message}`));
  }

  if (opts.changed && opts.changed.length) {
    const set = new Set(opts.changed);
    findings = findings.filter((f) => f.file != null && set.has(f.file));
  }
  if (opts.severity) {
    const min = SEVERITY_RANK[opts.severity];
    findings = findings.filter((f) => SEVERITY_RANK[f.severity] >= min);
  }

  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return { findings, counts };
}

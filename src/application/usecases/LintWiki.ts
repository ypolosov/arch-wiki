import { ARTIFACT_SPECS, ArtifactKind } from '../../domain/model/ArtifactType';
import { RequiredSection } from '../../domain/model/ProjectConfigSchema';
import { buildGraph } from '../../domain/model/Graph';
import {
  runLint,
  baselineKey,
  gatherSupersededCitations,
  LintFinding,
  Severity,
  SEVERITY_RANK,
  sortFindings,
  SupersededCitation,
} from '../../domain/services/LintRuleSet';
import { glossaryFindings, parseTermSheet } from '../../domain/services/Glossary';
import { ProjectConfig } from '../../domain/services/ProjectConfig';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface LintOptions {
  /** Restrict findings to these wiki-relative paths (hook/changed-file mode). */
  changed?: string[];
  /** Minimum severity to report. */
  severity?: Severity;
  /** Project profile; supplies required-sections-per-kind (absent ⇒ no such checks). */
  config?: ProjectConfig;
}

export interface LintReport {
  findings: LintFinding[];
  counts: { high: number; medium: number; low: number };
  /** Candidate citations of superseded ADRs for LLM/human triage (not findings). */
  supersededCitations: SupersededCitation[];
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

  const requiredSections = new Map<ArtifactKind, readonly RequiredSection[]>();
  if (opts.config) {
    for (const kind of Object.keys(ARTIFACT_SPECS) as ArtifactKind[]) {
      const rs = opts.config.requiredSections(kind);
      if (rs.length) requiredSections.set(kind, rs);
    }
  }

  let findings = runLint(graph, { allFiles: new Set(allFilesList), requiredSections });

  // Deterministic glossary term-sheet checks (FPF F.7/F.8/F.13/F.17) over glossary.md content.
  const glossaryPage = pages.find((p) => p.basename === 'glossary');
  if (glossaryPage) {
    const gf = glossaryFindings(parseTermSheet(await repo.read(glossaryPage.relPath)), graph);
    if (gf.length) findings = sortFindings([...findings, ...gf]);
  }

  // Suppress findings recorded as a pre-existing baseline at adoption time.
  if (baselineList.length) {
    const baseline = new Set(baselineList);
    findings = findings.filter((f) => !baseline.has(baselineKey(f)));
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
  return { findings, counts, supersededCitations: gatherSupersededCitations(graph) };
}

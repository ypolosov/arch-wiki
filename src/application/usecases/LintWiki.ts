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
import { qaMeasureFinding } from '../../domain/services/QualityAttribute';
import { adrOptionsEmptyFinding, adrStatusFindings } from '../../domain/services/DecisionRecord';
import { utilityPriorityFindings } from '../../domain/services/UtilityTree';
import {
  ArtifactRefs,
  contradictionNoteMissingFindings,
  contradictionNoteOrphanFindings,
  parseContradictionRefs,
  parseRiskRows,
} from '../../domain/services/ContradictionRefs';
import { kindOfPage } from '../../domain/model/WikiPage';
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

  // QA measure well-formedness (FPF C.16): a stated Measure must carry a numeric threshold.
  const qaPages = pages.filter((p) => kindOfPage(p) === 'quality-attribute');
  const qaFindings = (
    await Promise.all(qaPages.map(async (p) => qaMeasureFinding(p.basename, p.relPath, await repo.read(p.relPath))))
  ).filter((f): f is NonNullable<typeof f> => f != null);
  if (qaFindings.length) findings = sortFindings([...findings, ...qaFindings]);

  // ADR candidate-set adequacy (FPF C.32.ADA): an accepted ADR's options section must not be empty.
  const adrPages = pages.filter((p) => kindOfPage(p) === 'adr');
  const adrFindings = (
    await Promise.all(
      adrPages.map(async (p) =>
        adrOptionsEmptyFinding(
          p.basename,
          p.relPath,
          String((p.frontmatter as { status?: unknown }).status ?? ''),
          await repo.read(p.relPath),
        ),
      ),
    )
  ).filter((f): f is NonNullable<typeof f> => f != null);
  if (adrFindings.length) findings = sortFindings([...findings, ...adrFindings]);

  // ADR status canon + carrier agreement (single source of truth: domain/model/AdrStatus).
  const adrStatus = (
    await Promise.all(
      adrPages.map(async (p) =>
        adrStatusFindings(p.basename, p.relPath, p.frontmatter as { status?: unknown; tags?: unknown }, await repo.read(p.relPath)),
      ),
    )
  ).flat();
  if (adrStatus.length) findings = sortFindings([...findings, ...adrStatus]);

  // Contradiction note ⟷ risks.md row coherence. A note is a temporary marker of an OPEN question;
  // its lifecycle is bound to its register row. Link-based (never prose-based) — see ContradictionRefs.
  const risksPage = pages.find((p) => p.basename === 'risks');
  if (risksPage) {
    const rows = parseRiskRows(await repo.read(risksPage.relPath));
    if (rows.length) {
      const contested = new Set(rows.flatMap((r) => r.related));
      // Only pages a row actually names, plus any page that already links a contradiction.
      const refs: ArtifactRefs[] = (
        await Promise.all(
          pages
            .filter((p) => p.basename !== 'risks')
            .map(async (p) => ({
              file: p.relPath,
              basename: p.basename,
              refs: parseContradictionRefs(await repo.read(p.relPath)),
            })),
        )
      ).filter((a) => a.refs.length > 0 || contested.has(a.basename));
      const cf = [
        ...contradictionNoteOrphanFindings(refs, rows),
        ...contradictionNoteMissingFindings(refs, rows, risksPage.relPath),
      ];
      if (cf.length) findings = sortFindings([...findings, ...cf]);
    }
  }

  // Utility-tree ScoringMethod well-formedness (FPF A.19): each priority cell must be an ATAM
  // (Importance,Difficulty) H/M/L pair. Single derived register, keyed like the glossary.
  const utilityPage = pages.find((p) => p.basename === 'utility-tree');
  if (utilityPage) {
    const uf = utilityPriorityFindings(utilityPage.relPath, await repo.read(utilityPage.relPath));
    if (uf.length) findings = sortFindings([...findings, ...uf]);
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

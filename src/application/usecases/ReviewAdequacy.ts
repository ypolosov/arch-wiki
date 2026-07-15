import { ArtifactKind } from '../../domain/model/ArtifactType';
import { buildGraph } from '../../domain/model/Graph';
import {
  AdequacySummary,
  ArtifactAdequacy,
  computeAdequacy,
  summarizeAdequacy,
} from '../../domain/services/Adequacy';
import { computeAssurance } from '../../domain/services/Assurance';
import { gatherEpistemicDebt } from '../../domain/services/EpistemicDebt';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface ReviewAdequacyDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
}

export interface ReviewAdequacyOptions {
  /** Restrict to one artifact kind. */
  kind?: ArtifactKind;
  /** Restrict to one artifact by id/basename (exact or `<id>-…` prefix). */
  id?: string;
}

export interface ReviewAdequacyReport {
  artifacts: ArtifactAdequacy[];
  summary: AdequacySummary;
}

/**
 * Deterministically score the structural adequacy of every design artifact
 * (FPF C.32.ADA / C.30.AD), composing the wave-2 evidence signals: AssuranceLevel
 * feeds the driver `covered` base, epistemic debt feeds `no-debt`. Read-only; the
 * LLM (`/arch-wiki:review`) adds the judgement the Core floor cannot.
 */
export async function reviewAdequacy(
  opts: ReviewAdequacyOptions,
  deps: ReviewAdequacyDeps,
): Promise<ReviewAdequacyReport> {
  const [pages, files, issues] = await Promise.all([
    deps.repo.loadPages(),
    deps.repo.listFiles(),
    deps.ledger.readIssues(),
  ]);
  const g = buildGraph(pages);
  const ledgerIssueKeys = new Set(issues.map((r) => r.key));
  const assurance = new Map(
    computeAssurance(g, { ledgerIssueKeys }).map((a) => [a.driver, a]),
  );
  const debtSubjects = new Set(
    gatherEpistemicDebt(g, { ledgerIssueKeys, fileSet: new Set(files) }).map((d) => d.subject),
  );

  let artifacts = computeAdequacy(g, { assurance, debtSubjects });
  if (opts.kind) artifacts = artifacts.filter((a) => a.kind === opts.kind);
  if (opts.id) {
    const want = opts.id.toLowerCase();
    artifacts = artifacts.filter(
      (a) => a.id.toLowerCase() === want || a.id.toLowerCase().startsWith(`${want}-`),
    );
  }
  return { artifacts, summary: summarizeAdequacy(artifacts) };
}

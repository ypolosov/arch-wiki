import { ARTIFACT_SPECS } from '../../domain/model/ArtifactType';
import { DomainError } from '../../domain/errors';
import { scaffoldArtifact, ScaffoldDeps, ScaffoldResult } from './ScaffoldArtifact';
import { updateKanban } from './UpdateKanban';

export interface HypothesisInput {
  title: string;
  slug?: string;
  /** Back-reference to the originating `raw/<file>` (must exist on disk). */
  from?: string;
  /** Forward-reference driver candidate (placeholder wikilink in frontmatter). */
  driverCandidate?: string;
  dryRun?: boolean;
}

export interface HypothesisResult extends ScaffoldResult {
  /** kanban card auto-added to clear the orphan (null on dry-run). */
  kanbanCard: string | null;
}

/**
 * FPF ProblemCard@Context (C.22.2) + abductive discipline (B.5.2): shape the problem and
 * its falsification criterion BEFORE the hypothesis becomes a driver. The lint rules
 * `hypothesis-unfalsifiable` / `hypothesis-no-rival` assert the Acceptance-probe / Rival fields.
 */
const PROBLEM_CARD = [
  '## Problem Card',
  '<!-- FPF C.22.2 / B.5.2 — shape the problem before it becomes a driver.',
  '     Line-start bold labels so `arch-wiki lint` sees the Acceptance-probe / Rival fields. -->',
  '',
  '**Prompt:** ',
  '',
  '**Scope cut:** ',
  '',
  '**Why not just a wish:** ',
  '',
  '**Rival:** ',
  '',
  '**Acceptance probe:** ',
  '',
  '**Next use:** ',
  '',
  '## Hypothesis',
  '<!-- assumption · rationale · what would validate / refute it (English canon) -->',
].join('\n');

/**
 * Scaffold a `concept`-kind hypothesis (`hypothesis-<slug>.md`) with traceability
 * frontmatter + a ProblemCard body, then auto-add a kanban backlog card so the page is
 * not an orphan (fix #2: kanban `[[..]]` links count as inbound even though kanban is
 * structural). Deterministic; reuses the single scaffold path (§4.0).
 */
export async function scaffoldHypothesis(
  input: HypothesisInput,
  deps: ScaffoldDeps,
): Promise<HypothesisResult> {
  const { repo } = deps;
  if (!input.title?.trim()) throw new DomainError('hypothesis: missing --title', 1);
  if (input.from && !(await repo.exists(input.from))) {
    throw new DomainError(`hypothesis: --from not found: ${input.from}`, 2);
  }

  const frontmatter: Record<string, unknown> = { status: 'hypothesis' };
  if (input.from) frontmatter.source = input.from;
  if (input.driverCandidate) frontmatter.realizes_driver = [input.driverCandidate];

  const result = await scaffoldArtifact(
    {
      spec: ARTIFACT_SPECS['concept'],
      title: input.title,
      slug: input.slug,
      slugPrefix: 'hypothesis',
      frontmatter,
      appendBody: PROBLEM_CARD,
      dryRun: input.dryRun,
    },
    deps,
  );

  if (input.dryRun) return { ...result, kanbanCard: null };

  const card = result.path.replace(/^.*\//, '').replace(/\.md$/, '');
  await updateKanban({ add: card }, { repo });
  return { ...result, kanbanCard: card };
}

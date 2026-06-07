import { DomainError } from '../../domain/errors';
import { deepMerge } from '../../domain/services/DeepMerge';
import { ClockPort } from '../ports/ClockPort';
import { FrontmatterParserPort } from '../ports/FrontmatterParserPort';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';
import { IssueKind, IssueRole, ISSUE_KINDS, ISSUE_ROLES } from './RenderIssuePayload';

export interface RecordIssueInput {
  /** Source artifact id (e.g. QA-007). */
  id: string;
  /** External issue key (e.g. GRM-431). */
  key: string;
  kind: IssueKind;
  role?: IssueRole;
  /** Content hash from the render step. */
  hash: string;
  /** External system (default jira). */
  system?: string;
}

export interface RecordIssueDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
  frontmatter: FrontmatterParserPort;
  clock: ClockPort;
}

export interface RecordIssueResult {
  key: string;
  ledgerAppended: boolean;
  frontmatterUpdated: boolean;
  path: string | null;
}

/**
 * Record a created issue: append the authoritative ledger row AND write a
 * `realized_by: [key]` back-reference into the source page's frontmatter
 * (idempotent skip-if-present, like appendHubLink). Two-way trace (§4.6).
 */
export async function recordIssue(
  input: RecordIssueInput,
  deps: RecordIssueDeps,
): Promise<RecordIssueResult> {
  const { repo, ledger, frontmatter, clock } = deps;
  const id = input.id?.trim();
  const key = input.key?.trim();
  if (!id) throw new DomainError('record-issue: missing --id', 1);
  if (!key) throw new DomainError('record-issue: missing --key', 1);
  if (!ISSUE_KINDS.includes(input.kind)) {
    throw new DomainError(`record-issue: --kind must be one of ${ISSUE_KINDS.join('|')}`, 1);
  }
  if (input.kind === 'techdesign' && !input.role) {
    throw new DomainError('record-issue: --role is required for --kind techdesign', 1);
  }
  if (input.role && !ISSUE_ROLES.includes(input.role)) {
    throw new DomainError(`record-issue: --role must be one of ${ISSUE_ROLES.join('|')}`, 1);
  }
  if (!input.hash?.trim()) throw new DomainError('record-issue: missing --hash', 1);

  const ledgerAppended = await ledger.appendIssue({
    key,
    sourceId: id,
    kind: input.kind,
    role: input.role ?? null,
    contentHash: input.hash,
    createdAt: clock.now().toISOString(),
    system: input.system?.trim() || 'jira',
  });

  // Write realized_by back into the source page frontmatter (idempotent).
  let frontmatterUpdated = false;
  let pagePath: string | null = null;
  const basename = await repo.resolveBasename(id);
  if (basename) {
    const page = (await repo.loadPages()).find((p) => p.basename === basename);
    if (page) {
      pagePath = page.relPath;
      const { frontmatter: fm, content } = await repo.readParsed(page.relPath);
      const existing = Array.isArray((fm as { realized_by?: unknown }).realized_by)
        ? ((fm as { realized_by: unknown[] }).realized_by.map(String))
        : [];
      if (!existing.includes(key)) {
        const merged = deepMerge(fm, { realized_by: [...existing, key].sort() });
        await repo.write(page.relPath, frontmatter.stringify({ frontmatter: merged, content }));
        frontmatterUpdated = true;
      }
    }
  }

  return { key, ledgerAppended, frontmatterUpdated, path: pagePath };
}

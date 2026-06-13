import { DomainError } from '../../domain/errors';
import { deepMerge } from '../../domain/services/DeepMerge';
import { ClockPort } from '../ports/ClockPort';
import { FrontmatterParserPort } from '../ports/FrontmatterParserPort';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export interface RecordPageInput {
  /** Wiki-relative source path of the published artifact (the ledger key). */
  source: string;
  /** External Confluence page id (omit for --delete). */
  page?: string;
  /** Content hash from render-confluence (omit for --delete). */
  hash?: string;
  /** External system (default confluence). */
  system?: string;
  /** Reconcile a deleted orphan: drop its ledger row + published_as backref. */
  del?: boolean;
}

export interface RecordPageDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
  frontmatter: FrontmatterParserPort;
  clock: ClockPort;
}

export interface RecordPageResult {
  source: string;
  page: string | null;
  ledgerAppended: boolean;
  ledgerRemoved: boolean;
  frontmatterUpdated: boolean;
}

/**
 * Record a published Confluence page (CAP-2 ledger step, mirror of recordIssue):
 * upsert the authoritative `published-pages` row (drift updates the hash) and write
 * a `published_as: [confluence:<id>]` back-reference into the source frontmatter
 * (idempotent). `--delete` reconciles an orphan: removes the ledger row + backref.
 */
export async function recordPage(
  input: RecordPageInput,
  deps: RecordPageDeps,
): Promise<RecordPageResult> {
  const { repo, ledger, frontmatter, clock } = deps;
  const source = input.source?.trim();
  if (!source) throw new DomainError('record-page: missing --source', 1);

  if (input.del) {
    const ledgerRemoved = await ledger.removePage(source);
    let frontmatterUpdated = false;
    if (await repo.exists(source)) {
      const { frontmatter: fm, content } = await repo.readParsed(source);
      if (Array.isArray((fm as { published_as?: unknown }).published_as)) {
        const next = { ...(fm as Record<string, unknown>) };
        delete next.published_as;
        await repo.write(source, frontmatter.stringify({ frontmatter: next, content }));
        frontmatterUpdated = true;
      }
    }
    return { source, page: null, ledgerAppended: false, ledgerRemoved, frontmatterUpdated };
  }

  const page = input.page?.trim();
  if (!page) throw new DomainError('record-page: missing --page', 1);
  if (!input.hash?.trim()) throw new DomainError('record-page: missing --hash', 1);
  const system = input.system?.trim() || 'confluence';

  const ledgerAppended = await ledger.appendPage({
    source,
    page,
    contentHash: input.hash,
    publishedAt: clock.now().toISOString(),
    system,
  });

  // Write published_as back into the source page frontmatter (idempotent).
  let frontmatterUpdated = false;
  if (await repo.exists(source)) {
    const { frontmatter: fm, content } = await repo.readParsed(source);
    const tag = `${system}:${page}`;
    const existing = Array.isArray((fm as { published_as?: unknown }).published_as)
      ? (fm as { published_as: unknown[] }).published_as.map(String)
      : [];
    if (!existing.includes(tag)) {
      const merged = deepMerge(fm, { published_as: [...existing, tag].sort() });
      await repo.write(source, frontmatter.stringify({ frontmatter: merged, content }));
      frontmatterUpdated = true;
    }
  }

  return { source, page, ledgerAppended, ledgerRemoved: false, frontmatterUpdated };
}

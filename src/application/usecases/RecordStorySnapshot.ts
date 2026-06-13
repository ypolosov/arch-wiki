import { DomainError } from '../../domain/errors';
import { requireSlug } from '../../domain/services/KebabSlug';
import { ClockPort } from '../ports/ClockPort';
import { FrontmatterParserPort } from '../ports/FrontmatterParserPort';
import { LedgerStorePort } from '../ports/LedgerStorePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

/** Machine-synced snapshot zone (under raw/, so the guard hook blocks manual edits). */
export const SYNC_DIR = 'raw/_synced/user-story-log';
const MAX_BODY_BYTES = 512 * 1024;

export interface RecordStoryInput {
  pageId: string;
  title: string;
  /** Upstream page version (Confluence). */
  version: number;
  /** The fetched page body (markdown), passed via stdin by the orchestrator. */
  body: string;
  parentId?: string;
  /** Explicit kebab slug (needed for non-latin titles). */
  slug?: string;
  /** Determinism override; defaults to clock.now(). */
  pulledAt?: string;
}

export interface RecordStoryDeps {
  repo: WikiRepositoryPort;
  ledger: LedgerStorePort;
  clock: ClockPort;
  hash: (content: string) => string;
  frontmatter: FrontmatterParserPort;
}

export interface RecordStoryResult {
  relPath: string;
  /** Whether the snapshot file was (re)written. */
  written: boolean;
  /** True when an earlier snapshot existed and its content changed. */
  drifted: boolean;
  contentHash: string;
}

/** Normalize CRLF→LF and trailing whitespace so the hash is stable across re-pulls. */
function normalizeBody(s: string): string {
  return `${s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '')}\n`;
}

/**
 * CAP-1 raw/_synced writer (the ScaffoldQuestionnaire precedent: the guard hook
 * blocks Edit/Write *tool calls*, not this CLI usecase). Validates the external
 * body, writes a READ-ONLY snapshot with provenance frontmatter, and upserts the
 * `pulled-sources` ledger keyed on `pageId` (drift by contentHash). Re-pulling an
 * unchanged page is a no-op; a changed page rewrites the snapshot (drifted:true).
 */
export async function recordStorySnapshot(
  input: RecordStoryInput,
  deps: RecordStoryDeps,
): Promise<RecordStoryResult> {
  if (!input.pageId) throw new DomainError('record-story: missing --page', 1);
  if (!input.title) throw new DomainError('record-story: missing --title', 1);
  const body = input.body ?? '';
  if (body.trim() === '') throw new DomainError('record-story: empty page body', 2);
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    throw new DomainError('record-story: page body exceeds 512KB', 2);
  }

  const slug = input.slug ?? requireSlug(input.title);
  const relPath = `${SYNC_DIR}/${input.pageId}-${slug}.md`;
  const content = normalizeBody(body);
  const contentHash = deps.hash(content);

  const rows = await deps.ledger.readPulled();
  const existing = rows.find((r) => r.pageId === input.pageId);
  if (existing && existing.contentHash === contentHash && existing.relPath === relPath) {
    return { relPath, written: false, drifted: false, contentHash };
  }

  const pulledAt = input.pulledAt ?? deps.clock.now().toISOString();
  const frontmatter: Record<string, unknown> = {
    source: 'confluence',
    pageId: input.pageId,
    title: input.title,
    version: input.version,
    pulledAt,
    contentHash,
  };
  if (input.parentId) frontmatter.parentId = input.parentId;

  // If the slug/path changed (renamed upstream), drop the stale snapshot file.
  if (existing && existing.relPath !== relPath) await deps.repo.deleteFile(existing.relPath);

  await deps.repo.write(relPath, deps.frontmatter.stringify({ frontmatter, content }));
  await deps.ledger.appendPulled({
    pageId: input.pageId,
    relPath,
    title: input.title,
    version: input.version,
    contentHash,
    pulledAt,
    source: 'confluence',
  });

  return { relPath, written: true, drifted: existing != null, contentHash };
}

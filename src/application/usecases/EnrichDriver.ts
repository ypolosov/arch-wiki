import { BooksAnswer, BooksHit } from '../ports/BooksRagPort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

const HEADING = '## Related Patterns';
const START = '<!-- arch-wiki:enrich:start -->';
const END = '<!-- arch-wiki:enrich:end -->';
const NONE = '<!-- arch-wiki:enrich none -->';
const KEY_PREFIX = 'enrich:';

export interface EnrichDriverInput {
  /** Books-rag answers keyed `enrich:<driver-id>`. */
  answers: BooksAnswer[];
}

export interface EnrichDriverDeps {
  repo: WikiRepositoryPort;
}

export interface EnrichDriverResult {
  enriched: { driver: string; path: string; hits: number }[];
  /** Driver ids that could not be resolved to a page. */
  unresolved: string[];
}

function oneLine(s: string): string {
  return s.replace(/\r?\n/g, ' ').trim();
}

function sortHits(hits: readonly BooksHit[]): BooksHit[] {
  return [...hits].sort((a, b) => b.score - a.score || a.source.localeCompare(b.source));
}

/**
 * Build the `## Related Patterns` block. Fix #10: even with ZERO hits Core writes
 * the section with a `none` marker — absent section = "not yet enriched", empty
 * section with marker = "enriched, zero hits" (auditable in git).
 */
function buildSection(hits: readonly BooksHit[]): string {
  const body = hits.length
    ? sortHits(hits).map((h) => `- ${h.source} · ${h.score} · ${oneLine(h.excerpt)}`).join('\n')
    : NONE;
  return `${HEADING}\n${START}\n${body}\n${END}`;
}

function applySection(content: string, section: string): string {
  const marker = `${HEADING}\n${START}`;
  const mIdx = content.indexOf(marker);
  if (mIdx >= 0) {
    const eIdx = content.indexOf(END, mIdx);
    if (eIdx >= 0) return content.slice(0, mIdx) + section + content.slice(eIdx + END.length);
  }
  const base = content.length === 0 || content.endsWith('\n') ? content : `${content}\n`;
  return `${base}\n${section}\n`;
}

/**
 * Deterministically write `## Related Patterns` onto each driver from books-rag
 * answers. Idempotent (re-enrich replaces the managed block). Pure-ish: only file
 * I/O via the repo port. Unresolvable drivers are reported, not thrown (the report
 * stays advisory; the form-level fail-fast on `--rag-results` lives in the CLI).
 */
export async function enrichDriver(
  input: EnrichDriverInput,
  deps: EnrichDriverDeps,
): Promise<EnrichDriverResult> {
  const { repo } = deps;
  const pages = await repo.loadPages();
  const enriched: EnrichDriverResult['enriched'] = [];
  const unresolved: string[] = [];

  for (const answer of input.answers) {
    if (!answer.key.startsWith(KEY_PREFIX)) {
      unresolved.push(answer.key);
      continue;
    }
    const driver = answer.key.slice(KEY_PREFIX.length);
    const basename = await repo.resolveBasename(driver);
    const page = basename ? pages.find((p) => p.basename === basename) : undefined;
    if (!page) {
      unresolved.push(driver);
      continue;
    }
    const content = await repo.read(page.relPath);
    await repo.write(page.relPath, applySection(content, buildSection(answer.hits)));
    enriched.push({ driver, path: page.relPath, hits: answer.hits.length });
  }

  enriched.sort((a, b) => a.driver.localeCompare(b.driver));
  unresolved.sort();
  return { enriched, unresolved };
}

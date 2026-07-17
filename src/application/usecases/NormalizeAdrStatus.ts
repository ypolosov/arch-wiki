import {
  isAdrStatus,
  isTemplateSlot,
  normalizeAdrStatus,
  RETIRED_STATUS_MAP,
  statusTag,
} from '../../domain/model/AdrStatus';
import { kindOfPage } from '../../domain/model/WikiPage';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

/**
 * Normalize legacy ADR statuses onto the canon.
 *
 * **Report-only by default** — `--write` is an explicit act. This is deliberately NOT a schema
 * migration: the migration chain has never touched artifact content (its "zero artifact
 * modifications" property was the risk closure that made adoption safe), and `migrate` writes by
 * default. Rewriting decisions on a routine upgrade is exactly the footgun to avoid.
 *
 * What it touches: **frontmatter `status:` and the `adr/<status>` tag — nothing else.** The decision's
 * text is never rewritten; only the record's own state fields (FPF C.32.ADR — the file is a projection
 * of the decision). Mirror-neutral: the body is unchanged, so no page re-publishes.
 *
 * What it refuses: an unknown status with no mapping is **reported, never guessed**. A decision's state
 * is a human call.
 */
export interface StatusChange {
  file: string;
  basename: string;
  from: string;
  to: string;
  /** A tech-debt reminder when the retired status implied unfinished work. */
  note?: string;
}

export interface NormalizeAdrStatusResult {
  /** Mapped legacy statuses (applied when `write`, otherwise proposed). */
  changes: StatusChange[];
  /** Non-canonical statuses with no known mapping — a human must decide. */
  unmapped: { file: string; basename: string; status: string }[];
  written: boolean;
  /** True when a second run would be a no-op. */
  idempotent: boolean;
}

export interface NormalizeAdrStatusOptions {
  /** Apply the changes. Default false — report only. */
  write?: boolean;
}

/** Replace the `status:` value and the `adr/<old>` tag in raw frontmatter text, touching nothing else. */
function rewriteFrontmatter(content: string, from: string, to: string): string {
  const end = content.indexOf('\n---', 3);
  if (!content.startsWith('---') || end < 0) return content;
  const head = content.slice(0, end);
  const rest = content.slice(end);
  const nextHead = head
    .replace(/^status:[ \t]*\S.*$/m, `status: ${to}`)
    .split('\n')
    .map((l) => (l.includes(statusTag(from)) ? l.replace(statusTag(from), statusTag(to)) : l))
    .join('\n');
  return `${nextHead}${rest}`;
}

export async function normalizeAdrStatuses(
  repo: WikiRepositoryPort,
  opts: NormalizeAdrStatusOptions = {},
): Promise<NormalizeAdrStatusResult> {
  const write = opts.write === true;
  const pages = (await repo.loadPages()).filter((p) => kindOfPage(p) === 'adr' && !isTemplateSlot(p.basename));

  const changes: StatusChange[] = [];
  const unmapped: NormalizeAdrStatusResult['unmapped'] = [];

  for (const p of pages.sort((a, b) => a.relPath.localeCompare(b.relPath))) {
    const from = normalizeAdrStatus((p.frontmatter as { status?: unknown }).status);
    if (!from || isAdrStatus(from)) continue;
    const to = RETIRED_STATUS_MAP[from];
    if (!to) {
      unmapped.push({ file: p.relPath, basename: p.basename, status: from });
      continue;
    }
    changes.push({
      file: p.relPath,
      basename: p.basename,
      from,
      to,
      note: `"${from}" described how much was BUILT, not what was decided — record the unfinished part as a tech-debt row in risks.md; the decision itself is ${to}`,
    });
    if (write) {
      const content = await repo.read(p.relPath);
      const next = rewriteFrontmatter(content, from, to);
      if (next !== content) await repo.write(p.relPath, next);
    }
  }

  return { changes, unmapped, written: write, idempotent: changes.length === 0 && unmapped.length === 0 };
}

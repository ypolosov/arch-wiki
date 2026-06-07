import { TemplatePort } from '../ports/TemplatePort';
import { WikiRepositoryPort } from '../ports/WikiRepositoryPort';

export type SyncStatus = 'synced' | 'missing' | 'stale' | 'curated';

export interface SyncEntry {
  /** Template filename, e.g. `adr.md`. */
  name: string;
  /** Classification before any write this run. */
  status: SyncStatus;
  /** True if this run wrote the target file. */
  wrote: boolean;
  /** Backup path written before overwriting a stale managed template. */
  backedUp?: string;
}

export interface SyncTemplatesResult {
  entries: SyncEntry[];
  counts: Record<SyncStatus, number>;
  /** Files that would change under `--force` (missing + stale). */
  actionable: number;
  wrote: string[];
}

export interface SyncTemplatesInput {
  /** `--force`: write missing/stale templates. Curated files are never touched. */
  write: boolean;
}

export interface SyncTemplatesDeps {
  templates: TemplatePort;
  repo: WikiRepositoryPort;
  hash: (content: string) => string;
}

const FOAM_DIR = '.foam/templates';
const MARKER_RE = /<!-- arch-wiki:template sha256=([0-9a-f]+) -->/;

/** Plugin body + provenance marker — the content arch-wiki writes/manages. */
function managed(body: string, bodyHash: string): string {
  return `${body.replace(/\s+$/, '')}\n\n<!-- arch-wiki:template sha256=${bodyHash} -->\n`;
}

/**
 * One-way, non-destructive sync of the plugin's canonical templates into the
 * target's `.foam/templates/`. Provenance is tracked by an origin marker: files
 * arch-wiki wrote are `synced`/`stale`; files without the marker are `curated`
 * (user/Foam authored) and are NEVER overwritten — to replace one, delete it
 * first. `--force` only creates missing templates and updates stale ones
 * (backing up the old copy). Default mode writes nothing.
 */
export async function syncTemplates(
  input: SyncTemplatesInput,
  deps: SyncTemplatesDeps,
): Promise<SyncTemplatesResult> {
  const { templates, repo, hash } = deps;
  const entries: SyncEntry[] = [];
  const wrote: string[] = [];

  for (const { name, body } of await templates.listAll()) {
    const bodyHash = hash(body);
    const rel = `${FOAM_DIR}/${name}`;
    let status: SyncStatus;
    let cur = '';
    if (!(await repo.exists(rel))) {
      status = 'missing';
    } else {
      cur = await repo.read(rel);
      const m = MARKER_RE.exec(cur);
      if (m && m[1] === bodyHash) status = 'synced';
      else if (m) status = 'stale';
      else status = 'curated';
    }

    const entry: SyncEntry = { name, status, wrote: false };
    if (input.write && (status === 'missing' || status === 'stale')) {
      if (status === 'stale') {
        const bak = `${rel}.bak`;
        await repo.write(bak, cur);
        entry.backedUp = bak;
      }
      await repo.write(rel, managed(body, bodyHash));
      entry.wrote = true;
      wrote.push(rel);
    }
    entries.push(entry);
  }

  const counts: Record<SyncStatus, number> = { synced: 0, missing: 0, stale: 0, curated: 0 };
  for (const e of entries) counts[e.status]++;
  return { entries, counts, actionable: counts.missing + counts.stale, wrote };
}

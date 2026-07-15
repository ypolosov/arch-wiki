import * as path from 'node:path';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import {
  DebtWaiverRow,
  IssueLedgerRow,
  LedgerStorePort,
  PageLedgerRow,
  PulledSourceRow,
} from '../../application/ports/LedgerStorePort';

const ISSUES_FILE = 'created-issues.json';
const PAGES_FILE = 'published-pages.json';
const PULLED_FILE = 'pulled-sources.json';
const WAIVERS_FILE = 'epistemic-debt-waivers.json';
const SCHEMA_VERSION = 1;

/** Stores idempotency ledgers at `<root>/.arch-wiki/{created-issues,published-pages}.json`. */
export class FileLedgerStore implements LedgerStorePort {
  constructor(
    private readonly root: string,
    private readonly fs: FileSystemPort,
  ) {}

  private file(name: string): string {
    return path.join(this.root, '.arch-wiki', name);
  }

  private async readArray<T>(name: string, field: string): Promise<T[]> {
    const f = this.file(name);
    if (!(await this.fs.exists(f))) return [];
    const parsed = JSON.parse(await this.fs.readFile(f)) as Record<string, unknown>;
    const rows = parsed[field];
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  private async writeArray(name: string, field: string, rows: unknown[]): Promise<void> {
    await this.fs.writeFile(this.file(name), `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, [field]: rows }, null, 2)}\n`);
  }

  async readIssues(): Promise<IssueLedgerRow[]> {
    return this.readArray<IssueLedgerRow>(ISSUES_FILE, 'issues');
  }

  async appendIssue(row: IssueLedgerRow): Promise<boolean> {
    const rows = await this.readIssues();
    const idx = rows.findIndex(
      (r) => r.key === row.key && r.sourceId === row.sourceId && r.kind === row.kind && r.role === row.role,
    );
    if (idx >= 0) {
      if (rows[idx]!.contentHash === row.contentHash) return false; // identical → no-op
      rows[idx] = row; // upsert-on-drift (key = key+sourceId+kind+role) — refresh the recorded hash
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.key.localeCompare(b.key));
    await this.writeArray(ISSUES_FILE, 'issues', rows);
    return true;
  }

  async readPages(): Promise<PageLedgerRow[]> {
    return this.readArray<PageLedgerRow>(PAGES_FILE, 'pages');
  }

  async appendPage(row: PageLedgerRow): Promise<boolean> {
    const rows = await this.readPages();
    const idx = rows.findIndex((r) => r.page === row.page && r.source === row.source);
    if (idx >= 0) {
      const existing = rows[idx]!;
      // An OMITTED incoming pageVersion means "no new baseline" — carry the recorded one forward
      // rather than wiping it. Otherwise a content-identical re-record without --page-version (e.g.
      // a pass-2 re-record) would null the baseline and silently disable the destination-drift
      // guard (review H2). A SUPPLIED pageVersion still refreshes the baseline (R1, v0.8).
      const merged: PageLedgerRow =
        row.pageVersion == null && existing.pageVersion != null
          ? { ...row, pageVersion: existing.pageVersion }
          : row;
      // No-op ONLY when BOTH the content hash AND the (merged) drift baseline match.
      if (existing.contentHash === merged.contentHash && existing.pageVersion === merged.pageVersion) {
        return false;
      }
      rows[idx] = merged; // upsert-on-drift (key = page+source) — refresh hash and/or pageVersion
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.page.localeCompare(b.page));
    await this.writeArray(PAGES_FILE, 'pages', rows);
    return true;
  }

  async removePage(source: string): Promise<boolean> {
    const rows = await this.readPages();
    const next = rows.filter((r) => r.source !== source);
    if (next.length === rows.length) return false;
    await this.writeArray(PAGES_FILE, 'pages', next);
    return true;
  }

  async readPulled(): Promise<PulledSourceRow[]> {
    return this.readArray<PulledSourceRow>(PULLED_FILE, 'pulled');
  }

  async appendPulled(row: PulledSourceRow): Promise<boolean> {
    const rows = await this.readPulled();
    const idx = rows.findIndex((r) => r.pageId === row.pageId);
    if (idx >= 0) {
      const cur = rows[idx]!;
      if (cur.contentHash === row.contentHash && cur.relPath === row.relPath) return false; // identical
      rows[idx] = row; // upsert-on-drift (key = pageId)
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.pageId.localeCompare(b.pageId));
    await this.writeArray(PULLED_FILE, 'pulled', rows);
    return true;
  }

  async removePulled(pageId: string): Promise<boolean> {
    const rows = await this.readPulled();
    const next = rows.filter((r) => r.pageId !== pageId);
    if (next.length === rows.length) return false;
    await this.writeArray(PULLED_FILE, 'pulled', next);
    return true;
  }

  async readWaivers(): Promise<DebtWaiverRow[]> {
    return this.readArray<DebtWaiverRow>(WAIVERS_FILE, 'waivers');
  }

  async appendWaiver(row: DebtWaiverRow): Promise<boolean> {
    const rows = await this.readWaivers();
    const idx = rows.findIndex((r) => r.subject === row.subject);
    if (idx >= 0) {
      const cur = rows[idx]!;
      if (cur.reason === row.reason && cur.until === row.until && cur.by === row.by) return false; // identical
      rows[idx] = row; // upsert-on-change (key = subject)
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.subject.localeCompare(b.subject));
    await this.writeArray(WAIVERS_FILE, 'waivers', rows);
    return true;
  }
}

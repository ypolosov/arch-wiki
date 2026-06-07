import * as path from 'node:path';
import { FileSystemPort } from '../../application/ports/FileSystemPort';
import {
  IssueLedgerRow,
  LedgerStorePort,
  PageLedgerRow,
} from '../../application/ports/LedgerStorePort';

const ISSUES_FILE = 'created-issues.json';
const PAGES_FILE = 'published-pages.json';
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

  private async readArray<T>(name: string, field: 'issues' | 'pages'): Promise<T[]> {
    const f = this.file(name);
    if (!(await this.fs.exists(f))) return [];
    const parsed = JSON.parse(await this.fs.readFile(f)) as Record<string, unknown>;
    const rows = parsed[field];
    return Array.isArray(rows) ? (rows as T[]) : [];
  }

  private async writeArray(name: string, field: 'issues' | 'pages', rows: unknown[]): Promise<void> {
    await this.fs.writeFile(this.file(name), `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, [field]: rows }, null, 2)}\n`);
  }

  async readIssues(): Promise<IssueLedgerRow[]> {
    return this.readArray<IssueLedgerRow>(ISSUES_FILE, 'issues');
  }

  async appendIssue(row: IssueLedgerRow): Promise<boolean> {
    const rows = await this.readIssues();
    if (rows.some((r) => r.key === row.key && r.sourceId === row.sourceId && r.kind === row.kind && r.role === row.role)) {
      return false;
    }
    rows.push(row);
    rows.sort((a, b) => a.key.localeCompare(b.key));
    await this.writeArray(ISSUES_FILE, 'issues', rows);
    return true;
  }

  async readPages(): Promise<PageLedgerRow[]> {
    return this.readArray<PageLedgerRow>(PAGES_FILE, 'pages');
  }

  async appendPage(row: PageLedgerRow): Promise<boolean> {
    const rows = await this.readPages();
    if (rows.some((r) => r.page === row.page && r.source === row.source)) return false;
    rows.push(row);
    rows.sort((a, b) => a.page.localeCompare(b.page));
    await this.writeArray(PAGES_FILE, 'pages', rows);
    return true;
  }
}

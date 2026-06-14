import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { IssueLedgerRow, PageLedgerRow } from '../../src/application/ports/LedgerStorePort';

async function store(): Promise<FileLedgerStore> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-ledger-'));
  return new FileLedgerStore(dir, new NodeFileSystem());
}

const pageRow = (over: Partial<PageLedgerRow> = {}): PageLedgerRow => ({
  source: 'drivers/QA-001.md',
  page: '123',
  contentHash: 'h1',
  publishedAt: '2026-01-01T00:00:00Z',
  system: 'confluence',
  ...over,
});

const issueRow = (over: Partial<IssueLedgerRow> = {}): IssueLedgerRow => ({
  key: 'GRM-1',
  sourceId: 'QA-001',
  kind: 'arch',
  role: null,
  contentHash: 'h1',
  createdAt: '2026-01-01T00:00:00Z',
  system: 'jira',
  ...over,
});

describe('FileLedgerStore.appendPage (R1 destination-drift baseline refresh)', () => {
  it('no-ops only when BOTH contentHash AND pageVersion match', async () => {
    const s = await store();
    expect(await s.appendPage(pageRow({ pageVersion: 1 }))).toBe(true); // new row
    expect(await s.appendPage(pageRow({ pageVersion: 1 }))).toBe(false); // identical → no-op
  });

  it('refreshes pageVersion when the content is identical but the live version changed (force-republish)', async () => {
    const s = await store();
    await s.appendPage(pageRow({ pageVersion: 1 }));
    // same English content (same hash) but a NEW Confluence version → must persist the new baseline
    expect(await s.appendPage(pageRow({ pageVersion: 2 }))).toBe(true);
    const rows = await s.readPages();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.pageVersion).toBe(2);
  });

  it('upserts on a content-hash change too', async () => {
    const s = await store();
    await s.appendPage(pageRow({ contentHash: 'h1', pageVersion: 1 }));
    expect(await s.appendPage(pageRow({ contentHash: 'h2', pageVersion: 1 }))).toBe(true);
    const rows = await s.readPages();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.contentHash).toBe('h2');
  });

  it('does NOT wipe the baseline when re-recording identical content WITHOUT a pageVersion (review H2)', async () => {
    const s = await store();
    await s.appendPage(pageRow({ contentHash: 'h1', pageVersion: 5 }));
    // pass-2 style re-record: same hash, --page-version omitted → carry the baseline forward, no-op
    const rowNoVer: PageLedgerRow = pageRow({ contentHash: 'h1' });
    delete (rowNoVer as { pageVersion?: number }).pageVersion;
    expect(await s.appendPage(rowNoVer)).toBe(false); // no-op, not a destructive overwrite
    const rows = await s.readPages();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.pageVersion).toBe(5); // baseline preserved → drift guard stays armed
  });

  it('establishes a baseline when a pageVersion is later supplied on a pre-0.8 row (R8)', async () => {
    const s = await store();
    const legacy: PageLedgerRow = pageRow({ contentHash: 'h1' });
    delete (legacy as { pageVersion?: number }).pageVersion;
    await s.appendPage(legacy); // no version yet
    expect(await s.appendPage(pageRow({ contentHash: 'h1', pageVersion: 4 }))).toBe(true);
    expect((await s.readPages())[0]!.pageVersion).toBe(4);
  });
});

describe('FileLedgerStore.appendIssue (B-2 upsert-on-drift)', () => {
  it('no-ops on an identical row; refreshes the hash on drift (same key/source/kind/role)', async () => {
    const s = await store();
    expect(await s.appendIssue(issueRow({ contentHash: 'h1' }))).toBe(true); // new
    expect(await s.appendIssue(issueRow({ contentHash: 'h1' }))).toBe(false); // identical → no-op
    expect(await s.appendIssue(issueRow({ contentHash: 'h2' }))).toBe(true); // drift → rewrite
    const rows = await s.readIssues();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.contentHash).toBe('h2');
  });

  it('treats a different role as a distinct row', async () => {
    const s = await store();
    await s.appendIssue(issueRow({ kind: 'techdesign', role: 'be' }));
    expect(await s.appendIssue(issueRow({ kind: 'techdesign', role: 'fe' }))).toBe(true);
    expect(await s.readIssues()).toHaveLength(2);
  });
});

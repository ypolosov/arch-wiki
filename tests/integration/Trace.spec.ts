import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { trace } from '../../src/application/usecases/Trace';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-tr-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  await sys.writeFile(
    path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
    '---\ntype: quality-attribute\nsource: raw/notes.md\n---\n# QA-001: Latency\n',
  );
  await sys.writeFile(
    path.join(root, 'adrs/0012-caching.md'),
    '---\ntype: adr\nstatus: accepted\n---\n# ADR-0012: Caching\nDrivers: [[QA-001-latency]]\n',
  );
  await sys.writeFile(path.join(root, 'raw/notes.md'), '# notes\n');
  return root;
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return { repo: new FoamWikiRepository(root, sys), ledger: new FileLedgerStore(root, sys) };
}

describe('trace (integration)', () => {
  it('walks provenance, ADR coverage, and ledger issues', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    await d.ledger.appendIssue({
      key: 'GRM-431',
      sourceId: 'QA-001',
      kind: 'arch',
      role: null,
      contentHash: 'abc',
      createdAt: '2026-06-08T00:00:00Z',
      system: 'jira',
    });

    const r = await trace('QA-001', d);
    expect(r.basename).toBe('QA-001-latency');
    expect(r.kind).toBe('quality-attribute');
    expect(r.raw).toEqual([{ raw: 'raw/notes.md', exists: true }]);
    expect(r.adrs).toEqual(['0012-caching']);
    expect(r.issues).toEqual([{ key: 'GRM-431', system: 'jira', stale: false }]);
  });

  it('flags a missing raw source (exists:false) without throwing', async () => {
    const root = await tmpRoot();
    await deps(root).repo.write(
      'drivers/quality-attributes/QA-001-latency.md',
      '---\ntype: quality-attribute\nsource: raw/gone.md\n---\n# QA-001: Latency\n',
    );
    const r = await trace('QA-001', deps(root));
    expect(r.raw).toEqual([{ raw: 'raw/gone.md', exists: false }]);
  });

  it('flags a realized_by key with no ledger row as stale', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    await d.repo.write(
      'drivers/quality-attributes/QA-001-latency.md',
      '---\ntype: quality-attribute\nrealized_by: [GRM-999]\n---\n# QA-001: Latency\n',
    );
    const r = await trace('QA-001', d);
    expect(r.issues).toEqual([{ key: 'GRM-999', system: undefined, stale: true }]);
  });

  it('reports drivers cited by an ADR node', async () => {
    const root = await tmpRoot();
    const r = await trace('ADR-0012', deps(root));
    expect(r.kind).toBe('adr');
    expect(r.drivers).toEqual(['QA-001-latency']);
  });

  it('unresolvable id → exit 2', async () => {
    const root = await tmpRoot();
    await expect(trace('QA-404', deps(root))).rejects.toMatchObject({ exitCode: 2 });
  });
});

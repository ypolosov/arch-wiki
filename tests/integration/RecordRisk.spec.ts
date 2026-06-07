import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { recordRisk } from '../../src/application/usecases/RecordRisk';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';

const hash = (c: string): string => createHash('sha256').update(c).digest('hex');

async function tmpRepo(): Promise<{ root: string; sys: NodeFileSystem; repo: FoamWikiRepository }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-risk-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  return { root, sys, repo: new FoamWikiRepository(root, sys) };
}

const dataRows = (content: string): string[] =>
  content
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.includes('Key') && !l.includes('---'));

describe('recordRisk (integration)', () => {
  it('creates risks.md and is idempotent on the same (source,id,conflict)', async () => {
    const { root, sys, repo } = await tmpRepo();
    const input = {
      source: 'ingest',
      id: 'QA-007',
      conflict: 'conflicting latency targets',
      date: '2026-06-07',
    };

    const r1 = await recordRisk(input, { repo, hash });
    expect(r1.created).toBe(true);
    const content = await sys.readFile(path.join(root, 'risks.md'));
    expect(content).toContain('| Key |');
    expect(content).toContain('conflicting latency targets');
    expect(content).toContain('QA-007');

    const r2 = await recordRisk(input, { repo, hash });
    expect(r2.created).toBe(false);
    expect(r2.key).toBe(r1.key);
    expect(dataRows(await sys.readFile(path.join(root, 'risks.md'))).length).toBe(1);
  });

  it('appends distinct rows; escapes pipes/newlines; em-dash for missing id', async () => {
    const { root, sys, repo } = await tmpRepo();
    await recordRisk(
      { source: 'lint', conflict: 'a | b\nsecond line', date: '2026-06-07' },
      { repo, hash },
    );
    await recordRisk(
      { source: 'lint', id: 'UC-001', conflict: 'another', date: '2026-06-07' },
      { repo, hash },
    );

    const content = await sys.readFile(path.join(root, 'risks.md'));
    expect(dataRows(content).length).toBe(2);
    expect(content).toContain('a \\| b second line');
    // source `lint` with no related id → em-dash in the Related column.
    expect(content).toMatch(/\| lint \| — \|/);
  });

  it('rejects empty source or conflict', async () => {
    const { repo } = await tmpRepo();
    await expect(
      recordRisk({ source: '', conflict: 'x', date: '2026-06-07' }, { repo, hash }),
    ).rejects.toThrow(/source/);
    await expect(
      recordRisk({ source: 'lint', conflict: '   ', date: '2026-06-07' }, { repo, hash }),
    ).rejects.toThrow(/conflict/);
  });
});

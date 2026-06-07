import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { enrichDriver } from '../../src/application/usecases/EnrichDriver';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-en-'));
  const root = path.join(dir, 'docs/architecture');
  await new NodeFileSystem().writeFile(
    path.join(root, 'drivers/quality-attributes/QA-007-caching.md'),
    '---\ntype: quality-attribute\n---\n# QA-007: Caching\n\n## Scenario\nfast reads\n',
  );
  return root;
}

function repoOf(root: string): FoamWikiRepository {
  return new FoamWikiRepository(root, new NodeFileSystem());
}

describe('enrichDriver (integration)', () => {
  it('writes a Related Patterns section with sorted hits', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    const r = await enrichDriver(
      {
        answers: [
          {
            key: 'enrich:QA-007',
            hits: [
              { source: 'arc42.pdf', score: 0.7, excerpt: 'caching tactics' },
              { source: 'ddd.pdf', score: 0.9, excerpt: 'cache aside' },
            ],
          },
        ],
      },
      { repo },
    );
    expect(r.enriched).toEqual([{ driver: 'QA-007', path: 'drivers/quality-attributes/QA-007-caching.md', hits: 2 }]);
    const content = await repo.read('drivers/quality-attributes/QA-007-caching.md');
    expect(content).toContain('## Related Patterns');
    // higher score first
    expect(content.indexOf('ddd.pdf')).toBeLessThan(content.indexOf('arc42.pdf'));
    expect(content).toContain('## Scenario'); // original body preserved
  });

  it('fix #10: zero hits still writes an empty section with the none marker', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await enrichDriver({ answers: [{ key: 'enrich:QA-007', hits: [] }] }, { repo });
    const content = await repo.read('drivers/quality-attributes/QA-007-caching.md');
    expect(content).toContain('## Related Patterns');
    expect(content).toContain('<!-- arch-wiki:enrich none -->');
  });

  it('re-enrich replaces the managed block idempotently', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await enrichDriver({ answers: [{ key: 'enrich:QA-007', hits: [{ source: 'a', score: 0.5, excerpt: 'x' }] }] }, { repo });
    await enrichDriver({ answers: [{ key: 'enrich:QA-007', hits: [{ source: 'b', score: 0.6, excerpt: 'y' }] }] }, { repo });
    const content = await repo.read('drivers/quality-attributes/QA-007-caching.md');
    expect(content).toContain('b ·');
    expect(content).not.toContain('a ·'); // old block replaced, not duplicated
    expect(content.match(/## Related Patterns/g)).toHaveLength(1);
  });

  it('reports an unresolvable driver instead of throwing', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    const r = await enrichDriver({ answers: [{ key: 'enrich:QA-999', hits: [] }] }, { repo });
    expect(r.enriched).toEqual([]);
    expect(r.unresolved).toEqual(['QA-999']);
  });
});

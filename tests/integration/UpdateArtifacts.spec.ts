import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { updateKanban } from '../../src/application/usecases/UpdateKanban';
import { updateUtilityTree } from '../../src/application/usecases/UpdateUtilityTree';
import { updateGapAnalysis } from '../../src/application/usecases/UpdateGapAnalysis';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-upd-'));
  return path.join(dir, 'docs/architecture');
}

function repoOf(root: string): FoamWikiRepository {
  return new FoamWikiRepository(root, new NodeFileSystem());
}

describe('updateKanban (integration)', () => {
  it('adds a card to backlog, then is idempotent on re-add', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    const r1 = await updateKanban({ add: 'QA-007' }, { repo });
    expect(r1.created).toBe(true);
    expect(r1.column).toBe('backlog');
    const c1 = await repo.read('kanban.md');

    const r2 = await updateKanban({ add: 'QA-007' }, { repo });
    expect(r2.changed).toBe(false);
    expect(await repo.read('kanban.md')).toBe(c1); // byte-identical (no auto-move)
  });

  it('an explicit --column moves an existing card', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await updateKanban({ add: 'UC-001' }, { repo });
    const r = await updateKanban({ add: 'UC-001', column: 'in-progress' }, { repo });
    expect(r.changed).toBe(true);
    const content = await repo.read('kanban.md');
    expect(content).toContain('| [[UC-001]] | in-progress |');
    expect(content).not.toContain('| [[UC-001]] | backlog |');
  });

  it('rejects an invalid column', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await expect(
      updateKanban({ add: 'X', column: 'nope' as never }, { repo }),
    ).rejects.toMatchObject({ exitCode: 1 });
  });
});

describe('updateUtilityTree (integration)', () => {
  it('upserts a keyed row idempotently', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await updateUtilityTree({ from: 'QA-003', scenario: 'p99 < 200ms', priority: 'H' }, { repo });
    const c1 = await repo.read('utility-tree.md');
    expect(c1).toContain('| [[QA-003]] | p99 < 200ms | H |');

    const r2 = await updateUtilityTree({ from: 'QA-003', scenario: 'p99 < 200ms', priority: 'H' }, { repo });
    expect(r2.changed).toBe(false);
    expect(await repo.read('utility-tree.md')).toBe(c1);
  });

  it('renders a placeholder for an unknown id and escapes pipes', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await updateUtilityTree({ from: 'QA-999', scenario: 'a | b' }, { repo });
    const content = await repo.read('utility-tree.md');
    expect(content).toContain('[[QA-999]]');
    expect(content).toContain('a \\| b');
  });
});

describe('updateGapAnalysis (integration)', () => {
  it('regenerates the managed region and preserves human notes', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await updateGapAnalysis(
      { gaps: [{ driver: 'QA-007-x', reason: 'not covered by any ADR or iteration' }] },
      { repo },
    );
    // Human appends a note outside the markers.
    const withNote = `${await repo.read('gap-analysis.md')}\n## My notes\nkeep me\n`;
    await repo.write('gap-analysis.md', withNote);

    await updateGapAnalysis(
      { gaps: [{ driver: 'QA-008-y', reason: 'not covered by any ADR or iteration' }] },
      { repo },
    );
    const content = await repo.read('gap-analysis.md');
    expect(content).toContain('[[QA-008-y]]');
    expect(content).not.toContain('[[QA-007-x]]'); // old gap regenerated away
    expect(content).toContain('keep me'); // human note survives
  });

  it('empty gaps yield an empty region, not a deleted file', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await updateGapAnalysis({ gaps: [{ driver: 'QA-1', reason: 'x' }] }, { repo });
    const r = await updateGapAnalysis({ gaps: [] }, { repo });
    expect(r.gapCount).toBe(0);
    const content = await repo.read('gap-analysis.md');
    expect(content).toContain('<!-- arch-wiki:gaps:start -->\n<!-- arch-wiki:gaps:end -->');
    expect(await repo.exists('gap-analysis.md')).toBe(true);
  });
});

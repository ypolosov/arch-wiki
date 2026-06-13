import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';
import { ProjectConfigSchema } from '../../src/domain/model/ProjectConfigSchema';
import { renderStoryPullPlan } from '../../src/application/usecases/RenderStoryPullPlan';
import { recordStorySnapshot } from '../../src/application/usecases/RecordStorySnapshot';
import { pruneStorySnapshots } from '../../src/application/usecases/PruneStorySnapshots';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const clock = { now: () => new Date('2026-06-08T00:00:00Z') };

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-ps-'));
  return path.join(dir, 'docs/architecture');
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return {
    repo: new FoamWikiRepository(root, sys),
    ledger: new FileLedgerStore(root, sys),
    clock,
    hash: sha256,
    frontmatter: new GrayMatterParser(),
  };
}

const CONFIG = ProjectConfig.from(
  ProjectConfigSchema.parse({
    integrations: { upstream: { userStoryLog: { cloudId: 'cid-1', pageId: '16121885' } } },
  }),
);

describe('CAP-1 pull-stories ingress (integration)', () => {
  it('renderStoryPullPlan emits the plan from config; absent config → exit 2', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const plan = await renderStoryPullPlan({ config: CONFIG, ledger: d.ledger });
    expect(plan).toMatchObject({ cloudId: 'cid-1', rootPageId: '16121885', childTitlePrefix: 'Story:' });
    expect(plan.alreadyPulled).toEqual([]);

    await expect(
      renderStoryPullPlan({ config: ProjectConfig.from(null), ledger: d.ledger }),
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it('records a read-only snapshot under raw/_synced with provenance; re-pull is a no-op; drift rewrites', async () => {
    const root = await tmpRoot();
    const d = deps(root);

    const first = await recordStorySnapshot(
      { pageId: '777', title: 'Brand Login', version: 3, body: 'As a user I can log in.\n' },
      d,
    );
    expect(first.relPath).toBe('raw/_synced/user-story-log/777-brand-login.md');
    expect(first.written).toBe(true);
    expect(first.drifted).toBe(false);

    const file = await fs.readFile(path.join(root, first.relPath), 'utf8');
    expect(file).toContain('source: confluence');
    expect(file).toContain('pageId:'); // provenance frontmatter
    expect(file).toContain('As a user I can log in.');

    const rows = await d.ledger.readPulled();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.pageId).toBe('777');

    // Identical re-pull → no-op.
    const again = await recordStorySnapshot(
      { pageId: '777', title: 'Brand Login', version: 3, body: 'As a user I can log in.\n' },
      d,
    );
    expect(again.written).toBe(false);
    expect(again.drifted).toBe(false);

    // Changed body → drift, rewrite, single ledger row (upsert by pageId).
    const drifted = await recordStorySnapshot(
      { pageId: '777', title: 'Brand Login', version: 4, body: 'As a user I can log in with OTP.\n' },
      d,
    );
    expect(drifted.written).toBe(true);
    expect(drifted.drifted).toBe(true);
    expect((await d.ledger.readPulled())).toHaveLength(1);
  });

  it('a renamed story (new slug) drops the stale snapshot file', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const a = await recordStorySnapshot({ pageId: '5', title: 'Old Name', version: 1, body: 'x\n' }, d);
    const b = await recordStorySnapshot({ pageId: '5', title: 'New Name', version: 2, body: 'x\n' }, d);
    expect(a.relPath).not.toBe(b.relPath);
    await expect(fs.access(path.join(root, a.relPath))).rejects.toBeTruthy(); // old gone
    await expect(fs.access(path.join(root, b.relPath))).resolves.toBeUndefined();
  });

  it('rejects an empty body (exit 2)', async () => {
    const root = await tmpRoot();
    await expect(
      recordStorySnapshot({ pageId: '9', title: 'Empty', version: 1, body: '   \n' }, deps(root)),
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it('prune-stories plans by default (lists orphans, deletes nothing); --commit deletes', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const keep = await recordStorySnapshot({ pageId: 'A', title: 'Keep', version: 1, body: 'a\n' }, d);
    const drop = await recordStorySnapshot({ pageId: 'B', title: 'Drop', version: 1, body: 'b\n' }, d);

    // Plan (default): orphan B is listed but neither the file nor the ledger row is touched.
    const plan = await pruneStorySnapshots(['A'], d);
    expect(plan.committed).toBe(false);
    expect(plan.pruned).toEqual([{ pageId: 'B', relPath: drop.relPath }]);
    expect((await d.ledger.readPulled()).map((r) => r.pageId)).toEqual(['A', 'B']);
    await expect(fs.access(path.join(root, drop.relPath))).resolves.toBeUndefined();

    // Commit: now B's snapshot + ledger row are removed; A is untouched.
    const res = await pruneStorySnapshots(['A'], d, { commit: true });
    expect(res.committed).toBe(true);
    expect(res.pruned).toEqual([{ pageId: 'B', relPath: drop.relPath }]);
    expect((await d.ledger.readPulled()).map((r) => r.pageId)).toEqual(['A']);
    await expect(fs.access(path.join(root, drop.relPath))).rejects.toBeTruthy();
    await expect(fs.access(path.join(root, keep.relPath))).resolves.toBeUndefined();
  });
});

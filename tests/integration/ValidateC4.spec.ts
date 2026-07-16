import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { validateC4 } from '../../src/application/usecases/ValidateC4';
import { C4ConsistencyPolicy, C4Model } from '../../src/domain/services/C4Consistency';

const POLICY: C4ConsistencyPolicy = {
  requireDocumentation: ['system', 'container'],
  severity: 'medium',
  ignore: [],
};

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-c4-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  await sys.writeFile(path.join(root, 'entities/backend.md'), '---\ntype: entity\n---\n# Backend\n');
  return root;
}

function repoOf(root: string): FoamWikiRepository {
  return new FoamWikiRepository(root, new NodeFileSystem());
}

const MODEL: C4Model = {
  elements: [
    { id: 'cloud.backend', kind: 'container', title: 'Backend' }, // matches entities/backend.md
    { id: 'cloud.db', kind: 'container', title: 'Database' }, // undocumented
  ],
};

describe('validateC4 (integration)', () => {
  it('reports a required-kind element with no wiki entity; matched element is clean', async () => {
    const repo = repoOf(await tmpRoot());
    const report = await validateC4(MODEL, repo, { policy: POLICY });
    expect(report.elementCount).toBe(2);
    expect(report.entityCount).toBe(1);
    expect(report.findings.map((f) => f.rule)).toEqual(['c4-element-without-wiki-entity']);
    expect(report.findings[0]!.message).toContain('"cloud.db"');
    expect(report.counts.medium).toBe(1);
  });

  it('--establish-baseline writes c4-baseline.json and suppresses those mismatches; only delta is reported', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);

    const est = await validateC4(MODEL, repo, { policy: POLICY, establishBaseline: true });
    expect(est.findings).toEqual([]);
    expect(est.baselineEstablished).toBe(1);
    const baseline = JSON.parse(
      await fs.readFile(path.join(root, '.arch-wiki/c4-baseline.json'), 'utf8'),
    );
    expect(Array.isArray(baseline)).toBe(true);
    expect(baseline.length).toBe(1);

    // Re-run with the same model → baselined mismatch is suppressed.
    const after = await validateC4(MODEL, repo, { policy: POLICY });
    expect(after.findings).toEqual([]);

    // A NEW mismatch beyond the baseline IS reported (delta-only).
    const grown: C4Model = { elements: [...MODEL.elements, { id: 'cloud.cache', kind: 'container', title: 'Cache' }] };
    const delta = await validateC4(grown, repo, { policy: POLICY });
    expect(delta.findings.map((f) => f.message)).toEqual([
      expect.stringContaining('"cloud.cache"'),
    ]);
  });

  it('severity filter drops findings below the threshold', async () => {
    const repo = repoOf(await tmpRoot());
    const report = await validateC4(MODEL, repo, { policy: POLICY, severity: 'high' });
    expect(report.findings).toEqual([]); // the only finding is medium
  });

  describe('arc42 ⟷ view correspondence gate', () => {
    async function rootWithHub(hubBody: string): Promise<string> {
      const root = await tmpRoot();
      await new NodeFileSystem().writeFile(
        path.join(root, 'arc42/05-building-block-view.md'),
        `---\ntype: arc42\ntags:\n  - arc42\n  - c4\n---\n\n# arc42 §5\n\n${hubBody}\n`,
      );
      return root;
    }

    it('flags a hub showing a view the model does not define', async () => {
      const repo = repoOf(await rootWithHub('- Containers: `view ghost`'));
      const model: C4Model = { elements: [], views: [{ id: 'containers', title: 'C', elementIds: [] }] };
      const report = await validateC4(model, repo, { policy: { ...POLICY, requireDocumentation: [] } });
      const missing = report.findings.filter((f) => f.rule === 'c4-view-missing');
      expect(missing).toHaveLength(1);
      expect(missing[0]!.message).toContain('ghost');
      expect(missing[0]!.file).toBe('arc42/05-building-block-view.md');
    });

    it('is silent when the promised view resolves', async () => {
      const repo = repoOf(await rootWithHub('- Containers: `view containers`'));
      const model: C4Model = { elements: [], views: [{ id: 'containers', title: 'C', elementIds: [] }] };
      const report = await validateC4(model, repo, { policy: { ...POLICY, requireDocumentation: [] } });
      expect(report.findings.filter((f) => f.rule === 'c4-view-missing')).toEqual([]);
    });

    it('skips entirely when the model carries no views (skip-safely)', async () => {
      const repo = repoOf(await rootWithHub('- Containers: `view ghost`'));
      const report = await validateC4({ elements: [] }, repo, { policy: { ...POLICY, requireDocumentation: [] } });
      expect(report.findings.filter((f) => f.rule === 'c4-view-missing')).toEqual([]);
      expect(report.viewCount).toBeNull();
    });
  });
});

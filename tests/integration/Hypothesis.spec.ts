import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { PluginTemplateStore } from '../../src/adapters/template/PluginTemplateStore';
import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';
import { scaffoldArtifact } from '../../src/application/usecases/ScaffoldArtifact';
import { scaffoldHypothesis } from '../../src/application/usecases/ScaffoldHypothesis';
import { lintWiki } from '../../src/application/usecases/LintWiki';
import { ARTIFACT_SPECS } from '../../src/domain/model/ArtifactType';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';

const TEMPLATES = path.resolve(__dirname, '../../templates');
const clock = { now: () => new Date('2026-06-07T00:00:00Z') };

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-hyp-'));
  return path.join(dir, 'docs/architecture');
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return {
    repo: new FoamWikiRepository(root, sys),
    templates: new PluginTemplateStore(TEMPLATES, sys),
    clock,
    config: ProjectConfig.from(null),
    frontmatter: new GrayMatterParser(),
  };
}

describe('scaffoldHypothesis (integration)', () => {
  it('writes traceability frontmatter and a hypothesis- filename', async () => {
    const root = await tmpRoot();
    const r = await scaffoldHypothesis(
      { title: 'Edge Caching', driverCandidate: 'QA-007' },
      deps(root),
    );
    expect(r.path).toBe('concepts/hypothesis-edge-caching.md');
    expect(r.kanbanCard).toBe('hypothesis-edge-caching');
    const content = await fs.readFile(path.join(root, r.path), 'utf8');
    expect(content).toContain('status: hypothesis');
    expect(content).toContain('realizes_driver:');
    expect(content).toContain('QA-007');
  });

  it('fix #2: a kanban-linked hypothesis is NOT an orphan, unlike a bare concept', async () => {
    // Control: a bare concept scaffold (no kanban) is an orphan.
    const rootA = await tmpRoot();
    const dA = deps(rootA);
    const bare = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['concept'], title: 'Bare Idea', frontmatter: { status: 'hypothesis' } },
      dA,
    );
    const repA = await lintWiki(dA.repo);
    expect(
      repA.findings.some((f) => f.rule === 'orphan' && f.file === bare.path),
    ).toBe(true);

    // scaffoldHypothesis auto-adds the kanban card → inbound link → not an orphan.
    const rootB = await tmpRoot();
    const dB = deps(rootB);
    const hyp = await scaffoldHypothesis({ title: 'Linked Idea' }, dB);
    const repB = await lintWiki(dB.repo);
    expect(
      repB.findings.some((f) => f.rule === 'orphan' && f.file === hyp.path),
    ).toBe(false);
  });

  it('rejects a --from that does not exist (exit 2)', async () => {
    const root = await tmpRoot();
    await expect(
      scaffoldHypothesis({ title: 'X', from: 'raw/missing.md' }, deps(root)),
    ).rejects.toMatchObject({ exitCode: 2 });
  });
});

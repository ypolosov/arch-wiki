import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FilePayloadTemplateStore } from '../../src/adapters/template/FilePayloadTemplateStore';
import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';
import { scaffoldQuestionnaire } from '../../src/application/usecases/ScaffoldQuestionnaire';

const PAYLOADS = path.resolve(__dirname, '../../templates/payloads');
const clock = { now: () => new Date('2026-06-08T00:00:00Z') };

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-q-'));
  return path.join(dir, 'docs/architecture');
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return {
    repo: new FoamWikiRepository(root, sys),
    payloads: new FilePayloadTemplateStore(PAYLOADS, sys),
    clock,
    frontmatter: new GrayMatterParser(),
  };
}

describe('scaffoldQuestionnaire (integration)', () => {
  it('writes a dated QAW skeleton into raw/questionnaires with traceability frontmatter', async () => {
    const root = await tmpRoot();
    const r = await scaffoldQuestionnaire(
      { method: 'qaw', topic: 'Checkout Latency', relatedDrivers: ['QA-003'] },
      deps(root),
    );
    expect(r.path).toBe('raw/questionnaires/qaw-2026-06-08-checkout-latency.md');
    const content = await fs.readFile(path.join(root, r.path), 'utf8');
    expect(content).toContain('method: qaw');
    expect(content).toContain('status: open');
    expect(content).toContain('related_drivers:');
    expect(content).toContain('QA-003');
    expect(content).toContain('# Опросник QAW: Checkout Latency'); // RU template body
    expect(content).toContain('[[QA-003]]'); // rendered token
  });

  it('rejects an unknown method (exit 1)', async () => {
    const root = await tmpRoot();
    await expect(
      scaffoldQuestionnaire({ method: 'bogus' as never, topic: 'X' }, deps(root)),
    ).rejects.toMatchObject({ exitCode: 1 });
  });

  it('rejects re-scaffolding the same questionnaire (exit 2)', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    await scaffoldQuestionnaire({ method: 'rozanski', topic: 'Data Flows' }, d);
    await expect(
      scaffoldQuestionnaire({ method: 'rozanski', topic: 'Data Flows' }, d),
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it('requires an explicit slug for a non-latin topic (exit 1)', async () => {
    const root = await tmpRoot();
    await expect(
      scaffoldQuestionnaire({ method: 'qaw', topic: 'Латентность' }, deps(root)),
    ).rejects.toMatchObject({ exitCode: 1 });
    // …and succeeds when one is supplied.
    const r = await scaffoldQuestionnaire(
      { method: 'qaw', topic: 'Латентность', slug: 'latency' },
      deps(root),
    );
    expect(r.path).toBe('raw/questionnaires/qaw-2026-06-08-latency.md');
  });
});

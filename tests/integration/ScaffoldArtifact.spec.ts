import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { scaffoldArtifact } from '../../src/application/usecases/ScaffoldArtifact';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { PluginTemplateStore } from '../../src/adapters/template/PluginTemplateStore';
import { ARTIFACT_SPECS } from '../../src/domain/model/ArtifactType';

const TEMPLATES = path.resolve(__dirname, '../../templates');
const clock = { now: () => new Date('2026-06-07T00:00:00Z') };

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-int-'));
  return path.join(dir, 'docs/architecture');
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return {
    sys,
    repo: new FoamWikiRepository(root, sys),
    templates: new PluginTemplateStore(TEMPLATES, sys),
    clock,
  };
}

describe('scaffoldArtifact (integration)', () => {
  it('creates a QA driver and increments the id', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const r1 = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['quality-attribute'], title: 'API Response Time' },
      d,
    );
    expect(r1.id).toBe('QA-001');
    expect(r1.path).toBe('drivers/quality-attributes/QA-001-api-response-time.md');
    const content = await fs.readFile(path.join(root, r1.path), 'utf8');
    expect(content).toContain('type: quality-attribute');
    expect(content).toContain('# QA-001: API Response Time');

    const r2 = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['quality-attribute'], title: 'Second' },
      d,
    );
    expect(r2.id).toBe('QA-002');
  });

  it('wires drivers and backlinks the hub when present', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    await scaffoldArtifact({ spec: ARTIFACT_SPECS['quality-attribute'], title: 'Latency' }, d);
    await d.sys.writeFile(
      path.join(root, 'arc42/09-architecture-decisions.md'),
      '# Architecture Decisions\n',
    );

    const adr = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['adr'], title: 'Use Kafka', drivers: ['QA-001'] },
      d,
    );
    expect(adr.id).toBe('ADR-0001');
    expect(adr.path).toBe('adrs/0001-use-kafka.md');
    expect(adr.wired).toEqual(['QA-001']);
    expect(adr.hubUpdated).toBe(true);

    const adrContent = await fs.readFile(path.join(root, adr.path), 'utf8');
    expect(adrContent).toContain('[[QA-001-latency|QA-001]]');
    const hub = await fs.readFile(path.join(root, 'arc42/09-architecture-decisions.md'), 'utf8');
    expect(hub).toContain('[[0001-use-kafka|ADR-0001 · Use Kafka]]');
  });

  it('records unresolved drivers as placeholders', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const r = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['adr'], title: 'Lonely', drivers: ['QA-999'] },
      d,
    );
    expect(r.unresolvedDrivers).toEqual(['QA-999']);
    const content = await fs.readFile(path.join(root, r.path), 'utf8');
    expect(content).toContain('[[QA-999]]');
  });

  it('dry-run does not write a file', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const r = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['adr'], title: 'Dry', dryRun: true },
      d,
    );
    expect(r.created).toBe(false);
    expect(await d.sys.exists(path.join(root, r.path))).toBe(false);
  });
});

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { scaffoldArtifact } from '../../src/application/usecases/ScaffoldArtifact';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { PluginTemplateStore } from '../../src/adapters/template/PluginTemplateStore';
import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';
import { ARTIFACT_SPECS } from '../../src/domain/model/ArtifactType';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';

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
    config: ProjectConfig.from(null),
    frontmatter: new GrayMatterParser(),
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

  it('injects typed frontmatter over the template YAML (§4.0)', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const r = await scaffoldArtifact(
      {
        spec: ARTIFACT_SPECS['concept'],
        title: 'Edge Caching',
        frontmatter: { status: 'hypothesis', source: 'raw/notes.md', realizes_driver: ['QA-007'] },
      },
      d,
    );
    const content = await fs.readFile(path.join(root, r.path), 'utf8');
    expect(content).toContain('status: hypothesis');
    expect(content).toContain('source: raw/notes.md');
    expect(content).toContain('realizes_driver:');
    expect(content).toContain('QA-007');
    expect(content).toContain('type: concept'); // template field preserved
    expect(content).toContain('# Edge Caching'); // body intact
  });

  it('input frontmatter overrides a template field; key order is stable', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const r = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['adr'], title: 'Override', frontmatter: { status: 'accepted' } },
      d,
    );
    const content = await fs.readFile(path.join(root, r.path), 'utf8');
    // adr template ships `status: proposed`; input wins.
    expect(content).toContain('status: accepted');
    expect(content).not.toContain('status: proposed');
    // Sorted keys: status before tags before type.
    const fmIdx = (k: string) => content.indexOf(k);
    expect(fmIdx('status:')).toBeLessThan(fmIdx('type:'));
  });

  it('slugPrefix forces a prefixed filename stem', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const r = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['concept'], title: 'Edge Caching', slugPrefix: 'hypothesis' },
      d,
    );
    expect(r.path).toBe('concepts/hypothesis-edge-caching.md');
  });

  it('empty frontmatter leaves the page byte-identical to a plain scaffold', async () => {
    const rootA = await tmpRoot();
    const rootB = await tmpRoot();
    const a = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['adr'], title: 'Same' },
      deps(rootA),
    );
    const b = await scaffoldArtifact(
      { spec: ARTIFACT_SPECS['adr'], title: 'Same', frontmatter: {} },
      deps(rootB),
    );
    const ca = await fs.readFile(path.join(rootA, a.path), 'utf8');
    const cb = await fs.readFile(path.join(rootB, b.path), 'utf8');
    expect(cb).toBe(ca);
  });
});

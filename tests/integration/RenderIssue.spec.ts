import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FilePayloadTemplateStore } from '../../src/adapters/template/FilePayloadTemplateStore';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';
import { renderIssuePayload } from '../../src/application/usecases/RenderIssuePayload';
import { recordIssue } from '../../src/application/usecases/RecordIssue';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';
import { ProjectConfigSchema } from '../../src/domain/model/ProjectConfigSchema';

const PAYLOADS = path.resolve(__dirname, '../../templates/payloads');
const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const clock = { now: () => new Date('2026-06-08T00:00:00Z') };

const CONFIG = ProjectConfig.from(
  ProjectConfigSchema.parse({
    tasks: {
      language: 'ru',
      prefixes: { arch: '[Arch]', techdesign: '[Techdesign]' },
      rolePrefixes: { be: '[BE][Techdesign]', fe: '[FE][Techdesign]', do: '[DO][Techdesign]' },
    },
  }),
);

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-ri-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  await sys.writeFile(
    path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
    '---\ntype: quality-attribute\n---\n# QA-001: Latency\n',
  );
  return root;
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return {
    repo: new FoamWikiRepository(root, sys),
    payloads: new FilePayloadTemplateStore(PAYLOADS, sys),
    config: CONFIG,
    ledger: new FileLedgerStore(root, sys),
    hash: sha256,
  };
}

describe('renderIssuePayload + recordIssue (integration)', () => {
  it('renders an arch IntentEnvelope with prefix from ProjectConfig', async () => {
    const root = await tmpRoot();
    const env = await renderIssuePayload({ from: 'QA-001', kind: 'arch' }, deps(root));
    expect(env.alreadyCreated).toBe(false);
    expect(env.prefix).toBe('[Arch]');
    expect(env.title).toBe('Latency');
    expect(env.issueTitle).toBe('[Arch] Latency');
    // Variant B: the payload is a self-contained skeleton (no wiki ids/links); the
    // command's map step inlines artifact excerpts. Core still carries the ref in `drivers`.
    expect(env.payload).toContain('[Arch] Latency');
    expect(env.drivers).toEqual(['[[QA-001-latency|QA-001]]']);
    expect(env.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('records the issue (ledger + realized_by), then re-render is a no-op (drifted:false)', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const env = await renderIssuePayload({ from: 'QA-001', kind: 'arch' }, d);
    const rec = await recordIssue(
      { id: 'QA-001', key: 'GRM-431', kind: 'arch', hash: env.contentHash },
      { repo: d.repo, ledger: d.ledger, frontmatter: new GrayMatterParser(), clock },
    );
    expect(rec.ledgerAppended).toBe(true);
    expect(rec.frontmatterUpdated).toBe(true);
    const driver = await fs.readFile(path.join(root, 'drivers/quality-attributes/QA-001-latency.md'), 'utf8');
    expect(driver).toContain('GRM-431');

    const again = await renderIssuePayload({ from: 'QA-001', kind: 'arch' }, d);
    expect(again.alreadyCreated).toBe(true);
    expect(again.drifted).toBe(false);
    expect(again.key).toBe('GRM-431');
  });

  it('drift after editing the driver → alreadyCreated:true, drifted:true, NO new ledger row', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const env = await renderIssuePayload({ from: 'QA-001', kind: 'arch' }, d);
    await recordIssue(
      { id: 'QA-001', key: 'GRM-431', kind: 'arch', hash: env.contentHash },
      { repo: d.repo, ledger: d.ledger, frontmatter: new GrayMatterParser(), clock },
    );
    // Edit the driver heading → title changes → hash drifts.
    await d.repo.write('drivers/quality-attributes/QA-001-latency.md', '---\ntype: quality-attribute\n---\n# QA-001: Tail Latency\n');
    const drifted = await renderIssuePayload({ from: 'QA-001', kind: 'arch' }, d);
    expect(drifted.alreadyCreated).toBe(true);
    expect(drifted.drifted).toBe(true);
    expect((await d.ledger.readIssues()).length).toBe(1); // no duplicate row
  });

  it('techdesign requires a role (exit 1)', async () => {
    const root = await tmpRoot();
    await expect(
      renderIssuePayload({ from: 'QA-001', kind: 'techdesign' }, deps(root)),
    ).rejects.toMatchObject({ exitCode: 1 });
  });

  it('techdesign --role be picks the role prefix', async () => {
    const root = await tmpRoot();
    const env = await renderIssuePayload({ from: 'QA-001', kind: 'techdesign', role: 'be' }, deps(root));
    expect(env.prefix).toBe('[BE][Techdesign]');
    expect(env.issueTitle).toBe('[BE][Techdesign] Latency');
  });

  it('unresolvable --from → exit 2', async () => {
    const root = await tmpRoot();
    await expect(
      renderIssuePayload({ from: 'QA-999', kind: 'arch' }, deps(root)),
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it('a project without [tasks] config fails fast (exit 2, no RU default in code)', async () => {
    const root = await tmpRoot();
    const d = { ...deps(root), config: ProjectConfig.from(null) };
    await expect(renderIssuePayload({ from: 'QA-001', kind: 'arch' }, d)).rejects.toMatchObject({
      exitCode: 2,
    });
  });
});

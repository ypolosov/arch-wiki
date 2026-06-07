import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { syncTemplates } from '../../src/application/usecases/SyncTemplates';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { PluginTemplateStore } from '../../src/adapters/template/PluginTemplateStore';

const hash = (c: string): string => createHash('sha256').update(c).digest('hex');

async function setup(): Promise<{
  root: string;
  tdir: string;
  sys: NodeFileSystem;
  repo: FoamWikiRepository;
  templates: PluginTemplateStore;
}> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-sync-'));
  const root = path.join(dir, 'docs/architecture');
  const tdir = path.join(dir, 'plugin-templates');
  const sys = new NodeFileSystem();
  await sys.writeFile(path.join(tdir, 'adr.md'), '# {{id}}: {{title}}\nbody\n');
  await sys.writeFile(path.join(tdir, 'use-case.md'), '# UC\nuse case body\n');
  const repo = new FoamWikiRepository(root, sys);
  const templates = new PluginTemplateStore(tdir, sys);
  return { root, tdir, sys, repo, templates };
}

const foam = (root: string, name: string): string =>
  path.join(root, '.foam/templates', name);

describe('syncTemplates (integration)', () => {
  it('check mode reports everything missing and writes nothing', async () => {
    const { repo, templates, root, sys } = await setup();
    const r = await syncTemplates({ write: false }, { repo, templates, hash });
    expect(r.counts.missing).toBe(2);
    expect(r.actionable).toBe(2);
    expect(r.wrote).toEqual([]);
    expect(await sys.exists(foam(root, 'adr.md'))).toBe(false);
  });

  it('force creates missing templates with a marker, then is idempotent', async () => {
    const { repo, templates, root, sys } = await setup();
    const first = await syncTemplates({ write: true }, { repo, templates, hash });
    expect(first.wrote.sort()).toEqual([
      '.foam/templates/adr.md',
      '.foam/templates/use-case.md',
    ]);
    expect(await sys.readFile(foam(root, 'adr.md'))).toContain('<!-- arch-wiki:template sha256=');

    const second = await syncTemplates({ write: false }, { repo, templates, hash });
    expect(second.counts.synced).toBe(2);
    expect(second.actionable).toBe(0);
  });

  it('never overwrites a curated (unmarked) template, even with --force', async () => {
    const { repo, templates, root, sys } = await setup();
    const curated = '# my own adr template\n';
    await sys.writeFile(foam(root, 'adr.md'), curated);

    const r = await syncTemplates({ write: true }, { repo, templates, hash });
    expect(r.counts.curated).toBe(1);
    expect(r.wrote).toEqual(['.foam/templates/use-case.md']);
    expect(await sys.readFile(foam(root, 'adr.md'))).toBe(curated);
  });

  it('updates a stale managed template and backs up the old copy', async () => {
    const { repo, templates, tdir, root, sys } = await setup();
    await syncTemplates({ write: true }, { repo, templates, hash });
    const old = await sys.readFile(foam(root, 'adr.md'));

    // The plugin default changes → the embedded marker hash no longer matches.
    await sys.writeFile(path.join(tdir, 'adr.md'), '# {{id}}: {{title}}\nNEW body\n');
    const r = await syncTemplates({ write: true }, { repo, templates, hash });

    const adr = r.entries.find((e) => e.name === 'adr.md')!;
    expect(adr.status).toBe('stale');
    expect(adr.wrote).toBe(true);
    expect(adr.backedUp).toBe('.foam/templates/adr.md.bak');
    expect(await sys.readFile(foam(root, 'adr.md.bak'))).toBe(old);
    expect(await sys.readFile(foam(root, 'adr.md'))).toContain('NEW body');
  });
});

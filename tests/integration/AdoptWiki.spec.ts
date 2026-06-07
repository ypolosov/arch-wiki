import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { applyMigration } from '../../src/application/usecases/Migrate';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FileVersionStore } from '../../src/adapters/version/FileVersionStore';
import { lintWiki } from '../../src/application/usecases/LintWiki';
import { MigrationContext } from '../../src/migrations/types';

async function seedWiki(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-adopt-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  await sys.writeFile(path.join(root, '.foam/templates/adr.md'), '# custom adr template\n');
  await sys.writeFile(
    path.join(root, 'adrs/0001-x.md'),
    '---\ntype: adr\nstatus: accepted\n---\n# ADR-0001: X\n',
  );
  await sys.writeFile(path.join(root, 'raw/notes.md'), '# raw notes\n');
  return root;
}

function ctxFor(root: string): MigrationContext {
  const sys = new NodeFileSystem();
  const repo = new FoamWikiRepository(root, sys);
  return {
    abs: (rel) => path.join(root, rel),
    fs: sys,
    lint: async () => (await lintWiki(repo)).findings,
    hash: (c) => createHash('sha256').update(c).digest('hex'),
    now: () => new Date('2026-06-07T00:00:00Z'),
  };
}

describe('adopt / migrate (integration)', () => {
  it('adopts an existing wiki without touching its content', async () => {
    const root = await seedWiki();
    const before = await new NodeFileSystem().walk(root);

    const store = new FileVersionStore(root, new NodeFileSystem());
    const result = await applyMigration(store, ctxFor(root), { pluginVersion: '0.2.0' });

    expect(result.from).toBe(0);
    expect(result.to).toBe(1);
    expect(result.applied.map((a) => a.to)).toEqual([1]);

    const marker = await store.read();
    expect(marker?.schemaVersion).toBe(1);
    expect(marker?.pluginVersion).toBe('0.2.0');

    const snapshot = JSON.parse(
      await fs.readFile(path.join(root, '.arch-wiki/template-snapshot.json'), 'utf8'),
    );
    expect(Object.keys(snapshot)).toEqual(['adr.md']);

    const baseline = JSON.parse(
      await fs.readFile(path.join(root, '.arch-wiki/lint-baseline.json'), 'utf8'),
    );
    expect(Array.isArray(baseline)).toBe(true);

    // Only .arch-wiki/* files were added; existing content is untouched.
    const after = await new NodeFileSystem().walk(root);
    const added = after.filter((f) => !before.includes(f)).map((f) => path.relative(root, f));
    expect(added.sort()).toEqual(
      ['.arch-wiki/lint-baseline.json', '.arch-wiki/template-snapshot.json', '.arch-wiki/version.json'].sort(),
    );
  });

  it('is idempotent: a second run at the same version applies nothing', async () => {
    const root = await seedWiki();
    const store = new FileVersionStore(root, new NodeFileSystem());
    await applyMigration(store, ctxFor(root), { pluginVersion: '0.2.0' });
    const second = await applyMigration(store, ctxFor(root), { pluginVersion: '0.2.0' });
    expect(second.from).toBe(1);
    expect(second.applied).toEqual([]);
  });
});

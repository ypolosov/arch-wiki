import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { FileProjectConfigStore } from '../../src/adapters/config/FileProjectConfigStore';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { migration0002 } from '../../src/migrations/0002-introduce-project-config/up';
import { MigrationContext } from '../../src/migrations/types';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-cfg-'));
  return path.join(dir, 'docs/architecture');
}

const write = (root: string, content: string) =>
  new NodeFileSystem().writeFile(path.join(root, '.arch-wiki/config.json'), content);

describe('FileProjectConfigStore (integration)', () => {
  it('absent config → null (agnostic defaults apply)', async () => {
    const store = new FileProjectConfigStore(await tmpRoot(), new NodeFileSystem());
    expect(await store.read()).toBeNull();
  });

  it('malformed JSON → DomainError exit 2', async () => {
    const root = await tmpRoot();
    await write(root, '{ not json');
    const store = new FileProjectConfigStore(root, new NodeFileSystem());
    await expect(store.read()).rejects.toMatchObject({ exitCode: 2 });
  });

  it('invalid schema (unknown key, strict) → exit 2', async () => {
    const root = await tmpRoot();
    await write(root, JSON.stringify({ arc42map: { adr: 'x.md' } })); // typo: arc42map
    const store = new FileProjectConfigStore(root, new NodeFileSystem());
    await expect(store.read()).rejects.toMatchObject({ exitCode: 2 });
  });

  it('valid config → parsed with zod defaults', async () => {
    const root = await tmpRoot();
    await write(
      root,
      JSON.stringify({ requiredSections: { 'quality-attribute': [{ marker: 'C4 elements' }] } }),
    );
    const store = new FileProjectConfigStore(root, new NodeFileSystem());
    const cfg = await store.read();
    expect(cfg?.requiredSections?.['quality-attribute']?.[0]).toEqual({
      marker: 'C4 elements',
      minWikilinks: 0,
      severity: 'medium',
    });
  });
});

function ctxFor(root: string): MigrationContext {
  const sys = new NodeFileSystem();
  return {
    abs: (rel) => path.join(root, rel),
    fs: sys,
    lint: async () => [],
    hash: (c) => createHash('sha256').update(c).digest('hex'),
    now: () => new Date('2026-06-07T00:00:00Z'),
  };
}

describe('migration 0002 (integration)', () => {
  it('seeds a behavior-preserving config stub; idempotent; never writes version.json', async () => {
    const root = await tmpRoot();
    const log = await migration0002.up(ctxFor(root));
    expect(log[0]).toMatch(/seeded/);

    const cfgPath = path.join(root, '.arch-wiki/config.json');
    const parsed = JSON.parse(await fs.readFile(cfgPath, 'utf8'));
    expect(parsed).toEqual({ _doc: expect.any(String) }); // empty profile = all defaults
    // never writes the version marker (the engine does that after up() returns)
    await expect(fs.access(path.join(root, '.arch-wiki/version.json'))).rejects.toBeDefined();

    const log2 = await migration0002.up(ctxFor(root));
    expect(log2[0]).toMatch(/already present, skipped/);
    expect(JSON.parse(await fs.readFile(cfgPath, 'utf8'))).toEqual(parsed); // unchanged
  });
});

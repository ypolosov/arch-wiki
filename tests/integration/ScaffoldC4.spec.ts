import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';
import { scaffoldC4Element, scaffoldC4View } from '../../src/application/usecases/ScaffoldC4';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-c4s-'));
  return path.join(dir, 'docs/architecture');
}
const repoOf = (root: string): FoamWikiRepository => new FoamWikiRepository(root, new NodeFileSystem());
const cfg = (): ProjectConfig => ProjectConfig.from({ c4: { dir: 'c4/src', validate: 'npm run validate' } });

describe('scaffoldC4Element (integration)', () => {
  it('writes an additive extend file under the configured c4 dir', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    const r = await scaffoldC4Element(
      { parent: 'product.gaming', id: 'payments', kind: 'container', title: 'Payments', technology: 'NestJS' },
      { repo, config: cfg() },
    );
    expect(r.created).toBe(true);
    expect(r.path).toBe('c4/src/product.gaming.payments.c4');
    const written = await repo.read(r.path);
    expect(written).toContain('extend product.gaming {');
    expect(written).toContain("payments = container 'Payments' {");
    expect(written).toContain("technology 'NestJS'");
  });

  it('NEVER overwrites an existing file — the author owns it', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    const spec = { parent: 'product.gaming', id: 'payments', kind: 'container', title: 'Payments' };
    await scaffoldC4Element(spec, { repo, config: cfg() });
    await repo.write('c4/src/product.gaming.payments.c4', '// hand-edited by the architect\n');

    const again = await scaffoldC4Element(spec, { repo, config: cfg() });
    expect(again.created).toBe(false);
    expect(await repo.read(again.path)).toBe('// hand-edited by the architect\n');
  });

  it('fails fast (exit 2) with a self-explanatory hint when the project has no [c4] block', async () => {
    const root = await tmpRoot();
    await expect(
      scaffoldC4Element(
        { parent: 'a', id: 'b', kind: 'system', title: 'B' },
        { repo: repoOf(root), config: ProjectConfig.from(null) },
      ),
    ).rejects.toThrow(/scaffold-c4-\* needs a \[c4\] config.*"dir":"c4\/src"/s);
  });

  it('validates the spec BEFORE touching the filesystem', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await expect(
      scaffoldC4Element({ parent: 'bad parent', id: 'b', kind: 'system', title: 'B' }, { repo, config: cfg() }),
    ).rejects.toThrow(/--parent/);
    expect(await repo.exists('c4/src/bad parent.b.c4')).toBe(false);
  });
});

describe('scaffoldC4View (integration)', () => {
  it('writes an additive view file, never touching existing views', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await repo.write('c4/src/views.c4', 'views {\n  view context { include * }\n}\n');

    const r = await scaffoldC4View({ id: 'payments', title: 'Payments — target' }, { repo, config: cfg() });
    expect(r.created).toBe(true);
    expect(r.path).toBe('c4/src/view-payments.c4');
    expect(await repo.read(r.path)).toContain('  view payments {');
    // the hand-authored views file is byte-identical
    expect(await repo.read('c4/src/views.c4')).toBe('views {\n  view context { include * }\n}\n');
  });

  it('is idempotent — an existing view file is left alone', async () => {
    const root = await tmpRoot();
    const repo = repoOf(root);
    await scaffoldC4View({ id: 'payments' }, { repo, config: cfg() });
    const again = await scaffoldC4View({ id: 'payments' }, { repo, config: cfg() });
    expect(again.created).toBe(false);
  });
});

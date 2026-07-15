import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { reviewAdequacy } from '../../src/application/usecases/ReviewAdequacy';

async function tmpRoot(): Promise<string> {
  return path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'aw-adq-')), 'docs/architecture');
}
function deps(root: string) {
  const sys = new NodeFileSystem();
  return { repo: new FoamWikiRepository(root, sys), ledger: new FileLedgerStore(root, sys) };
}

describe('reviewAdequacy (integration)', () => {
  it('scores artifacts and composes assurance + debt (a live-covered, sourced driver is adequate)', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/use-cases/UC-001-x.md'),
      '---\ntype: use-case\nsource: raw/x.md\n---\n# UC-001\n',
    );
    await sys.writeFile(
      path.join(root, 'adrs/0001-a.md'),
      '---\ntype: adr\nstatus: accepted\n---\n# ADR-0001\nDrivers: [[UC-001-x]]\n\n## Considered Options\n\n## Decision Outcome\n\n## Consequences\n',
    );
    await sys.writeFile(path.join(root, 'raw/x.md'), '# x\n');

    const rep = await reviewAdequacy({}, deps(root));
    const uc = rep.artifacts.find((a) => a.id === 'UC-001-x')!;
    expect(uc.band).toBe('adequate');
    expect(uc.bases.find((b) => b.name === 'covered')!.detail).toContain('L1');
    expect(rep.artifacts.find((a) => a.id === '0001-a')!.band).toBe('adequate');
    expect(rep.summary.total).toBe(2);
  });

  it('flags an L0 driver as inadequate and honors --kind / --id filters', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // driver linked only by a proposed ADR → L0 → inadequate
    await sys.writeFile(path.join(root, 'drivers/use-cases/UC-001-x.md'), '---\ntype: use-case\n---\n# UC-001\n');
    await sys.writeFile(
      path.join(root, 'adrs/0001-a.md'),
      '---\ntype: adr\nstatus: proposed\n---\n# ADR-0001\nDrivers: [[UC-001-x]]\n',
    );
    const d = deps(root);

    const uc = (await reviewAdequacy({ id: 'UC-001' }, d)).artifacts;
    expect(uc.map((a) => a.id)).toEqual(['UC-001-x']);
    expect(uc[0]!.band).toBe('inadequate');

    const adrs = await reviewAdequacy({ kind: 'adr' }, d);
    expect(adrs.artifacts.every((a) => a.kind === 'adr')).toBe(true);
    expect(adrs.artifacts.some((a) => a.kind === 'use-case')).toBe(false);
  });
});

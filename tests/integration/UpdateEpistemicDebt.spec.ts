import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { updateEpistemicDebt } from '../../src/application/usecases/UpdateEpistemicDebt';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-debt-'));
  return path.join(dir, 'docs/architecture');
}
const FIXED_NOW = { now: () => new Date('2026-07-15T00:00:00Z') };
function deps(root: string) {
  const sys = new NodeFileSystem();
  return { repo: new FoamWikiRepository(root, sys), ledger: new FileLedgerStore(root, sys), clock: FIXED_NOW };
}

describe('updateEpistemicDebt (integration)', () => {
  it('creates the register and records each decay signal', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // paper coverage: driver linked only by a proposed ADR.
    await sys.writeFile(
      path.join(root, 'drivers/use-cases/UC-001-x.md'),
      '---\ntype: use-case\nrealized_by: [GRM-404]\n---\n# UC-001\n',
    );
    await sys.writeFile(
      path.join(root, 'adrs/0001-a.md'),
      '---\ntype: adr\nstatus: proposed\n---\n# ADR-0001\nDrivers: [[UC-001-x]]\n',
    );

    const d = deps(root);
    const res = await updateEpistemicDebt(d);
    expect(res.created).toBe(true);
    expect(res.path).toBe('epistemic-debt.md');
    expect(res.debtCount).toBeGreaterThanOrEqual(2); // paper-coverage + stale-issue (empty ledger)
    expect(res.byKind['paper-coverage']).toBe(1);
    expect(res.byKind['stale-issue']).toBe(1);

    const body = await d.repo.read('epistemic-debt.md');
    expect(body).toContain('<!-- arch-wiki:debt:start -->');
    expect(body).toContain('**Paper coverage** · [[UC-001-x]]');
    expect(body).toContain('**Stale issue** · [[UC-001-x]]');
    expect(body).toContain('type: epistemic-debt');
  });

  it('regenerates the managed region and preserves notes outside the markers', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/use-cases/UC-001-x.md'),
      '---\ntype: use-case\nsource: raw/gone.md\n---\n# UC-001\n',
    );
    const d = deps(root);
    await updateEpistemicDebt(d);

    // A human note appended outside the managed region.
    const withNote = (await d.repo.read('epistemic-debt.md')) + '\n## My triage notes\nWaived Q3.\n';
    await d.repo.write('epistemic-debt.md', withNote);

    const res2 = await updateEpistemicDebt(d);
    expect(res2.created).toBe(false);
    const body = await d.repo.read('epistemic-debt.md');
    expect(body).toContain('## My triage notes'); // preserved
    expect(body).toContain('**Missing source** · [[UC-001-x]]');
  });

  it('empty debt yields an empty region but still writes the file', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // A clean driver: accepted ADR covers it, no decay.
    await sys.writeFile(
      path.join(root, 'drivers/use-cases/UC-001-x.md'),
      '---\ntype: use-case\n---\n# UC-001\n',
    );
    await sys.writeFile(
      path.join(root, 'adrs/0001-a.md'),
      '---\ntype: adr\nstatus: accepted\n---\n# ADR-0001\nDrivers: [[UC-001-x]]\n',
    );
    const d = deps(root);
    const res = await updateEpistemicDebt(d);
    expect(res.debtCount).toBe(0);
    const body = await d.repo.read('epistemic-debt.md');
    expect(body).toContain('<!-- arch-wiki:debt:start -->');
    expect(body).toContain('<!-- arch-wiki:debt:end -->');
  });

  it('flags overdue evidence when valid_until is past now (FPF B.3.4)', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-x.md'),
      '---\ntype: quality-attribute\nvalid_until: 2026-01-01\n---\n# QA-001\n',
    );
    const d = deps(root); // fixed now = 2026-07-15
    const res = await updateEpistemicDebt(d);
    expect(res.byKind['overdue-evidence']).toBe(1);
    expect(await d.repo.read('epistemic-debt.md')).toContain('**Overdue evidence** · [[QA-001-x]]');
  });

  it('an active waiver suppresses a subject\'s debt (CC-ED.5)', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-x.md'),
      '---\ntype: quality-attribute\nvalid_until: 2026-01-01\n---\n# QA-001\n',
    );
    const d = deps(root);
    await d.ledger.appendWaiver({
      subject: 'QA-001-x',
      reason: 'known, revalidation scheduled',
      until: '2026-09-01',
      by: '@lead',
      waivedAt: '2026-07-15T00:00:00Z',
    });
    const res = await updateEpistemicDebt(d);
    expect(res.debtCount).toBe(0);
    expect(res.waived).toBe(1);
  });
});

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { lintWiki } from '../../src/application/usecases/LintWiki';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-lint-'));
  return path.join(dir, 'docs/architecture');
}

describe('lintWiki (integration)', () => {
  it('loads real files and reports findings; excludes raw/', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // A driver nothing links to and no ADR covers → orphan + uncovered-driver.
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\ntags: [qa]\n---\n# QA-001: Latency\n',
    );
    // A superseded ADR with no successor → high.
    await sys.writeFile(
      path.join(root, 'adrs/0001-old.md'),
      '---\ntype: adr\nstatus: superseded\n---\n# ADR-0001: Old\n',
    );
    // raw/ must be ignored entirely.
    await sys.writeFile(path.join(root, 'raw/notes.md'), '# notes [[QA-999-ghosttt]]\n');

    const repo = new FoamWikiRepository(root, sys);
    const report = await lintWiki(repo);
    const rules = report.findings.map((f) => f.rule);

    expect(rules).toContain('uncovered-driver');
    expect(rules).toContain('orphan');
    expect(rules).toContain('superseded-no-successor');
    // Nothing from raw/ leaked in.
    expect(report.findings.every((f) => !f.file?.startsWith('raw/'))).toBe(true);
  });

  it('suppresses findings recorded in the lint baseline', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'adrs/0001-old.md'),
      '---\ntype: adr\nstatus: superseded\n---\n# ADR-0001\n',
    );
    const repo = new FoamWikiRepository(root, sys);
    const before = await lintWiki(repo);
    expect(before.findings.length).toBeGreaterThan(0);

    const keys = before.findings.map((f) => `${f.rule}|${f.file ?? ''}|${f.message}`);
    await sys.writeFile(path.join(root, '.arch-wiki/lint-baseline.json'), JSON.stringify(keys));

    const after = await lintWiki(repo);
    expect(after.findings.length).toBe(0);
  });

  it('severity filter narrows the result', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'adrs/0001-old.md'),
      '---\ntype: adr\nstatus: deprecated\n---\n# ADR-0001\n',
    );
    const repo = new FoamWikiRepository(root, sys);
    const high = await lintWiki(repo, { severity: 'high' });
    expect(high.findings.every((f) => f.severity === 'high')).toBe(true);
    expect(high.counts.medium).toBe(0);
  });
});

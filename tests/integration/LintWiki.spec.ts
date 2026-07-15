import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { lintWiki } from '../../src/application/usecases/LintWiki';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';
import { ProjectConfigSchema } from '../../src/domain/model/ProjectConfigSchema';
import { baselineKey } from '../../src/domain/services/LintRuleSet';

const configWith = (marker: string): ProjectConfig =>
  ProjectConfig.from(
    ProjectConfigSchema.parse({
      requiredSections: { 'quality-attribute': [{ marker, minWikilinks: 1, severity: 'high' }] },
    }),
  );

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

  it('required-section: flags a QA missing the configured section; baseline suppresses it; editing the marker keeps it suppressed', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // QA-020 has no "C4 elements" section.
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-020-x.md'),
      '---\ntype: quality-attribute\n---\n# QA-020\n## Scenario\n',
    );
    const repo = new FoamWikiRepository(root, sys);

    const before = await lintWiki(repo, { config: configWith('C4 elements') });
    const missing = before.findings.filter((f) => f.rule === 'missing-required-section');
    expect(missing).toHaveLength(1);
    expect(missing[0]!.file).toBe('drivers/quality-attributes/QA-020-x.md');

    // Record the baseline with the same key the runtime suppresses on.
    await sys.writeFile(
      path.join(root, '.arch-wiki/lint-baseline.json'),
      JSON.stringify(before.findings.map(baselineKey)),
    );
    const after = await lintWiki(repo, { config: configWith('C4 elements') });
    expect(after.findings.some((f) => f.rule === 'missing-required-section')).toBe(false);

    // Edit the marker text in config → marker-independent key → still suppressed (fix #7).
    const afterEdit = await lintWiki(repo, { config: configWith('C4 Elements:') });
    expect(afterEdit.findings.some((f) => f.rule === 'missing-required-section')).toBe(false);
  });

  it('flags a QA whose stated Measure carries no numeric threshold (FPF C.16)', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-030-x.md'),
      '---\ntype: quality-attribute\n---\n# QA-030\n\n## Scenario\n- **Measure:** fast and reliable\n',
    );
    const report = await lintWiki(new FoamWikiRepository(root, sys));
    expect(report.findings.some((f) => f.rule === 'qa-measure-untestable')).toBe(true);
  });
});

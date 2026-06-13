import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { NodeFileSystem } from '../../src/adapters/fs/NodeFileSystem';
import { FoamWikiRepository } from '../../src/adapters/repo/FoamWikiRepository';
import { FileLedgerStore } from '../../src/adapters/ledger/FileLedgerStore';
import { GrayMatterParser } from '../../src/adapters/frontmatter/GrayMatterParser';
import { ProjectConfig } from '../../src/domain/services/ProjectConfig';
import { ProjectConfigSchema } from '../../src/domain/model/ProjectConfigSchema';
import { renderConfluencePayload } from '../../src/application/usecases/RenderConfluencePayload';
import { recordPage } from '../../src/application/usecases/RecordPage';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
const clock = { now: () => new Date('2026-06-08T00:00:00Z') };
const CONFIG = ProjectConfig.from(ProjectConfigSchema.parse({ integrations: { confluence: { space: 'PP' } } }));

async function tmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aw-cf-'));
  const root = path.join(dir, 'docs/architecture');
  const sys = new NodeFileSystem();
  const w = (rel: string, body: string) => sys.writeFile(path.join(root, rel), body);
  await Promise.all([
    w('index.md', '# Wiki\n'),
    w('arc42/10-quality-requirements.md', '# Quality Requirements\n'),
    w('drivers/quality-attributes/QA-001-latency.md', '---\ntype: quality-attribute\n---\n# QA-001: Latency\n\nSee [[QA-002-throughput]].\n'),
    w('drivers/quality-attributes/QA-002-throughput.md', '---\ntype: quality-attribute\n---\n# QA-002: Throughput\n'),
    w('adrs/0001-proposed.md', '---\ntype: adr\nstatus: proposed\n---\n# ADR-0001: Draft\n'),
    w('risks.md', '# Risks\n'),
    w('entities/cache.md', '# Cache\n'),
  ]);
  return root;
}

function deps(root: string) {
  const sys = new NodeFileSystem();
  return {
    repo: new FoamWikiRepository(root, sys),
    ledger: new FileLedgerStore(root, sys),
    config: CONFIG,
    hash: sha256,
    frontmatter: new GrayMatterParser(),
    clock,
  };
}

describe('renderConfluencePayload + recordPage (integration)', () => {
  it('mirrors visible pages parent-first, excludes register/proposed, resolves cross-links via the ledger', async () => {
    const root = await tmpRoot();
    const d = deps(root);

    const plan = await renderConfluencePayload(d);
    expect(plan.spaceId).toBe('PP');
    const sources = plan.pages.map((p) => p.source);
    // excluded: risks.md and the proposed ADR
    expect(sources).not.toContain('risks.md');
    expect(sources).not.toContain('adrs/0001-proposed.md');
    // parent-first: index before its children; QA under its arc42 hub
    expect(sources[0]).toBe('index.md');
    const qa1 = plan.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.parentSource).toBe('arc42/10-quality-requirements.md');
    expect(qa1.title).toBe('QA-001: Latency');
    // QA-002 not yet published → cross-link renders as plain text
    expect(qa1.body).toContain('See QA-002-throughput.');
    expect(qa1.alreadyPublished).toBe(false);
    expect(plan.orphans).toEqual([]);

    // Publish QA-002, then re-render: the cross-link resolves to a page-id link.
    const qa2 = plan.pages.find((p) => p.basename === 'QA-002-throughput')!;
    const rec = await recordPage(
      { source: qa2.source, page: '999', hash: qa2.contentHash },
      d,
    );
    expect(rec.ledgerAppended).toBe(true);
    expect(rec.frontmatterUpdated).toBe(true);

    const plan2 = await renderConfluencePayload(d);
    const qa1b = plan2.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1b.body).toContain('[QA-002-throughput](999)');
    const qa2b = plan2.pages.find((p) => p.basename === 'QA-002-throughput')!;
    expect(qa2b.alreadyPublished).toBe(true);
    expect(qa2b.drifted).toBe(false);
  });

  it('detects drift after a content edit and lists/clears orphans', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const plan = await renderConfluencePayload(d);
    const qa2 = plan.pages.find((p) => p.basename === 'QA-002-throughput')!;
    await recordPage({ source: qa2.source, page: '999', hash: qa2.contentHash }, d);

    // Edit QA-002 content → hash drifts → drifted:true on re-render.
    await d.repo.write(
      'drivers/quality-attributes/QA-002-throughput.md',
      '---\ntype: quality-attribute\n---\n# QA-002: Throughput\n\nNow with detail.\n',
    );
    const drifted = (await renderConfluencePayload(d)).pages.find((p) => p.basename === 'QA-002-throughput')!;
    expect(drifted.alreadyPublished).toBe(true);
    expect(drifted.drifted).toBe(true);

    // Seed an orphan ledger row (source no longer in the wiki) → appears as a delete candidate.
    await d.ledger.appendPage({ source: 'drivers/old.md', page: '555', contentHash: 'x', publishedAt: '2026-01-01T00:00:00Z', system: 'confluence' });
    const withOrphan = await renderConfluencePayload(d);
    expect(withOrphan.orphans).toEqual([{ page: '555', source: 'drivers/old.md' }]);

    // record-page --delete reconciles it away.
    const del = await recordPage({ source: 'drivers/old.md', del: true }, d);
    expect(del.ledgerRemoved).toBe(true);
    const after = await renderConfluencePayload(d);
    expect(after.orphans).toEqual([]);
  });
});

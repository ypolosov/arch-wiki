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
import { applyRestore } from '../../src/domain/services/ConfluenceTree';

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
    expect(plan.spaceKey).toBe('PP');
    // v0.8: numeric spaceId + cloudId not configured here → null + preflight warnings.
    expect(plan.spaceId).toBeNull();
    expect(plan.cloudId).toBeNull();
    expect(plan.warnings.some((w) => w.includes('spaceId'))).toBe(true);
    expect(plan.warnings.some((w) => w.includes('cloudId'))).toBe(true);
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
    expect(qa1b.body).toContain('[QA-002-throughput](/wiki/spaces/PP/pages/999)');
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

  it('v0.7: splits the title into prefix/label and neutralizes repo-relative links to plain text', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'entities/cache.md'),
      '# Cache\n\nSee [iterations](../iterations/) and [config](CLAUDE.md).\n',
    );
    const plan = await renderConfluencePayload(deps(root));

    const qa1 = plan.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.titlePrefix).toBe('QA-001:');
    expect(qa1.titleLabel).toBe('Latency');

    const cache = plan.pages.find((p) => p.basename === 'cache')!;
    expect(cache.body).toContain('See iterations and config.');
    expect(cache.body).not.toContain('../iterations/');
    expect(cache.warnings.some((w) => w.includes('repo-relative'))).toBe(true);
  });

  it('RU projection: masks spans, emits language + merged preserveTerms, hash adds language and is stable', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(path.join(root, 'glossary.md'), '# Glossary\n\n- **sweepstakes** — the model\n');
    const ruConfig = ProjectConfig.from(
      ProjectConfigSchema.parse({
        integrations: { confluence: { space: 'PP', language: 'ru', preserveTerms: ['wager'] } },
      }),
    );
    const dRu = {
      repo: new FoamWikiRepository(root, sys),
      ledger: new FileLedgerStore(root, sys),
      config: ruConfig,
      hash: sha256,
      frontmatter: new GrayMatterParser(),
      clock,
    };

    const plan = await renderConfluencePayload(dRu);
    expect(plan.language).toBe('ru');
    expect(plan.preserveTerms).toEqual(['sweepstakes', 'wager']); // config + glossary, deduped+sorted

    const qa1 = plan.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.body).toMatch(/%%AWP\d+%%/); // structural spans masked for translation
    expect(qa1.restore.length).toBeGreaterThan(0);
    const { body: english, missing } = applyRestore(qa1.body, qa1.restore);
    expect(missing).toEqual([]);
    expect(english).toContain('QA-001'); // id restored byte-exact

    // enabling RU drifts the hash once (vs the English render), then is stable across runs
    const en = await renderConfluencePayload(deps(root));
    const qa1en = en.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.contentHash).not.toBe(qa1en.contentHash);
    const plan2 = await renderConfluencePayload(dRu);
    expect(plan2.pages.find((p) => p.basename === 'QA-001-latency')!.contentHash).toBe(qa1.contentHash);
  });

  it('v0.8: carries numeric spaceId/cloudId, reverse-trace edge from realized_by, and stubs local images', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\nrealized_by: [GRMTCH-5]\n---\n# QA-001: Latency\n\n![C4 context](../c4/ctx.png)\n',
    );
    const cfg = ProjectConfig.from(
      ProjectConfigSchema.parse({
        integrations: {
          confluence: { space: 'PP', spaceId: '163845', cloudId: 'cloud-1', siteUrl: 'https://acme.atlassian.net' },
        },
      }),
    );
    const d = { ...deps(root), config: cfg };
    await d.ledger.appendIssue({
      key: 'GRMTCH-5', sourceId: 'QA-001', kind: 'arch', role: null, contentHash: 'h', createdAt: '2026-01-01T00:00:00Z', system: 'jira',
    });

    const plan = await renderConfluencePayload(d);
    expect(plan.spaceKey).toBe('PP');
    expect(plan.spaceId).toBe('163845');
    expect(plan.cloudId).toBe('cloud-1');
    expect(plan.warnings).toEqual([]); // fully configured → no preflight warnings

    const qa1 = plan.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.spaceKey).toBe('PP');
    expect(qa1.realizedBy).toEqual([{ key: 'GRMTCH-5', url: 'https://acme.atlassian.net/browse/GRMTCH-5' }]);
    // R7: the key is wrapped in inline code so the RU projection protects it byte-exact.
    expect(qa1.body).toContain('**Realized by:** [`GRMTCH-5`](https://acme.atlassian.net/browse/GRMTCH-5)');
    expect(qa1.body).toContain('C4 diagram placeholder — source `../c4/ctx.png`');
    expect(qa1.body).not.toContain('![C4 context]');
  });

  it('v0.8: record-page --page-version is surfaced as ledgerPageVersion (drift-guard baseline)', async () => {
    const root = await tmpRoot();
    const d = deps(root);
    const plan = await renderConfluencePayload(d);
    const qa2 = plan.pages.find((p) => p.basename === 'QA-002-throughput')!;
    await recordPage({ source: qa2.source, page: '999', hash: qa2.contentHash, pageVersion: 3 }, d);
    const plan2 = await renderConfluencePayload(d);
    expect(plan2.pages.find((p) => p.basename === 'QA-002-throughput')!.ledgerPageVersion).toBe(3);
  });

  it('v0.8 R6: distinguishes "no siteUrl" from "non-Jira issue" in the reverse-edge warning', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\nrealized_by: [GL-42]\n---\n# QA-001: Latency\n',
    );

    // (a) no siteUrl anywhere → "no jira.siteUrl/confluence.siteUrl" + key listed
    const noUrl = await renderConfluencePayload(deps(root));
    const qaNoUrl = noUrl.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qaNoUrl.realizedBy).toEqual([{ key: 'GL-42', url: null }]);
    expect(qaNoUrl.warnings.some((w) => w.includes('no jira.siteUrl/confluence.siteUrl') && w.includes('GL-42'))).toBe(true);

    // (b) siteUrl set, but GL-42 is a gitlab issue → "non-Jira issue(s)" (not the no-siteUrl message)
    const cfg = ProjectConfig.from(
      ProjectConfigSchema.parse({
        integrations: { confluence: { space: 'PP', siteUrl: 'https://acme.atlassian.net' } },
      }),
    );
    const d = { ...deps(root), config: cfg };
    await d.ledger.appendIssue({
      key: 'GL-42', sourceId: 'QA-001', kind: 'arch', role: null, contentHash: 'h', createdAt: '2026-01-01T00:00:00Z', system: 'gitlab',
    });
    const withUrl = await renderConfluencePayload(d);
    const qaWithUrl = withUrl.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qaWithUrl.realizedBy).toEqual([{ key: 'GL-42', url: null }]); // gitlab → no browse URL yet
    expect(qaWithUrl.warnings.some((w) => w.includes('non-Jira issue(s)') && w.includes('GL-42'))).toBe(true);
    expect(qaWithUrl.warnings.some((w) => w.includes('no jira.siteUrl'))).toBe(false);
  });

  it('v0.8 R7+B-1: RU projection masks the reverse-edge key + a preserveTerm, restoring byte-exact', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\nrealized_by: [GRMTCH-5]\n---\n# QA-001: Latency\n\nThe wager flow is critical.\n',
    );
    const ruCfg = ProjectConfig.from(
      ProjectConfigSchema.parse({
        integrations: {
          confluence: { space: 'PP', language: 'ru', preserveTerms: ['wager'], siteUrl: 'https://acme.atlassian.net' },
        },
      }),
    );
    const d = { ...deps(root), config: ruCfg };
    await d.ledger.appendIssue({
      key: 'GRMTCH-5', sourceId: 'QA-001', kind: 'arch', role: null, contentHash: 'h', createdAt: '2026-01-01T00:00:00Z', system: 'jira',
    });

    const plan = await renderConfluencePayload(d);
    const qa1 = plan.pages.find((p) => p.basename === 'QA-001-latency')!;
    // masked body hides the Jira key (inline code) AND the preserveTerm from the translator
    expect(qa1.body).not.toContain('GRMTCH-5');
    expect(qa1.body).not.toContain('wager');
    expect(qa1.body).toMatch(/%%AWP\d+%%/);
    // restore is byte-exact: key (in inline code), browse URL and the preserveTerm all come back
    const { body, missing } = applyRestore(qa1.body, qa1.restore);
    expect(missing).toEqual([]);
    expect(body).toContain('**Realized by:** [`GRMTCH-5`](https://acme.atlassian.net/browse/GRMTCH-5)');
    expect(body).toContain('The wager flow is critical.');
  });

  it('v0.8.1: strips the ## Sources git-provenance section from the mirror (drifts once, then clean)', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // a Sources section pointing at the git source-of-truth, with the path as inline code
    // (which neutralizeRepoRelativeLinks would otherwise skip — the exact gt leak).
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\n---\n# QA-001: Latency\n\nThe budget is p95<200ms.\n\n## Sources\n- `raw/_synced/user-story-log/123-latency.md`\n',
    );
    const withSources = await renderConfluencePayload(deps(root));
    const qa1 = withSources.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.body).not.toContain('Sources');
    expect(qa1.body).not.toContain('raw/_synced'); // no git source-of-truth path leaks
    expect(qa1.body).toContain('The budget is p95<200ms.'); // real content kept
    expect(qa1.warnings.some((w) => w.includes('Sources'))).toBe(true);

    // The same artifact WITHOUT the Sources section hashes identically → publishing the curated
    // mirror is stable (the section is gone before the hash; no oscillation run-to-run).
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\n---\n# QA-001: Latency\n\nThe budget is p95<200ms.\n',
    );
    const withoutSources = await renderConfluencePayload(deps(root));
    const qa1b = withoutSources.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1b.contentHash).toBe(qa1.contentHash);
  });

  it('v0.8.2: strips **Source:** fields, neutralizes repo paths, and excludes CLAUDE.md from the mirror', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'drivers/quality-attributes/QA-001-latency.md'),
      '---\ntype: quality-attribute\n---\n# QA-001: Latency\n\n**Source:** `raw/TODO.md`\n\nThe model lives in `c4/src/iam.c4` (from raw/go-live-plan.csv).\n\nElement `product.gaming.brand.core.service` owns the budget.\n',
    );
    // CLAUDE.md is a Layer-3 meta-doc — it must not be mirrored at all (D).
    await sys.writeFile(path.join(root, 'CLAUDE.md'), '# Contributor guide\n\nRaw: `raw/` · Schema: `CLAUDE.md`\n');

    const plan = await renderConfluencePayload(deps(root));
    expect(plan.pages.some((p) => p.basename === 'CLAUDE')).toBe(false); // D: excluded from the mirror

    const qa1 = plan.pages.find((p) => p.basename === 'QA-001-latency')!;
    expect(qa1.body).not.toContain('Source'); // A: **Source:** field line dropped
    expect(qa1.body).not.toContain('raw/TODO.md');
    expect(qa1.body).not.toContain('c4/src/iam.c4'); // B: inline-code repo path dropped
    expect(qa1.body).not.toContain('raw/go-live-plan.csv'); // B: provenance parenthetical dropped
    expect(qa1.body).toContain('product.gaming.brand.core.service'); // no false positive on the C4 id
    expect(qa1.warnings.some((w) => w.includes('**Source:**'))).toBe(true);
    expect(qa1.warnings.some((w) => w.includes('repo-internal path'))).toBe(true);
  });

  it('v0.8.3: a repo-relative link whose label IS the path leaves no broken empty link or leaked URL', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    // The exact gt 0.8.2 regression: B ran before the link neutraliser, stripped the path from the
    // LABEL → `[](../c4/src/model.c4)`, and the dead URL survived. With B reordered after the link
    // neutraliser the whole reference is removed cleanly.
    await sys.writeFile(
      path.join(root, 'arc42/05-building-blocks.md'),
      '# Building Blocks\n\n- Model: [c4/src/model.c4](../c4/src/model.c4)\n- Risks tracked in `risks.md`.\n- Note (from `raw/go-live-plan.csv`): pending.\n',
    );
    const plan = await renderConfluencePayload(deps(root));
    const bb = plan.pages.find((p) => p.basename === '05-building-blocks')!;
    expect(bb.body).not.toContain('c4/src/model.c4'); // path gone from label AND url
    expect(bb.body).not.toContain('../c4/'); // no dead repo-relative href survives
    expect(bb.body).not.toMatch(/\[\]\(/); // no broken empty link
    expect(bb.body).toContain('- Model:'); // the list item survives, just without the path
    // Defect 2: prose stays clean — no dangling preposition-before-period, no `(from):`
    expect(bb.body).toContain('Risks tracked.');
    expect(bb.body).not.toMatch(/tracked in\.?$/m);
    expect(bb.body).not.toContain('(from');
    expect(bb.body).toContain('Note: pending.');
  });

  it('v0.8.3: a **Source:** field keeps its non-git remainder (Jira ref + attribution), cutting only the path', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(
      path.join(root, 'concepts/sweepstakes.md'),
      '# Sweepstakes\n\n- **Source:** GRM-3705 — sweepstakes strategy (raw/sweepstakes.md)\n\nBody.\n',
    );
    const plan = await renderConfluencePayload(deps(root));
    const c = plan.pages.find((p) => p.basename === 'sweepstakes')!;
    expect(c.body).toContain('GRM-3705'); // Jira ref preserved
    expect(c.body).toContain('sweepstakes strategy'); // attribution preserved
    expect(c.body).not.toContain('raw/sweepstakes.md'); // only the git path is cut
    expect(c.warnings.some((w) => w.includes('**Source:**'))).toBe(true);
  });

  it('v0.8: a plain page (no realized_by / no image) keeps a single-newline English body (byte-stable upgrade)', async () => {
    const root = await tmpRoot();
    const sys = new NodeFileSystem();
    await sys.writeFile(path.join(root, 'entities/cache.md'), '# Cache\n\nA plain entity.\n');
    const plan = await renderConfluencePayload(deps(root));
    const cache = plan.pages.find((p) => p.basename === 'cache')!;
    expect(cache.body).toBe('# Cache\n\nA plain entity.\n'); // no reverse edge, no stub, exactly one trailing \n
    expect(cache.realizedBy).toEqual([]);
    expect(cache.restore).toEqual([]); // English mirror → nothing masked
  });
});

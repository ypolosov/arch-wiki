import { buildGraph } from '../../src/domain/model/Graph';
import { computeAssurance, summarizeAssurance } from '../../src/domain/services/Assurance';
import { WikiPage } from '../../src/domain/model/WikiPage';

function page(relPath: string, p: Partial<WikiPage> = {}): WikiPage {
  const basename = relPath.replace(/^.*\//, '').replace(/\.md$/, '');
  const folder = relPath.includes('/') ? relPath.replace(/\/[^/]+$/, '') : '';
  return {
    relPath,
    basename,
    folder,
    frontmatter: p.frontmatter ?? {},
    links: p.links ?? [],
    mdLinks: p.mdLinks ?? [],
    headings: p.headings ?? [],
    labels: p.labels ?? [],
    sectionWikilinkCounts: p.sectionWikilinkCounts ?? new Map(),
  };
}
const wl = (target: string) => ({ target, kind: 'wikilink' as const });
const UC = 'drivers/use-cases/UC-001-login.md';

describe('computeAssurance', () => {
  it('L0 — no inbound decision covers the driver', () => {
    const g = buildGraph([page(UC)]);
    const [a] = computeAssurance(g);
    expect(a!.level).toBe('L0');
    expect(a!.liveCoverers).toEqual([]);
    expect(a!.reason).toContain('no accepted ADR');
  });

  it('L0 — only a proposed ADR links it (paper coverage), non-live coverer recorded', () => {
    const g = buildGraph([
      page(UC),
      page('adrs/0001-a.md', { frontmatter: { status: 'proposed' }, links: [wl('UC-001-login')] }),
    ]);
    const [a] = computeAssurance(g);
    expect(a!.level).toBe('L0');
    expect(a!.nonLiveCoverers).toEqual(['0001-a [proposed]']);
    expect(a!.reason).toContain('non-accepted');
  });

  it('L1 — an accepted ADR live-covers it (not yet realized)', () => {
    const g = buildGraph([
      page(UC),
      page('adrs/0001-a.md', { frontmatter: { status: 'accepted' }, links: [wl('UC-001-login')] }),
    ]);
    const [a] = computeAssurance(g);
    expect(a!.level).toBe('L1');
    expect(a!.liveCoverers).toEqual(['0001-a']);
  });

  it('L1 — an iteration always live-covers', () => {
    const g = buildGraph([page(UC), page('iterations/ITER-01.md', { links: [wl('UC-001-login')] })]);
    expect(computeAssurance(g)[0]!.level).toBe('L1');
  });

  it('L2 — live-covered AND realized by a non-stale ledger issue', () => {
    const g = buildGraph([
      page(UC, { frontmatter: { realized_by: ['GRM-1'] } }),
      page('adrs/0001-a.md', { frontmatter: { status: 'accepted' }, links: [wl('UC-001-login')] }),
    ]);
    const [a] = computeAssurance(g, { ledgerIssueKeys: new Set(['GRM-1']) });
    expect(a!.level).toBe('L2');
    expect(a!.realizedBy).toEqual(['GRM-1']);
  });

  it('a stale realized_by (key not in the ledger) does NOT promote to L2', () => {
    const g = buildGraph([
      page(UC, { frontmatter: { realized_by: ['GRM-999'] } }),
      page('adrs/0001-a.md', { frontmatter: { status: 'accepted' }, links: [wl('UC-001-login')] }),
    ]);
    const [a] = computeAssurance(g, { ledgerIssueKeys: new Set() });
    expect(a!.level).toBe('L1');
    expect(a!.realizedBy).toEqual([]);
  });

  it('only drivers appear; ADR/iteration pages are not scored', () => {
    const g = buildGraph([
      page(UC),
      page('adrs/0001-a.md', { frontmatter: { status: 'accepted' } }),
      page('concepts/x.md'),
    ]);
    expect(computeAssurance(g).map((a) => a.driver)).toEqual(['UC-001-login']);
  });

  it('summarizeAssurance counts by level', () => {
    const g = buildGraph([
      page('drivers/use-cases/UC-001-a.md'), // L0
      page('drivers/use-cases/UC-002-b.md'),
      page('adrs/0001-x.md', { frontmatter: { status: 'accepted' }, links: [wl('UC-002-b')] }), // covers b → L1
    ]);
    const s = summarizeAssurance(computeAssurance(g));
    expect(s).toEqual({ L0: 1, L1: 1, L2: 0, total: 2 });
  });
});

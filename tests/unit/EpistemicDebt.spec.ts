import { buildGraph } from '../../src/domain/model/Graph';
import { gatherEpistemicDebt } from '../../src/domain/services/EpistemicDebt';
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
const ctx = (over: Partial<{ keys: string[]; files: string[] }> = {}) => ({
  ledgerIssueKeys: new Set(over.keys ?? []),
  fileSet: new Set(over.files ?? []),
});

describe('gatherEpistemicDebt', () => {
  it('superseded-citation — a live driver leans on a superseded ADR', () => {
    const g = buildGraph([
      page('adrs/0007-old.md', { frontmatter: { status: 'superseded' }, links: [wl('0019-new')] }),
      page('adrs/0019-new.md'),
      page('drivers/quality-attributes/QA-1-x.md', { links: [wl('0007-old')] }),
    ]);
    const rows = gatherEpistemicDebt(g, ctx());
    expect(rows).toContainEqual({
      kind: 'superseded-citation',
      subject: 'QA-1-x',
      detail: 'cites superseded ADR [[0007-old]]',
    });
  });

  it('paper-coverage — a driver covered only by a proposed ADR', () => {
    const g = buildGraph([
      page('drivers/use-cases/UC-1-x.md'),
      page('adrs/0001-a.md', { frontmatter: { status: 'proposed' }, links: [wl('UC-1-x')] }),
    ]);
    const rows = gatherEpistemicDebt(g, ctx());
    expect(rows.find((r) => r.kind === 'paper-coverage')?.detail).toContain('0001-a [proposed]');
  });

  it('stale-issue — realized_by key absent from the ledger', () => {
    const g = buildGraph([
      page('drivers/use-cases/UC-1-x.md', { frontmatter: { realized_by: ['GRM-9'] } }),
    ]);
    expect(gatherEpistemicDebt(g, ctx()).some((r) => r.kind === 'stale-issue')).toBe(true);
    // present in the ledger → no stale-issue row.
    expect(gatherEpistemicDebt(g, ctx({ keys: ['GRM-9'] })).some((r) => r.kind === 'stale-issue')).toBe(
      false,
    );
  });

  it('missing-source — source frontmatter points at a file that is gone', () => {
    const g = buildGraph([
      page('drivers/use-cases/UC-1-x.md', { frontmatter: { source: 'raw/gone.md' } }),
    ]);
    expect(gatherEpistemicDebt(g, ctx()).some((r) => r.kind === 'missing-source')).toBe(true);
    // present on disk → no row.
    expect(
      gatherEpistemicDebt(g, ctx({ files: ['raw/gone.md'] })).some((r) => r.kind === 'missing-source'),
    ).toBe(false);
  });

  it('overdue-evidence — valid_until past now, respecting the budget and skipping without `now`', () => {
    const g = buildGraph([
      page('drivers/quality-attributes/QA-1-x.md', { frontmatter: { valid_until: '2026-01-01' } }),
    ]);
    const now = new Date('2026-07-15T00:00:00Z');
    expect(gatherEpistemicDebt(g, { ...ctx(), now }).some((r) => r.kind === 'overdue-evidence')).toBe(true);
    expect(gatherEpistemicDebt(g, { ...ctx(), now, budgetDays: 100000 }).some((r) => r.kind === 'overdue-evidence')).toBe(false);
    expect(gatherEpistemicDebt(g, ctx()).some((r) => r.kind === 'overdue-evidence')).toBe(false);
  });

  it('missing carrier — a validated_by file path that is gone', () => {
    const g = buildGraph([
      page('drivers/quality-attributes/QA-1-x.md', { frontmatter: { validated_by: ['raw/measure.csv'] } }),
    ]);
    expect(gatherEpistemicDebt(g, ctx()).some((r) => r.kind === 'missing-source')).toBe(true);
    expect(gatherEpistemicDebt(g, ctx({ files: ['raw/measure.csv'] })).some((r) => r.kind === 'missing-source')).toBe(false);
  });

  it('a waived subject is excluded from the register', () => {
    const g = buildGraph([page('drivers/use-cases/UC-1-x.md', { frontmatter: { source: 'raw/gone.md' } })]);
    expect(gatherEpistemicDebt(g, { ...ctx(), waivedSubjects: new Set(['UC-1-x']) })).toEqual([]);
  });

  it('de-duplicates identical rows (a page citing the same superseded ADR twice)', () => {
    const g = buildGraph([
      page('adrs/0007-old.md', { frontmatter: { status: 'superseded' }, links: [wl('0019-new')] }),
      page('adrs/0019-new.md'),
      // CONC links the dead ADR twice (Decision Drivers + More Information).
      page('drivers/concerns/CONC-1-x.md', { links: [wl('0007-old'), wl('0007-old')] }),
    ]);
    const cites = gatherEpistemicDebt(g, ctx()).filter((r) => r.kind === 'superseded-citation');
    expect(cites).toHaveLength(1);
  });

  it('is deterministic (sorted by kind, subject, detail)', () => {
    const g = buildGraph([
      page('drivers/use-cases/UC-2-b.md', { frontmatter: { source: 'raw/x.md' } }),
      page('drivers/use-cases/UC-1-a.md', { frontmatter: { realized_by: ['Z-9'] } }),
    ]);
    const rows = gatherEpistemicDebt(g, ctx());
    expect(rows.map((r) => r.kind)).toEqual(['missing-source', 'stale-issue']);
  });
});

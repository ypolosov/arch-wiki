import { buildGraph } from '../../src/domain/model/Graph';
import { computeAdequacy, summarizeAdequacy } from '../../src/domain/services/Adequacy';
import { DriverAssurance } from '../../src/domain/services/Assurance';
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
const asr = (driver: string, level: 'L0' | 'L1' | 'L2'): DriverAssurance => ({
  driver,
  file: '',
  kind: 'use-case',
  level,
  liveCoverers: [],
  nonLiveCoverers: [],
  realizedBy: [],
  reason: '',
});
const driverPage = page('drivers/use-cases/UC-001-a.md');
const fullAdr = (over: Partial<WikiPage> = {}) =>
  page('adrs/0001-x.md', {
    frontmatter: { status: 'accepted' },
    links: [wl('UC-001-a')],
    headings: ['Considered Options', 'Decision Outcome', 'Consequences'],
    ...over,
  });
const adrOf = (g: ReturnType<typeof buildGraph>) => computeAdequacy(g).find((a) => a.kind === 'adr')!;

describe('computeAdequacy', () => {
  it('ADR with all critical bases + consequences → adequate', () => {
    expect(adrOf(buildGraph([fullAdr(), driverPage])).band).toBe('adequate');
  });

  it('ADR missing Consequences (non-critical) → thin', () => {
    const g = buildGraph([fullAdr({ headings: ['Considered Options', 'Decision Outcome'] }), driverPage]);
    expect(adrOf(g).band).toBe('thin');
  });

  it('ADR missing Decision Outcome (critical) → inadequate', () => {
    const g = buildGraph([fullAdr({ headings: ['Considered Options', 'Consequences'] }), driverPage]);
    const adr = adrOf(g);
    expect(adr.band).toBe('inadequate');
    expect(adr.bases.find((b) => b.name === 'decision')!.ok).toBe(false);
  });

  it('ADR with an invalid status → inadequate', () => {
    expect(adrOf(buildGraph([fullAdr({ frontmatter: { status: 'draft' } }), driverPage])).band).toBe('inadequate');
  });

  it('superseded ADR without a successor link → inadequate', () => {
    const g = buildGraph([fullAdr({ frontmatter: { status: 'superseded' } }), driverPage]);
    const adr = adrOf(g);
    expect(adr.bases.find((b) => b.name === 'successor-linked')!.ok).toBe(false);
    expect(adr.band).toBe('inadequate');
  });

  it('driver at L1 with a source and no debt → adequate', () => {
    const g = buildGraph([page('drivers/use-cases/UC-001-a.md', { frontmatter: { source: 'raw/x.md' } })]);
    const rows = computeAdequacy(g, { assurance: new Map([['UC-001-a', asr('UC-001-a', 'L1')]]) });
    expect(rows[0]!.band).toBe('adequate');
  });

  it('driver at L0 → inadequate (covered is critical)', () => {
    const g = buildGraph([page('drivers/use-cases/UC-001-a.md', { frontmatter: { source: 'raw/x.md' } })]);
    const rows = computeAdequacy(g, { assurance: new Map([['UC-001-a', asr('UC-001-a', 'L0')]]) });
    expect(rows[0]!.band).toBe('inadequate');
    expect(rows[0]!.bases.find((b) => b.name === 'covered')!.detail).toContain('L0');
  });

  it('driver carrying epistemic debt → thin (no-debt is non-critical)', () => {
    const g = buildGraph([page('drivers/use-cases/UC-001-a.md', { frontmatter: { source: 'raw/x.md' } })]);
    const rows = computeAdequacy(g, {
      assurance: new Map([['UC-001-a', asr('UC-001-a', 'L1')]]),
      debtSubjects: new Set(['UC-001-a']),
    });
    expect(rows[0]!.band).toBe('thin');
  });

  it('an iteration linking a driver and an ADR → adequate', () => {
    const g = buildGraph([
      page('iterations/ITER-01.md', { links: [wl('UC-001-a'), wl('0001-x')] }),
      page('drivers/use-cases/UC-001-a.md'),
      page('adrs/0001-x.md', { frontmatter: { status: 'accepted' } }),
    ]);
    expect(computeAdequacy(g).find((a) => a.kind === 'iteration')!.band).toBe('adequate');
  });

  it('an orphan concept → thin (linked base fails, non-critical)', () => {
    expect(computeAdequacy(buildGraph([page('concepts/lonely.md')]))[0]!.band).toBe('thin');
  });

  it('scores a C4-tagged arc42 hub by structural-view correspondence', () => {
    const withView = buildGraph([page('arc42/05-x.md', { frontmatter: { tags: ['arc42', 'c4'] }, headings: ['C4 source'] })]);
    expect(computeAdequacy(withView).find((a) => a.kind === 'arc42')!.band).toBe('adequate');
    const noView = buildGraph([page('arc42/05-x.md', { frontmatter: { tags: ['arc42', 'c4'] }, headings: ['Building blocks'] })]);
    expect(computeAdequacy(noView).find((a) => a.kind === 'arc42')!.band).toBe('thin');
  });

  it('summarizeAdequacy counts by band and kind', () => {
    const g = buildGraph([page('drivers/use-cases/UC-001-a.md'), page('concepts/lonely.md')]);
    const s = summarizeAdequacy(computeAdequacy(g));
    expect(s.total).toBe(2);
    expect(s.inadequate).toBe(1); // driver at L0 (no assurance) → covered fails
    expect(s.thin).toBe(1); // orphan concept
  });
});

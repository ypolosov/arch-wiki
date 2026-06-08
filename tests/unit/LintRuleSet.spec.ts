import { buildGraph } from '../../src/domain/model/Graph';
import { runLint, baselineKey, gatherSupersededCitations } from '../../src/domain/services/LintRuleSet';
import { WikiPage } from '../../src/domain/model/WikiPage';
import { ArtifactKind } from '../../src/domain/model/ArtifactType';
import { RequiredSection } from '../../src/domain/model/ProjectConfigSchema';

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
const req = (
  pairs: Array<[ArtifactKind, RequiredSection[]]>,
): ReadonlyMap<ArtifactKind, readonly RequiredSection[]> => new Map(pairs);
const sec = (marker: string, minWikilinks = 0, severity: 'high' | 'medium' | 'low' = 'medium'): RequiredSection => ({
  marker,
  minWikilinks,
  severity,
});

describe('runLint', () => {
  it('flags a typo wikilink as broken (near-name exists) but not a placeholder', () => {
    const g = buildGraph([
      page('drivers/quality-attributes/QA-001-latency.md'),
      page('arc42/09-architecture-decisions.md', {
        links: [wl('QA-001-latencyy'), wl('totally-new-note')],
      }),
    ]);
    const findings = runLint(g);
    const broken = findings.filter((f) => f.rule === 'broken-wikilink');
    expect(broken).toHaveLength(1);
    expect(broken[0]!.message).toContain('QA-001-latency');
  });

  it('flags a markdown link to a missing .md file', () => {
    const g = buildGraph([page('index.md', { mdLinks: ['adrs/0099-ghost.md'] })]);
    expect(runLint(g).some((f) => f.rule === 'broken-mdlink')).toBe(true);
  });

  it('flags an orphan but exempts hubs and structural pages', () => {
    const g = buildGraph([
      page('concepts/lonely.md'),
      page('arc42/01-introduction-and-goals.md'),
      page('glossary.md'),
    ]);
    const orphans = runLint(g).filter((f) => f.rule === 'orphan');
    expect(orphans.map((o) => o.file)).toEqual(['concepts/lonely.md']);
  });

  it('flags an uncovered driver, and clears it once an ADR links it', () => {
    const uncovered = buildGraph([page('drivers/use-cases/UC-001-login.md', { links: [] })]);
    expect(runLint(uncovered).some((f) => f.rule === 'uncovered-driver')).toBe(true);

    const covered = buildGraph([
      page('drivers/use-cases/UC-001-login.md'),
      page('adrs/0001-auth.md', { links: [wl('UC-001-login')] }),
    ]);
    expect(runLint(covered).some((f) => f.rule === 'uncovered-driver')).toBe(false);
  });

  it('flags a superseded ADR with no successor link', () => {
    const g = buildGraph([
      page('adrs/0001-old.md', { frontmatter: { status: 'superseded' }, links: [] }),
    ]);
    expect(runLint(g).some((f) => f.rule === 'superseded-no-successor')).toBe(true);

    const g2 = buildGraph([
      page('adrs/0001-old.md', { frontmatter: { status: 'superseded' }, links: [wl('0002-new')] }),
      page('adrs/0002-new.md'),
    ]);
    expect(runLint(g2).some((f) => f.rule === 'superseded-no-successor')).toBe(false);
  });
});

describe('required-section rule', () => {
  const QA = 'drivers/quality-attributes/QA-001-latency.md';
  const ctx = { requiredSections: req([['quality-attribute', [sec('C4 elements', 1, 'high')]]]) };

  it('passes when the section is present with enough wikilinks (heading or label, any case/colon)', () => {
    const g = buildGraph([
      page(QA, { headings: ['Scenario', 'C4 Elements'], sectionWikilinkCounts: new Map([['c4 elements', 2]]) }),
    ]);
    expect(runLint(g, ctx).filter((f) => f.rule.startsWith('required') || f.rule.startsWith('missing'))).toEqual([]);
  });

  it('flags a missing required section (message carries the marker verbatim)', () => {
    const g = buildGraph([page(QA, { headings: ['Scenario'] })]);
    const f = runLint(g, ctx).find((x) => x.rule === 'missing-required-section');
    expect(f).toBeDefined();
    expect(f!.severity).toBe('high');
    expect(f!.message).toContain('"C4 elements"');
  });

  it('flags underlinked when the section exists but has too few wikilinks', () => {
    const g = buildGraph([
      page(QA, { labels: ['C4 elements'], sectionWikilinkCounts: new Map([['c4 elements', 0]]) }),
    ]);
    const rules = runLint(g, ctx).map((f) => f.rule);
    expect(rules).toContain('required-section-underlinked');
    expect(rules).not.toContain('missing-required-section');
  });

  it('does nothing for kinds with no config, and nothing when the map is empty (regression)', () => {
    const g = buildGraph([page('adrs/0001-x.md', { headings: [] })]);
    expect(runLint(g, ctx).some((f) => f.rule.includes('section'))).toBe(false); // adr not configured
    expect(runLint(g, {}).some((f) => f.rule.includes('section'))).toBe(false); // no map at all
  });
});

describe('baselineKey', () => {
  it('is marker-independent for required-section rules (key on rule|file|kind)', () => {
    const file = 'drivers/quality-attributes/QA-020-x.md';
    const a = baselineKey({ rule: 'missing-required-section', severity: 'high', file, message: 'missing "C4 elements"' });
    const b = baselineKey({ rule: 'missing-required-section', severity: 'high', file, message: 'missing "C4 Elements:"' });
    expect(a).toBe(b); // editing the marker text does not change the key
    expect(a).toBe('missing-required-section|drivers/quality-attributes/QA-020-x.md|quality-attribute');
  });

  it('keeps the message in the key for all other rules', () => {
    const k = baselineKey({ rule: 'orphan', severity: 'medium', file: 'concepts/x.md', message: 'orphan: x' });
    expect(k).toBe('orphan|concepts/x.md|orphan: x');
  });
});

describe('gatherSupersededCitations', () => {
  it('collects only LIVE design artifacts citing a superseded ADR; excludes ADR/iteration/STRUCTURAL', () => {
    const g = buildGraph([
      page('adrs/0007-old.md', { frontmatter: { status: 'superseded' }, links: [wl('0019-new')] }),
      page('adrs/0019-new.md', { links: [wl('0007-old')] }), // ADR→ADR excluded (MADR hygiene)
      page('iterations/ITER-01.md', { links: [wl('0007-old')] }), // iteration timeline — excluded
      page('risks.md', { links: [wl('0007-old')] }), // STRUCTURAL register — excluded
      page('gap-analysis.md', { links: [wl('0007-old')] }), // STRUCTURAL derived — excluded
      page('drivers/quality-attributes/QA-018-x.md', { links: [wl('0007-old')] }), // live driver — kept
    ]);
    const cites = gatherSupersededCitations(g);
    expect(cites).toEqual([
      {
        citingFile: 'drivers/quality-attributes/QA-018-x.md',
        citingKind: 'quality-attribute',
        targetAdr: '0007-old',
        targetStatus: 'superseded',
      },
    ]);
  });

  it('keeps concept and arc42 hub citations (also live design artifacts)', () => {
    const g = buildGraph([
      page('adrs/0023-old.md', { frontmatter: { status: 'deprecated' }, links: [] }),
      page('concepts/caching.md', { links: [wl('0023-old')] }),
      page('arc42/09-architecture-decisions.md', { links: [wl('0023-old')] }),
    ]);
    const cites = gatherSupersededCitations(g).map((c) => c.citingFile);
    expect(cites).toEqual(['arc42/09-architecture-decisions.md', 'concepts/caching.md']);
  });
});

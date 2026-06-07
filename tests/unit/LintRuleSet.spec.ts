import { buildGraph } from '../../src/domain/model/Graph';
import { runLint } from '../../src/domain/services/LintRuleSet';
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
  };
}

const wl = (target: string) => ({ target, kind: 'wikilink' as const });

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

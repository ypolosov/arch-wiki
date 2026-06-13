import { buildGraph } from '../../src/domain/model/Graph';
import { WikiPage } from '../../src/domain/model/WikiPage';
import { runLint } from '../../src/domain/services/LintRuleSet';

function page(relPath: string): WikiPage {
  const basename = relPath.replace(/^.*\//, '').replace(/\.md$/, '');
  const folder = relPath.includes('/') ? relPath.replace(/\/[^/]+$/, '') : '';
  return {
    relPath,
    basename,
    folder,
    frontmatter: {},
    links: [],
    mdLinks: [],
    headings: [],
    labels: [],
    sectionWikilinkCounts: new Map(),
  };
}

describe('runLint duplicate-basename rule', () => {
  it('flags both pages sharing a basename across folders (high)', () => {
    const g = buildGraph([page('entities/overview.md'), page('concepts/overview.md'), page('entities/unique.md')]);
    const dups = runLint(g).filter((f) => f.rule === 'duplicate-basename');
    expect(dups).toHaveLength(2);
    expect(dups.every((f) => f.severity === 'high')).toBe(true);
    expect(dups.map((f) => f.file).sort()).toEqual(['concepts/overview.md', 'entities/overview.md']);
    expect(dups[0]!.message).toContain('[[overview]]');
  });

  it('does not flag unique basenames', () => {
    const g = buildGraph([page('entities/a.md'), page('entities/b.md')]);
    expect(runLint(g).some((f) => f.rule === 'duplicate-basename')).toBe(false);
  });
});

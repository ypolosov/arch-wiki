import { buildGraph } from '../../src/domain/model/Graph';
import { parseTermSheet, glossaryFindings } from '../../src/domain/services/Glossary';
import { WikiPage } from '../../src/domain/model/WikiPage';

function page(relPath: string): WikiPage {
  const basename = relPath.replace(/^.*\//, '').replace(/\.md$/, '');
  return {
    relPath,
    basename,
    folder: relPath.replace(/\/[^/]+$/, ''),
    frontmatter: {},
    links: [],
    mdLinks: [],
    headings: [],
    labels: [],
    sectionWikilinkCounts: new Map(),
  };
}

const SHEET = `# Glossary

| Term | Definition |
|------|------------|
| **Operator** | B2B tenant. See [[UC-008-operator-onboarding]]. |
| **Visitor** | Unauthenticated user. |
`;

describe('parseTermSheet', () => {
  it('parses terms, strips bold, and extracts managing-page links', () => {
    const t = parseTermSheet(SHEET);
    expect(t.map((x) => x.term)).toEqual(['Operator', 'Visitor']);
    expect(t[0]!.links).toEqual(['UC-008-operator-onboarding']);
    expect(t[1]!.links).toEqual([]);
  });

  it('parses optional Context and Status columns', () => {
    const s = '| Term | Context | Definition | Status |\n|---|---|---|---|\n| **Foo** | gaming | a thing [[x]] | Deprecated |\n';
    const [row] = parseTermSheet(s);
    expect(row!.context).toBe('gaming');
    expect(row!.status).toBe('deprecated');
  });
});

describe('glossaryFindings', () => {
  const empty = buildGraph([]);

  it('flags an unlinked term but not a linked one', () => {
    const f = glossaryFindings(parseTermSheet(SHEET), empty);
    expect(f.some((x) => x.rule === 'glossary-term-unlinked' && x.message.includes('Visitor'))).toBe(true);
    expect(f.some((x) => x.rule === 'glossary-term-unlinked' && x.message.includes('Operator'))).toBe(false);
  });

  it('flags near-duplicate term names (mint-or-reuse)', () => {
    const s = '| Term | Definition |\n|---|---|\n| **Operator** | a [[x]] |\n| **Operatr** | b [[y]] |\n';
    expect(glossaryFindings(parseTermSheet(s), empty).some((x) => x.rule === 'glossary-near-duplicate')).toBe(true);
  });

  it('flags a deprecated term with no successor link', () => {
    const s = '| Term | Definition | Status |\n|---|---|---|\n| **OldThing** | gone. | deprecated |\n';
    expect(
      glossaryFindings(parseTermSheet(s), empty).some((x) => x.rule === 'deprecated-term-without-successor'),
    ).toBe(true);
  });

  it('flags an entity page referenced by no glossary term', () => {
    const g = buildGraph([page('entities/widget.md')]);
    const s = '| Term | Definition |\n|---|---|\n| **Operator** | a [[x]] |\n';
    expect(
      glossaryFindings(parseTermSheet(s), g).some(
        (x) => x.rule === 'entity-without-glossary-term' && x.message.includes('widget'),
      ),
    ).toBe(true);
  });
});

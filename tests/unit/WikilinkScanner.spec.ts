import { scanLinks, scanPage, normalizeSection } from '../../src/domain/services/WikilinkScanner';

describe('scanLinks', () => {
  it('extracts wikilinks, embeds, aliases, and strips anchors', () => {
    const r = scanLinks('see [[QA-001-x|QA-001]] and ![[note#sec]] and [[plain]]');
    expect(r.links).toEqual([
      { target: 'QA-001-x', alias: 'QA-001', kind: 'wikilink' },
      { target: 'note', alias: undefined, kind: 'embed' },
      { target: 'plain', alias: undefined, kind: 'wikilink' },
    ]);
  });

  it('keeps relative .md md-links and ignores urls/anchors/mailto', () => {
    const r = scanLinks('[a](b/c.md) [x](https://e.com) [y](#sec) [z](other.md#h) [m](mailto:a@b.c)');
    expect(r.mdLinks).toEqual(['b/c.md', 'other.md']);
  });
});

describe('normalizeSection', () => {
  it('strips bold/colon, collapses whitespace, lowercases', () => {
    expect(normalizeSection('C4 Elements')).toBe('c4 elements');
    expect(normalizeSection('**C4 elements:**')).toBe('c4 elements');
    expect(normalizeSection('  C4   elements :  ')).toBe('c4 elements');
  });
});

describe('scanPage', () => {
  it('collects headings, labels and per-section wikilink counts (non-embed only)', () => {
    const body = [
      '# Title',
      '',
      '## C4 elements',
      'see [[Container-API]] and [[Component-Auth]] and ![[diagram]]',
      '',
      '**Decision Drivers:** [[QA-001-latency]]',
    ].join('\n');
    const r = scanPage(body);
    expect(r.headings).toEqual(['Title', 'C4 elements']);
    expect(r.labels).toEqual(['Decision Drivers']);
    expect(r.sectionWikilinkCounts.get('c4 elements')).toBe(2); // embed not counted
    expect(r.sectionWikilinkCounts.get('decision drivers')).toBe(1);
    expect(r.links.length).toBe(4); // flat list still includes the embed
  });

  it('returns empty arrays/map for a body with no headings or labels', () => {
    const r = scanPage('just text with [[a-link]]\n');
    expect(r.headings).toEqual([]);
    expect(r.labels).toEqual([]);
    expect(r.sectionWikilinkCounts.size).toBe(0); // no section to attribute to
  });
});

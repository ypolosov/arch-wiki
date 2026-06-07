import { scanLinks } from '../../src/domain/services/WikilinkScanner';

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

import { buildGraph } from '../../src/domain/model/Graph';
import { ArtifactKind } from '../../src/domain/model/ArtifactType';
import { WikiPage } from '../../src/domain/model/WikiPage';
import { scanPage } from '../../src/domain/services/WikilinkScanner';
import {
  DEFAULT_EXCLUDE,
  applyRestore,
  extractGlossaryTerms,
  isPageExcluded,
  parentSourceOf,
  protectStructuralSpans,
  resolveCrossLinks,
  sortParentFirst,
} from '../../src/domain/services/ConfluenceTree';

function page(relPath: string, opts: { fm?: Record<string, unknown>; body?: string } = {}): WikiPage {
  const basename = relPath.replace(/^.*\//, '').replace(/\.md$/, '');
  const folder = relPath.includes('/') ? relPath.replace(/\/[^/]+$/, '') : '';
  const scanned = scanPage(opts.body ?? '');
  return { relPath, basename, folder, frontmatter: opts.fm ?? {}, ...scanned };
}

describe('ConfluenceTree.isPageExcluded', () => {
  it('excludes confluence:false / audience:internal; force-includes confluence:true', () => {
    expect(isPageExcluded(page('entities/a.md', { fm: { confluence: false } }), DEFAULT_EXCLUDE)).toBe(true);
    expect(isPageExcluded(page('entities/b.md', { fm: { audience: 'internal' } }), DEFAULT_EXCLUDE)).toBe(true);
    // confluence:true wins even over a register basename
    expect(isPageExcluded(page('risks.md', { fm: { confluence: true } }), DEFAULT_EXCLUDE)).toBe(false);
  });

  it('excludes register pages and proposed/rejected ADRs by default', () => {
    expect(isPageExcluded(page('risks.md'), DEFAULT_EXCLUDE)).toBe(true);
    expect(isPageExcluded(page('gap-analysis.md'), DEFAULT_EXCLUDE)).toBe(true);
    expect(isPageExcluded(page('adrs/0001-x.md', { fm: { status: 'proposed' } }), DEFAULT_EXCLUDE)).toBe(true);
    expect(isPageExcluded(page('adrs/0002-y.md', { fm: { status: 'accepted' } }), DEFAULT_EXCLUDE)).toBe(false);
    expect(isPageExcluded(page('drivers/quality-attributes/QA-001-x.md'), DEFAULT_EXCLUDE)).toBe(false);
  });
});

describe('ConfluenceTree.parentSourceOf', () => {
  const hubMap = new Map<ArtifactKind, string | null>([
    ['quality-attribute', 'arc42/10-quality-requirements.md'],
    ['entity', null],
  ]);

  it('roots index, nests an artifact under its hub, and hubless kinds under index', () => {
    const included = new Set([
      'index.md',
      'arc42/10-quality-requirements.md',
      'drivers/quality-attributes/QA-001-x.md',
      'entities/thing.md',
    ]);
    expect(parentSourceOf(page('index.md'), hubMap, included, 'index.md')).toBeNull();
    expect(
      parentSourceOf(page('drivers/quality-attributes/QA-001-x.md'), hubMap, included, 'index.md'),
    ).toBe('arc42/10-quality-requirements.md');
    expect(parentSourceOf(page('entities/thing.md'), hubMap, included, 'index.md')).toBe('index.md');
    // arc42 hub itself → under index
    expect(parentSourceOf(page('arc42/10-quality-requirements.md'), hubMap, included, 'index.md')).toBe('index.md');
  });

  it('falls back to index when the hub is excluded', () => {
    const included = new Set(['index.md', 'drivers/quality-attributes/QA-001-x.md']); // hub absent
    expect(
      parentSourceOf(page('drivers/quality-attributes/QA-001-x.md'), hubMap, included, 'index.md'),
    ).toBe('index.md');
  });
});

describe('ConfluenceTree.sortParentFirst', () => {
  it('orders parents before children, then by relPath', () => {
    const parents = new Map<string, string | null>([
      ['index.md', null],
      ['arc42/10-q.md', 'index.md'],
      ['drivers/quality-attributes/QA-001.md', 'arc42/10-q.md'],
    ]);
    expect(sortParentFirst([...parents.keys()], parents)).toEqual([
      'index.md',
      'arc42/10-q.md',
      'drivers/quality-attributes/QA-001.md',
    ]);
  });
});

describe('ConfluenceTree.resolveCrossLinks', () => {
  it('renders published targets as root-relative /wiki links and unpublished ones as plain text', () => {
    const g = buildGraph([page('drivers/quality-attributes/QA-001-latency.md'), page('entities/cache.md')]);
    const published = new Map<string, string>([['drivers/quality-attributes/QA-001-latency.md', '12345']]);
    const included = new Set(['drivers/quality-attributes/QA-001-latency.md', 'entities/cache.md']);
    const { body, crossLinks } = resolveCrossLinks(
      'See [[QA-001-latency|QA-001]] and [[cache]] and [[ghost]].',
      g,
      published,
      included,
      'PP',
    );
    // Root-relative URL (not a bare page-id, which would 404 as a relative href).
    expect(body).toBe('See [QA-001](/wiki/spaces/PP/pages/12345) and cache and ghost.');
    expect(crossLinks).toEqual([
      { target: 'QA-001-latency', resolved: true, pageId: '12345' },
      { target: 'cache', resolved: false },
      { target: 'ghost', resolved: false },
    ]);
  });
});

describe('ConfluenceTree.protectStructuralSpans + applyRestore (CAP-2 RU)', () => {
  const body = [
    '# UC-014: Login',
    '',
    'See [UC-014 · Login](/wiki/spaces/SD/pages/123) and run `npm test`.',
    '',
    '```ts',
    'const x = 1;',
    '```',
  ].join('\n');

  it('masks code, link URLs and artifact ids; restore is an exact round-trip', () => {
    const { masked, restore } = protectStructuralSpans(body);
    // structural spans are gone from the text handed to translation
    expect(masked).not.toContain('/wiki/spaces/SD/pages/123');
    expect(masked).not.toContain('npm test');
    expect(masked).not.toContain('const x = 1;');
    expect(masked).toMatch(/%%AWP\d+%%/);
    // prose survives for translation
    expect(masked).toContain('Login');
    // exact round-trip
    const { body: restored, missing } = applyRestore(masked, restore);
    expect(restored).toBe(body);
    expect(missing).toEqual([]);
  });

  it('survives a translation that keeps placeholders verbatim', () => {
    const src = 'Open [Latency](/wiki/spaces/SD/pages/9) — see UC-014.';
    const { masked, restore } = protectStructuralSpans(src);
    const translated = masked.replace('Open', 'Открой').replace('see', 'см.'); // prose → RU, tokens kept
    const { body: out, missing } = applyRestore(translated, restore);
    expect(missing).toEqual([]);
    expect(out).toBe('Открой [Latency](/wiki/spaces/SD/pages/9) — см. UC-014.');
  });

  it('reports a dropped placeholder as missing (never silently loses protected content)', () => {
    const { restore } = protectStructuralSpans('run `build` now');
    expect(restore).toHaveLength(1);
    const { missing } = applyRestore('run now', restore); // translator dropped the token
    expect(missing).toEqual(restore.map((r) => r.token));
  });
});

describe('ConfluenceTree.extractGlossaryTerms', () => {
  it('collects bold terms, deduped + sorted', () => {
    const md = '# Glossary\n\n- **wager** — a bet\n- **KYC** — identity check\n- **wager** again\n';
    expect(extractGlossaryTerms(md)).toEqual(['KYC', 'wager']);
  });
});

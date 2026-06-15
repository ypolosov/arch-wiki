import { buildGraph } from '../../src/domain/model/Graph';
import { ArtifactKind } from '../../src/domain/model/ArtifactType';
import { WikiPage } from '../../src/domain/model/WikiPage';
import { scanPage } from '../../src/domain/services/WikilinkScanner';
import {
  DEFAULT_EXCLUDE,
  applyRestore,
  confluencePageUrl,
  extractGlossaryTerms,
  isPageExcluded,
  jiraBrowseUrl,
  neutralizeRepoRelativeLinks,
  parentSourceOf,
  protectStructuralSpans,
  isRepoInternalPath,
  neutralizeRepoPaths,
  resolveCrossLinks,
  sortParentFirst,
  splitTitle,
  stripSourceProvenanceLines,
  stripSourcesSection,
  stubLocalImages,
  transformOutsideCode,
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

  it('excludes register pages, the CLAUDE meta-doc and proposed/rejected ADRs by default', () => {
    expect(isPageExcluded(page('risks.md'), DEFAULT_EXCLUDE)).toBe(true);
    expect(isPageExcluded(page('gap-analysis.md'), DEFAULT_EXCLUDE)).toBe(true);
    expect(isPageExcluded(page('CLAUDE.md'), DEFAULT_EXCLUDE)).toBe(true); // v0.8.2 D: Layer-3 meta-doc
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

describe('ConfluenceTree.resolveCrossLinks reserveUnresolved (RU stability, v0.7)', () => {
  it('reserves a pending masked link for an included-but-unpublished target; absent stays plain text', () => {
    const g = buildGraph([page('drivers/quality-attributes/QA-002.md')]);
    const included = new Set(['drivers/quality-attributes/QA-002.md']);
    const { body } = resolveCrossLinks(
      'See [[QA-002|QA-002]] and [[ghost]].',
      g,
      new Map(), // nothing published yet
      included,
      'PP',
      true,
    );
    expect(body).toBe('See [QA-002](/wiki/spaces/PP/pages/pending) and ghost.');
  });

  it('keeps the translatable body byte-stable from pending (pass 1) to resolved (pass 2)', () => {
    const g = buildGraph([page('a.md'), page('b.md')]);
    const included = new Set(['a.md', 'b.md']);
    const pass1 = resolveCrossLinks('x [[b]] y', g, new Map(), included, 'PP', true).body;
    const pass2 = resolveCrossLinks('x [[b]] y', g, new Map([['b.md', '42']]), included, 'PP', true).body;
    // The translator sees identical masked text → the page need not be re-translated on pass 2.
    expect(protectStructuralSpans(pass1).masked).toBe(protectStructuralSpans(pass2).masked);
  });
});

describe('ConfluenceTree.splitTitle (v0.7)', () => {
  it('splits an id-prefixed heading; passes through a plain title', () => {
    expect(splitTitle('UC-014: Login')).toEqual({ prefix: 'UC-014:', label: 'Login' });
    expect(splitTitle('ADR-0001: Use Kafka')).toEqual({ prefix: 'ADR-0001:', label: 'Use Kafka' });
    expect(splitTitle('Overview')).toEqual({ prefix: '', label: 'Overview' });
  });
});

describe('ConfluenceTree.neutralizeRepoRelativeLinks (v0.7)', () => {
  it('strips repo-relative links to plain text; keeps absolute, /wiki and anchors', () => {
    const src =
      'See [iters](../iterations/) and [docs](CLAUDE.md) and [QA](/wiki/spaces/PP/pages/9) and [ext](https://x.io) and [a](#sec).';
    const { body, stripped } = neutralizeRepoRelativeLinks(src);
    expect(body).toBe('See iters and docs and [QA](/wiki/spaces/PP/pages/9) and [ext](https://x.io) and [a](#sec).');
    expect(stripped).toEqual(['../iterations/', 'CLAUDE.md']);
  });

  it('leaves image embeds untouched', () => {
    expect(neutralizeRepoRelativeLinks('![diagram](../c4/x.png)').body).toBe('![diagram](../c4/x.png)');
  });

  it('leaves a repo-relative link INSIDE code untouched (R2 code-fence safety)', () => {
    const inline = neutralizeRepoRelativeLinks('Run `[x](../y.md)` literally.');
    expect(inline.body).toBe('Run `[x](../y.md)` literally.');
    expect(inline.stripped).toEqual([]);
    const fenced = neutralizeRepoRelativeLinks('```md\n[x](../y.md)\n```\n[real](../z.md)');
    // the fenced sample is preserved; only the real link outside is neutralised
    expect(fenced.body).toBe('```md\n[x](../y.md)\n```\nreal');
    expect(fenced.stripped).toEqual(['../z.md']);
  });

  it('protects a link inside a ``double-backtick`` inline span (review H1)', () => {
    const r = neutralizeRepoRelativeLinks('``x`` `[a](../a.md)` plain [b](../b.md)');
    expect(r.body).toBe('``x`` `[a](../a.md)` plain b'); // inline-code link kept verbatim
    expect(r.stripped).toEqual(['../b.md']); // only the real outside link stripped
  });

  it('protects a link inside a ~~~ tilde fence (review M4)', () => {
    const r = neutralizeRepoRelativeLinks('~~~\n[x](../y.md)\n~~~\n[real](../z.md)');
    expect(r.body).toBe('~~~\n[x](../y.md)\n~~~\nreal');
    expect(r.stripped).toEqual(['../z.md']);
  });

  it('stays linear on a long unclosed-backtick run (no quadratic backtracking, review 2a)', () => {
    // A backreference form (`+)[\s\S]*?\1 would take tens of seconds here and blow the jest timeout.
    const pathological = '`'.repeat(10000) + 'x'.repeat(10000) + ' [b](../b.md)';
    const start = Date.now();
    const r = neutralizeRepoRelativeLinks(pathological);
    expect(Date.now() - start).toBeLessThan(1000);
    expect(r.body.endsWith('b')).toBe(true); // the trailing real link is still neutralised
  });

  it('wraps a filename/domain-like label in inline code so Confluence does not auto-link it (D)', () => {
    expect(neutralizeRepoRelativeLinks('See [CLAUDE.md](../../CLAUDE.md).').body).toBe('See `CLAUDE.md`.');
    expect(neutralizeRepoRelativeLinks('Edit [config.json](./c.json).').body).toBe('Edit `config.json`.');
    // a label with spaces (not filename-like) is left as plain text
    expect(neutralizeRepoRelativeLinks('See [the notes](../n.md).').body).toBe('See the notes.');
  });
});

describe('ConfluenceTree.stripSourcesSection (v0.8.1 — no git source-of-truth in the mirror)', () => {
  it('strips a trailing ## Sources section (the common case)', () => {
    const r = stripSourcesSection('# QA-023: Latency\n\nBody prose.\n\n## Sources\n- `raw/notes/x.md`\n');
    expect(r.stripped).toBe(true);
    expect(r.body).toBe('# QA-023: Latency\n\nBody prose.\n');
    expect(r.body).not.toContain('Sources');
    expect(r.body).not.toContain('raw/notes/x.md');
  });

  it('keeps a following level-≤2 section (Sources ends at the next ## / # heading)', () => {
    const src = '## Sources\n- `raw/a.md`\n\n## Decision Drivers\n- [[QA-001]]\n';
    const r = stripSourcesSection(src);
    expect(r.body).toBe('## Decision Drivers\n- [[QA-001]]\n');
  });

  it('does NOT treat a ### subheading inside Sources as a terminator', () => {
    const src = '## Sources\n### primary\n- `raw/a.md`\n### secondary\n- `raw/b.md`\n';
    const r = stripSourcesSection(src);
    expect(r.stripped).toBe(true);
    expect(r.body.replace(/\n+$/, '')).toBe(''); // whole section (incl. ### subheadings) removed
  });

  it('is fence-aware — a ## Sources INSIDE a code block is left alone', () => {
    const src = '# Doc\n\n```md\n## Sources\n- raw/x.md\n```\n\nReal prose.\n';
    const r = stripSourcesSection(src);
    expect(r.stripped).toBe(false);
    expect(r.body).toBe(src.replace(/\n+$/, '\n'));
    expect(r.body).toContain('## Sources'); // the fenced example is preserved verbatim
  });

  it('is a no-op when there is no Sources section', () => {
    const src = '# UC-014: Login\n\nNo provenance here.\n';
    expect(stripSourcesSection(src)).toEqual({ body: src, stripped: false });
  });
});

describe('ConfluenceTree.isRepoInternalPath (v0.8.2 — strict anchored allowlist)', () => {
  it('matches repo roots, *.c4/*.csv files and register/meta filenames', () => {
    for (const p of [
      'raw/TODO.md',
      'raw/_synced/user-story-log/123-x.md',
      '../raw/notes.md',
      'docs/architecture/raw/TODO.md',
      'c4/src/iam.c4',
      '.foam/templates/concept.md',
      'go-live-plan.csv',
      'iam.c4',
      'glossary.md',
      'risks.md',
      'gap-analysis.md',
      'CLAUDE.md',
    ]) {
      expect(isRepoInternalPath(p)).toBe(true);
    }
  });

  it('does NOT match C4 element ids, domain terms or arbitrary *.md (no false positives)', () => {
    for (const t of [
      'product.gaming.brand.core.service', // C4 element id (dotted, no /, not .c4/.csv)
      'README.md', // not a register file
      'design.md',
      'sweepstakes', // domain term
      'wager.balance', // dotted domain-ish term
      'v1.2.3', // version
      'e.g.', // prose
      'foo/bar', // a path but not under a known repo root
    ]) {
      expect(isRepoInternalPath(t)).toBe(false);
    }
  });
});

describe('ConfluenceTree.stripSourceProvenanceLines (v0.8.2 A)', () => {
  it('drops a **Source:** field whose value is a repo path', () => {
    const r = stripSourceProvenanceLines('# CON-007\n\n**Source:** `raw/TODO.md`\n\n## Constraint\nText.\n');
    expect(r.stripped).toBe(true);
    expect(r.body).not.toContain('Source');
    expect(r.body).not.toContain('raw/TODO.md');
    expect(r.body).toContain('## Constraint');
  });

  it('drops a labelled **Source for …:** field citing a repo path', () => {
    const r = stripSourceProvenanceLines('**Source for the maintainer role list:** docs/architecture/raw/owners.md\n');
    expect(r.stripped).toBe(true);
    expect(r.body.trim()).toBe('');
  });

  it('KEEPS the QA-scenario **Source:** field (value is an actor, not a path)', () => {
    const src = '## Scenario\n- **Source:** an authenticated user\n- **Stimulus:** submits the form\n';
    expect(stripSourceProvenanceLines(src)).toEqual({ body: src, stripped: false });
  });

  it('is fence-aware (a **Source:** raw/… inside a code block is left alone)', () => {
    const src = '```md\n**Source:** raw/x.md\n```\n';
    expect(stripSourceProvenanceLines(src).stripped).toBe(false);
  });
});

describe('ConfluenceTree.neutralizeRepoPaths (v0.8.2 B)', () => {
  it('drops a (from <repo-path>) provenance parenthetical, incl. in a heading', () => {
    const r = neutralizeRepoPaths('## Go-live rebase (from raw/go-live-plan.csv)\n\n> Note (from raw/notes.md)\n');
    expect(r.neutralized).toBe(true);
    expect(r.body).toContain('## Go-live rebase');
    expect(r.body).not.toContain('raw/go-live-plan.csv');
    expect(r.body).not.toContain('raw/notes.md');
    expect(r.body).not.toContain('(from');
  });

  it('drops an inline-code repo path and tidies the gap', () => {
    const r = neutralizeRepoPaths('The model lives in `c4/src/iam.c4` for reference.');
    expect(r.neutralized).toBe(true);
    expect(r.body).not.toContain('c4/src/iam.c4');
    expect(r.body).not.toContain('`'); // the code span is gone
    expect(r.body).not.toMatch(/ {2,}/); // no doubled space left behind
  });

  it('drops a bare register filename in prose', () => {
    const r = neutralizeRepoPaths('See glossary.md and risks.md for context.');
    expect(r.body).not.toContain('glossary.md');
    expect(r.body).not.toContain('risks.md');
  });

  it('does NOT touch a C4 element id or a fenced code sample (no false positives)', () => {
    const src = 'Element `product.gaming.brand.core.service` is central.\n\n```\nsee raw/x.md\n```\n';
    const r = neutralizeRepoPaths(src);
    expect(r.neutralized).toBe(false);
    expect(r.body).toBe(src); // both the C4 id and the fenced raw/ path survive verbatim
  });

  it('KEEPS bare external/POC git URLs (acceptance tier ii — even ending in .c4/.csv or with raw/ segments)', () => {
    for (const src of [
      'Evidence: https://bitbucket.org/gromtech1/pocs/src/main.c4 confirms it.',
      'See https://git.shakuro.com/foo/bar.csv for the POC.',
      'Ref https://example.com/raw/file.txt and https://example.com/docs/architecture/x here.',
    ]) {
      const r = neutralizeRepoPaths(src);
      expect(r.body).toBe(src); // URL preserved verbatim
      expect(r.neutralized).toBe(false);
    }
  });

  it('drops ONLY the path in a prose-carrying aside, not the whole parenthetical (no over-deletion)', () => {
    const r = neutralizeRepoPaths('The plan (see also raw/y.md and other notes) is ready.');
    expect(r.body).not.toContain('raw/y.md');
    expect(r.body).toContain('and other notes'); // human prose preserved
    expect(r.body).toContain('The plan');
    expect(r.body).toContain('is ready.');
  });
});

describe('ConfluenceTree.transformOutsideCode (R2)', () => {
  it('applies fn only outside fenced + inline code, leaving code byte-exact', () => {
    const src = 'a `keep` b\n```\nkeep too\n```\nc';
    const out = transformOutsideCode(src, (chunk) => chunk.toUpperCase());
    expect(out).toBe('A `keep` B\n```\nkeep too\n```\nC');
  });
});

describe('ConfluenceTree.confluencePageUrl (v0.7)', () => {
  it('absolute with siteUrl (trailing slash trimmed); root-relative without', () => {
    expect(confluencePageUrl('https://acme.atlassian.net/', 'PP', '123')).toBe(
      'https://acme.atlassian.net/wiki/spaces/PP/pages/123',
    );
    expect(confluencePageUrl(null, 'PP', '123')).toBe('/wiki/spaces/PP/pages/123');
  });
});

describe('ConfluenceTree.jiraBrowseUrl (v0.8)', () => {
  it('builds <site>/browse/<KEY> (trailing slash trimmed)', () => {
    expect(jiraBrowseUrl('https://acme.atlassian.net/', 'GRMTCH-5')).toBe(
      'https://acme.atlassian.net/browse/GRMTCH-5',
    );
  });
});

describe('ConfluenceTree.stubLocalImages (v0.8)', () => {
  it('stubs local image embeds (with the src in inline code) and keeps absolute ones', () => {
    const src = 'See ![C4 context](../c4/context.png) and ![remote](https://x.io/a.png).';
    const { body, stubbed } = stubLocalImages(src);
    expect(body).toContain('C4 diagram placeholder — source `../c4/context.png` (C4 context)');
    expect(body).not.toContain('![C4 context]'); // local embed replaced
    expect(body).toContain('![remote](https://x.io/a.png)'); // absolute kept
    expect(stubbed).toEqual(['../c4/context.png']);
  });

  it('is inline-safe — no leading blockquote `> ` lands mid-line for an inline image (R5)', () => {
    const { body } = stubLocalImages('Diagram ![d](../c4/x.png) shows the flow.');
    expect(body).toBe('Diagram 📐 C4 diagram placeholder — source `../c4/x.png` (d) _(attachment embedding pending)_ shows the flow.');
    expect(body).not.toContain('> '); // would be a stray mid-line `>` in Confluence
  });

  it('leaves an image INSIDE code untouched (R2 code-fence safety)', () => {
    const { body, stubbed } = stubLocalImages('Use `![x](../c4/y.png)` syntax.');
    expect(body).toBe('Use `![x](../c4/y.png)` syntax.');
    expect(stubbed).toEqual([]);
  });

  it('stubs a local image whose alt text contains brackets (review M3)', () => {
    const { body, stubbed } = stubLocalImages('![a [x] b](../diagram.png)');
    expect(stubbed).toEqual(['../diagram.png']);
    expect(body).toContain('C4 diagram placeholder — source `../diagram.png` (a [x] b)');
    expect(body).not.toContain('![a [x] b]');
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

describe('ConfluenceTree.protectStructuralSpans preserveTerms (B-1, v0.8)', () => {
  it('masks denylist terms so the translator cannot alter them; round-trips byte-exact', () => {
    const src = 'The sweepstakes wallet credits sweep coins.';
    const { masked, restore } = protectStructuralSpans(src, ['sweepstakes', 'sweep coins']);
    expect(masked).not.toContain('sweepstakes');
    expect(masked).not.toContain('sweep coins');
    expect(masked).toContain('wallet'); // a non-term word stays translatable
    // translator renders the prose to RU, keeping placeholders verbatim
    const translated = masked.replace('The', 'Этот').replace('wallet credits', 'кошелёк начисляет');
    const { body, missing } = applyRestore(translated, restore);
    expect(missing).toEqual([]);
    expect(body).toBe('Этот sweepstakes кошелёк начисляет sweep coins.');
  });

  it('respects word boundaries (no partial-word masking)', () => {
    const { masked } = protectStructuralSpans('KYC and KYCheck', ['KYC']);
    // "KYC" masked, but "KYCheck" left intact
    expect(masked).toMatch(/%%AWP\d+%% and KYCheck/);
  });

  it('masks longest-first so a prefix term does not shadow a longer one', () => {
    const { masked, restore } = protectStructuralSpans('free spins and free play', ['free', 'free spins']);
    const { body } = applyRestore(masked, restore);
    expect(body).toBe('free spins and free play'); // both restored intact
    // "free spins" is masked as one span, not as "free" + " spins"
    const spinsSpan = restore.find((r) => r.original === 'free spins');
    expect(spinsSpan).toBeDefined();
  });

  it('does not double-mask a term that lives inside already-masked code', () => {
    const { masked, restore } = protectStructuralSpans('use `KYC` inline and KYC in prose', ['KYC']);
    const { body, missing } = applyRestore(masked, restore);
    expect(missing).toEqual([]);
    expect(body).toBe('use `KYC` inline and KYC in prose');
  });

  it('a term of shape AWP<n> cannot corrupt an emitted placeholder (review M1)', () => {
    // 'alpha' is masked first; the term 'AWP0' must NOT match inside the resulting %%AWP0%% token.
    const { masked, restore } = protectStructuralSpans('alpha and beta', ['alpha', 'AWP0']);
    const { body, missing } = applyRestore(masked, restore);
    expect(missing).toEqual([]); // round-trip intact
    expect(body).toBe('alpha and beta');
  });

  it('a source body literally containing the token format still round-trips (review L1)', () => {
    const src = '`a` and the literal %%AWP0%% and `b`';
    const { masked, restore } = protectStructuralSpans(src);
    // the prefix is lengthened so generated tokens never collide with the literal %%AWP0%%
    const { body, missing } = applyRestore(masked, restore);
    expect(missing).toEqual([]);
    expect(body).toBe(src);
  });

  it('masks an underscore-emphasised / snake_case-adjacent term (review M2)', () => {
    const { masked, restore } = protectStructuralSpans('This _wager_ is italic; plain wager too', ['wager']);
    expect(masked).not.toContain('wager'); // BOTH occurrences masked (underscore is a boundary now)
    const { body, missing } = applyRestore(masked, restore);
    expect(missing).toEqual([]);
    expect(body).toBe('This _wager_ is italic; plain wager too');
  });
});

describe('ConfluenceTree.extractGlossaryTerms', () => {
  it('collects bold terms, deduped + sorted', () => {
    const md = '# Glossary\n\n- **wager** — a bet\n- **KYC** — identity check\n- **wager** again\n';
    expect(extractGlossaryTerms(md)).toEqual(['KYC', 'wager']);
  });
});

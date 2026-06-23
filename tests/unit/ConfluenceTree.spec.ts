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
  humanizeRepoRef,
  tidyRenamedPhrases,
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

  it('renames a bare register wikilink to its phrase but PRESERVES a record-id anchor (v0.8.5/0.8.6 class 5)', () => {
    // risks/gap-analysis are excluded → can never be a page. A bare [[risks]] → the phrase; an anchored
    // [[risks#^R-007|…]] → the record-id "R-007" (v0.8.6: keep traceability + grammar), discarding the
    // path-bearing alias so `risks.md` never leaks.
    const g = buildGraph([page('drivers/quality-attributes/QA-001.md')]); // risks NOT in graph/included
    const included = new Set(['drivers/quality-attributes/QA-001.md']);
    const { body, crossLinks } = resolveCrossLinks(
      'Tracked (see [[risks]]) and [[risks#^R-007|risks.md (R-007)]] applies; ghost [[ghost]].',
      g,
      new Map(),
      included,
      'PP',
    );
    expect(body).toBe('Tracked (see the risk register) and R-007 applies; ghost ghost.');
    expect(body).not.toContain('risks.md'); // the path-bearing alias is discarded (no leak)
    // a deliberate register rename is not logged as a cross-link; only the genuine unresolved `ghost` is.
    expect(crossLinks).toEqual([{ target: 'ghost', resolved: false }]);
  });

  it('resolves a MARKDOWN-form .md cross-link to a mirrored neighbour page (v0.8.5 class 6)', () => {
    const g = buildGraph([page('adrs/0023-old.md'), page('adrs/0027-new.md')]);
    const published = new Map<string, string>([['adrs/0023-old.md', '777']]);
    const included = new Set(['adrs/0023-old.md', 'adrs/0027-new.md']);
    const { body, crossLinks } = resolveCrossLinks(
      '**Supersedes:** [ADR-0023](0023-old.md) and [ADR-0099](0099-missing.md).',
      g,
      published,
      included,
      'PP',
    );
    // published neighbour → /wiki link; not-mirrored target left as-is for neutralizeRepoRelativeLinks.
    expect(body).toBe('**Supersedes:** [ADR-0023](/wiki/spaces/PP/pages/777) and [ADR-0099](0099-missing.md).');
    expect(crossLinks).toEqual([{ target: '0023-old', resolved: true, pageId: '777' }]);
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

describe('ConfluenceTree.resolveCrossLinks v0.8.6 — register anchor/alias keeps the record-id', () => {
  const g = buildGraph([page('drivers/quality-attributes/QA-001.md')]); // risks excluded / not in graph
  const included = new Set(['drivers/quality-attributes/QA-001.md']);
  const run = (s: string) => resolveCrossLinks(s, g, new Map(), included, 'PP').body;

  it('prefers an id-shaped alias / anchor id over the generic register name (grammar + traceability)', () => {
    expect(run('Resolves [[risks#^C-003|C-003]].')).toBe('Resolves C-003.');
    expect(run('([[risks#^Q-003|Q-003]] resolved)')).toBe('(Q-003 resolved)');
    expect(run('the recorded contradiction [[risks#^C-003|C-003]]')).toBe('the recorded contradiction C-003');
    expect(run('Anchor only [[risks#^R-012]] here')).toBe('Anchor only R-012 here'); // anchor, no alias
  });

  it('a BARE register wikilink (no id) still renders the human phrase (no regression)', () => {
    expect(run('Recorded in [[risks]].')).toBe('Recorded in the risk register.');
    expect(run('(see [[risks]])')).toBe('(see the risk register)');
  });

  it('collapses a duplicated article from a register rename (no "the the")', () => {
    expect(run('Listed in the [[kanban|Architecture Backlog]].')).toBe('Listed in the backlog.');
    expect(run('See the [[gap-analysis|gaps]] page.')).toBe('See the gap analysis page.');
  });

  it('replaces an indefinite article before a register rename (no "an risk register") (v0.8.6 review)', () => {
    expect(run('It is a [[risks]] entry.')).toBe('It is the risk register entry.');
    expect(run('See an [[utility-tree]] node.')).toBe('See the utility tree node.');
  });

  it('three different anchors stay three different ids (no adjacent-repeat collapse)', () => {
    expect(run('([[risks#^C-010|C-010]]/[[risks#^R-015|R-015]]/[[risks#^Q-003|Q-003]])')).toBe(
      '(C-010/R-015/Q-003)',
    );
  });
});

describe('ConfluenceTree.tidyRenamedPhrases (v0.8.6)', () => {
  it('drops a duplicated article and collapses an adjacent identical phrase', () => {
    expect(tidyRenamedPhrases('in the the backlog')).toBe('in the backlog');
    expect(tidyRenamedPhrases('The the gap analysis')).toBe('The gap analysis');
    expect(tidyRenamedPhrases('the source brief, the source brief')).toBe('the source brief');
    expect(tidyRenamedPhrases('the C4 model / the C4 model')).toBe('the C4 model');
  });

  it('replaces an indefinite article before an inserted definite phrase (no "an risk register") (v0.8.6 review)', () => {
    expect(tidyRenamedPhrases('It is a the risk register entry')).toBe('It is the risk register entry');
    expect(tidyRenamedPhrases('See an the C4 model now')).toBe('See the C4 model now');
    expect(tidyRenamedPhrases('An the source brief')).toBe('The source brief'); // sentence-start capital kept
  });

  it('leaves DIFFERENT adjacent phrases and ordinary prose untouched', () => {
    expect(tidyRenamedPhrases('the risk register and the gap analysis')).toBe('the risk register and the gap analysis');
    expect(tidyRenamedPhrases('the theory of the case')).toBe('the theory of the case'); // not "the the"
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

  it('drops a trailing-slash path fragment from a bare wiki-directory label (v0.8.6 index.md residual)', () => {
    expect(neutralizeRepoRelativeLinks('Lives in [iterations/](iterations/).').body).toBe('Lives in iterations.');
    // a non-slash dir label is unaffected (existing behaviour)
    expect(neutralizeRepoRelativeLinks('See [iterations](../iterations/).').body).toBe('See iterations.');
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
      'c4/', // bare repo root (no path tail) — itself a leak (v0.8.3)
      'raw/',
      '.foam/',
      'docs/architecture/',
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
      'raw', // a bare word without the slash is NOT a root (v0.8.3 — `raw events`, not `raw/`)
      'c4',
      'draw/sketch', // a root buried in a larger token must not match (anchored)
    ]) {
      expect(isRepoInternalPath(t)).toBe(false);
    }
  });
});

describe('ConfluenceTree.humanizeRepoRef (v0.8.5 — DELETE→RENAME map)', () => {
  it('maps each repo-ref kind to its human phrase', () => {
    const cases: [string, string][] = [
      ['risks.md', 'the risk register'],
      ['risks', 'the risk register'],
      ['risks#^R-007', 'the risk register'],
      ['gap-analysis.md', 'the gap analysis'],
      ['kanban', 'the backlog'],
      ['glossary.md', 'the glossary'],
      ['utility-tree', 'the utility tree'],
      ['CLAUDE.md', 'the contributor guide'],
      ['c4/src/model.c4', 'the C4 model'],
      ['c4/src/views.c4', 'the C4 views'],
      ['c4/src/deployment.c4', 'the C4 deployment view'],
      ['c4/src/*.c4', 'the C4 model'], // glob → the model
      ['c4/', 'the C4 model'], // bare root
      ['`c4/src/iam.c4`', 'the C4 model'], // wrapping backticks tolerated
      ['raw/TODO.md', 'the source brief'],
      ['raw/', 'the source brief'],
      ['docs/architecture/raw/TODO.md', 'the source brief'], // raw/ segment wins over the wiki root
      ['raw/go-live-plan.csv', 'the data file'], // .csv extension wins over raw/
      ['data/metrics.csv', 'the data file'],
      ['docs/architecture/x.md', 'the architecture wiki'],
    ];
    for (const [token, phrase] of cases) {
      expect(humanizeRepoRef(token)).toBe(phrase);
    }
  });

  it('drops .foam tooling and returns "" for an unrecognised token', () => {
    expect(humanizeRepoRef('.foam/templates/concept.md')).toBe('');
    expect(humanizeRepoRef('QA-099')).toBe(''); // not a repo ref → caller keeps the alias
    expect(humanizeRepoRef('product.gaming.brand.core.service')).toBe(''); // never a C4-id false positive
  });
});

describe('ConfluenceTree.stripSourceProvenanceLines (v0.8.2 A)', () => {
  it('renames the repo path in a **Source:** field to its human phrase (v0.8.5 RENAME)', () => {
    const r = stripSourceProvenanceLines('# CON-007\n\n**Source:** `raw/TODO.md`\n\n## Constraint\nText.\n');
    expect(r.stripped).toBe(true);
    expect(r.body).toContain('**Source:** the source brief'); // path renamed, field kept
    expect(r.body).not.toContain('raw/TODO.md');
    expect(r.body).toContain('## Constraint');
  });

  it('renames a labelled **Source for …:** field citing a repo path (v0.8.5)', () => {
    const r = stripSourceProvenanceLines('**Source for the maintainer role list:** docs/architecture/raw/owners.md\n');
    expect(r.stripped).toBe(true);
    expect(r.body.trim()).toBe('**Source for the maintainer role list:** the source brief');
  });

  it('KEEPS the QA-scenario **Source:** field (value is an actor, not a path)', () => {
    const src = '## Scenario\n- **Source:** an authenticated user\n- **Stimulus:** submits the form\n';
    expect(stripSourceProvenanceLines(src)).toEqual({ body: src, stripped: false });
  });

  it('is fence-aware (a **Source:** raw/… inside a code block is left alone)', () => {
    const src = '```md\n**Source:** raw/x.md\n```\n';
    expect(stripSourceProvenanceLines(src).stripped).toBe(false);
  });

  it('KEEPS the non-git remainder of the value, renaming only the path (v0.8.5 Minor 1)', () => {
    const r = stripSourceProvenanceLines('- **Source:** GRM-3705 — sweepstakes strategy (raw/sweepstakes.md)\n');
    expect(r.stripped).toBe(true);
    expect(r.body).toContain('GRM-3705'); // Jira ref preserved
    expect(r.body).toContain('sweepstakes strategy'); // expert attribution preserved
    expect(r.body).toContain('**Source:**'); // the field label survives
    expect(r.body).not.toContain('raw/sweepstakes.md'); // only the git path is touched
    expect(r.body.trimEnd()).toBe('- **Source:** GRM-3705 — sweepstakes strategy (the source brief)');
  });
});

describe('ConfluenceTree.neutralizeRepoPaths (v0.8.2 B)', () => {
  it('renames a repo path inside a (from …) parenthetical, keeping the aside (v0.8.5)', () => {
    const r = neutralizeRepoPaths('## Go-live rebase (from raw/go-live-plan.csv)\n\n> Note (from raw/notes.md)\n');
    expect(r.neutralized).toBe(true);
    expect(r.body).toContain('## Go-live rebase (from the data file)');
    expect(r.body).toContain('> Note (from the source brief)');
    expect(r.body).not.toContain('raw/go-live-plan.csv');
    expect(r.body).not.toContain('raw/notes.md');
  });

  it('renames an inline-code repo path to its phrase, leaving no backtick or doubled space (v0.8.5)', () => {
    const r = neutralizeRepoPaths('The model lives in `c4/src/iam.c4` for reference.');
    expect(r.neutralized).toBe(true);
    expect(r.body).toBe('The model lives in the C4 model for reference.');
    expect(r.body).not.toContain('`'); // the code span is gone
  });

  it('renames a bare register filename in prose (v0.8.5)', () => {
    const r = neutralizeRepoPaths('See glossary.md and risks.md for context.');
    expect(r.body).toBe('See the glossary and the risk register for context.');
  });

  it('renames an inline-code c4 glob WHOLE, leaving no orphan *.c4 or stray backtick (v0.8.5 class 7)', () => {
    const r = neutralizeRepoPaths('LikeC4 sources in `c4/src/*.c4`, validated via `npm run validate`.');
    expect(r.neutralized).toBe(true);
    expect(r.body).toBe('LikeC4 sources in the C4 model, validated via `npm run validate`.');
    expect(r.body).not.toContain('*.c4'); // no orphaned glob tail
    expect((r.body.match(/`/g) ?? []).length).toBe(2); // exactly the surviving `npm run validate` span — no unpaired backtick
  });

  it('cleans the rename seams: no "the the", no adjacent-repeat, no CLAUDE tautology (v0.8.6)', () => {
    expect(neutralizeRepoPaths('Listed in the `kanban.md` today.').body).toBe('Listed in the backlog today.');
    expect(neutralizeRepoPaths('Sources: raw/a.md, raw/b.md done.').body).toBe('Sources: the source brief done.');
    expect(neutralizeRepoPaths('The schema contract lives in CLAUDE.md here.').body).toBe(
      'The schema contract lives in the contributor guide here.',
    );
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

  // ── v0.8.3 Defect 2: backtick-aware provenance paren + connective-absorb (no dangling prose) ──
  it('renames a backticked repo path inside a parenthetical, keeping the keyword (v0.8.5)', () => {
    const r = neutralizeRepoPaths('Note (from `raw/release-management-and-deployment.md`): see below.');
    expect(r.neutralized).toBe(true);
    expect(r.body).not.toContain('raw/release-management-and-deployment.md');
    expect(r.body).toBe('Note (from the source brief): see below.');
  });

  it('renames a connective-introduced path in place, keeping the whole sentence (v0.8.5)', () => {
    // RENAME (not DELETE): the connective ("in") and the punctuation survive — no dangling stump.
    expect(neutralizeRepoPaths('Risk tracked in `risks.md`.').body).toBe('Risk tracked in the risk register.');
    expect(neutralizeRepoPaths('Go-live readiness in `raw/go-live-plan.csv`.').body).toBe('Go-live readiness in the data file.');
    expect(neutralizeRepoPaths('Defined in c4/src/iam.c4 for clarity.').body).toBe('Defined in the C4 model for clarity.');
  });

  it('renaming a line-wrapped path never eats a newline (no line/paragraph/heading merge) (v0.8.5)', () => {
    // The rename is an in-place substitution of the path token, so newlines/blank lines around it are
    // untouched — structure is preserved (no merged lines, no paragraph pulled into a heading).
    const src = 'The model is defined in\n`c4/src/x.c4` and used widely.\n\nNext paragraph.';
    const wrapped = neutralizeRepoPaths(src);
    expect(wrapped.body).not.toContain('c4/src/x.c4'); // path gone (renamed)
    expect(wrapped.body).toContain('\n\nNext paragraph.'); // blank line + next paragraph intact
    expect((wrapped.body.match(/\n/g) ?? []).length).toBe((src.match(/\n/g) ?? []).length); // no newline eaten
    expect(wrapped.body).toMatch(/defined in\nthe C4 model/); // path renamed in place, line break kept

    const heading = neutralizeRepoPaths('## Defined here\n\nraw/x.md is the source.');
    expect(heading.body).toContain('## Defined here\n'); // heading not pulled into the next paragraph
    expect(heading.body).toContain('the source brief is the source.'); // bare path renamed
    expect(heading.body).not.toContain('raw/x.md');
  });

  it('leaves no dangling preposition-before-punctuation on any connective form (v0.8.3 acceptance sanity)', () => {
    for (const src of [
      'See the design from `raw/notes.md`, then proceed.',
      'Constraints under `c4/src/x.c4`; review them.',
      'The flow from raw/x.md to the wallet.',
    ]) {
      const body = neutralizeRepoPaths(src).body;
      expect(body).not.toMatch(/\b(?:in|into|on|onto|at|to|of|for|from|via|per|under|within|with|by|see)\b[ \t]*[.,;:]/);
    }
  });

  // ── v0.8.3 Minor 2: a bare repo root (no path tail) is itself a leak and must match ──
  it('neutralises a bare repo root (c4/ , raw/) but NOT a root buried in a larger token (v0.8.3 Minor 2)', () => {
    const r = neutralizeRepoPaths('Layers: c4/ and raw/ hold the model.');
    expect(r.neutralized).toBe(true);
    expect(r.body).not.toMatch(/\bc4\//);
    expect(r.body).not.toMatch(/\braw\//);

    const drawn = neutralizeRepoPaths('We draw/sketch ideas and crawl/ over them.');
    expect(drawn.neutralized).toBe(false); // `draw/` / `crawl/` are NOT repo roots (left boundary)
    expect(drawn.body).toBe('We draw/sketch ideas and crawl/ over them.');
  });
});

describe('ConfluenceTree.neutralizeRepoRelativeLinks + neutralizeRepoPaths (v0.8.3 Defect 1 — pipeline order)', () => {
  it('a repo-relative link whose LABEL is the path is fully removed (no broken empty link survives)', () => {
    // The render pipeline runs neutralizeRepoRelativeLinks BEFORE neutralizeRepoPaths so the link
    // collapses to an inline-code label first, which B then removes — no `[](…)` leak (gt 0.8.2 bug).
    const { body: linkClean } = neutralizeRepoRelativeLinks('- Model: [c4/src/model.c4](../c4/src/model.c4)\n');
    expect(linkClean).toBe('- Model: `c4/src/model.c4`\n'); // label wrapped, dead URL stripped
    const { body: curated } = neutralizeRepoPaths(linkClean);
    expect(curated).not.toContain('c4/src/model.c4');
    expect(curated).not.toContain(']('); // no surviving link syntax
    expect(curated).not.toMatch(/\[\]\(/); // and definitely no broken empty link
    expect(curated).toBe('- Model: the C4 model\n'); // v0.8.5: renamed to a phrase, not emptied
  });

  it('drops a repo-relative link with an EMPTY label whole; keeps an empty-label kept-URL link (v0.8.3 safety net)', () => {
    const dropped = neutralizeRepoRelativeLinks('see [](../c4/src/x.c4) here');
    expect(dropped.body).not.toContain('c4/src/x.c4');
    expect(dropped.body).not.toContain('](');
    expect(neutralizeRepoRelativeLinks('[](#anchor)').body).toBe('[](#anchor)'); // # url is kept
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

describe('ConfluenceTree.stubLocalImages (v0.8 / v0.8.5 no-leak)', () => {
  it('stubs a local image by its alt text WITHOUT emitting the repo src path; keeps absolute ones', () => {
    const src = 'See ![C4 context](../c4/context.png) and ![remote](https://x.io/a.png).';
    const { body, stubbed } = stubLocalImages(src);
    expect(body).toContain('📐 C4 diagram placeholder — C4 context _(attachment embedding pending)_');
    expect(body).not.toContain('../c4/context.png'); // v0.8.5: the git src path never enters the body
    expect(body).not.toContain('![C4 context]'); // local embed replaced
    expect(body).toContain('![remote](https://x.io/a.png)'); // absolute kept
    expect(stubbed).toEqual(['../c4/context.png']); // still reported for the operator warning
  });

  it('falls back to the humanised src kind when there is no alt text (no path leak)', () => {
    expect(stubLocalImages('![](../c4/src/context.png)').body).toContain(
      '📐 C4 diagram placeholder — the C4 model _(attachment embedding pending)_',
    );
    expect(stubLocalImages('![](../img/x.png)').body).toContain(
      '📐 C4 diagram placeholder — a diagram _(attachment embedding pending)_',
    );
    expect(stubLocalImages('![](../c4/src/context.png)').body).not.toContain('c4/src');
  });

  it('is inline-safe — no leading blockquote `> ` lands mid-line for an inline image (R5)', () => {
    const { body } = stubLocalImages('Diagram ![d](../c4/x.png) shows the flow.');
    expect(body).toBe('Diagram 📐 C4 diagram placeholder — d _(attachment embedding pending)_ shows the flow.');
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
    expect(body).toContain('📐 C4 diagram placeholder — a [x] b _(attachment embedding pending)_');
    expect(body).not.toContain('../diagram.png'); // path not in body
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

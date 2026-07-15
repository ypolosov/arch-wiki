import { ArtifactKind } from '../model/ArtifactType';
import { GraphSnapshot } from '../model/Graph';
import { WikiPage, kindOfPage } from '../model/WikiPage';

/**
 * Pure helpers for the Confluence KB mirror (CAP-2). Decide page visibility,
 * derive the page-tree hierarchy from the wiki folder/hub structure, and resolve
 * `[[wikilinks]]` → cross-links using the published-pages ledger. No I/O — the
 * RenderConfluencePayload use-case feeds these the graph + page bodies + ledger map.
 */

export interface MirrorExclude {
  /** ADR statuses hidden from stakeholders (default: proposed/rejected). */
  statuses: string[];
  /** Maintenance/register/meta basenames hidden (default: risks/gap-analysis/kanban/epistemic-debt + the CLAUDE meta-doc). */
  basenames: string[];
}

export const DEFAULT_EXCLUDE: MirrorExclude = {
  statuses: ['proposed', 'rejected'],
  // `CLAUDE` = the Layer-3 schema/contributor doc (docs/architecture/CLAUDE.md): all git internals
  // (raw/, .foam/, c4/src/, register names), not stakeholder content → excluded from the mirror (v0.8.2 D).
  // `epistemic-debt` = the FPF B.3.4 decay register — an internal health doc, like gap-analysis.
  basenames: ['risks', 'gap-analysis', 'kanban', 'epistemic-debt', 'CLAUDE'],
};

export interface CrossLink {
  /** The wikilink target basename. */
  target: string;
  resolved: boolean;
  pageId?: string;
}

// Mirrors WikilinkScanner's pattern: [[target]] / [[target#anchor|alias]] / ![[embed]].
// Groups: 1=bang, 2=target, 3=anchor (without the #, e.g. `^C-003`), 4=alias. The anchor is captured
// (v0.8.6) so an excluded-register link can preserve its record-id (`#^C-003`) instead of collapsing to
// the generic register name.
const WIKILINK_RE = /(!?)\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g;

/**
 * Visibility filter (plan §12.10 Decision A). A page is excluded from the mirror
 * when frontmatter `confluence: false` / `audience: internal`, or it is an ADR in
 * an excluded status, or a register/maintenance page — UNLESS `confluence: true`
 * explicitly force-includes it.
 */
export function isPageExcluded(page: WikiPage, exclude: MirrorExclude): boolean {
  const fm = page.frontmatter as { confluence?: unknown; audience?: unknown; status?: unknown };
  if (fm.confluence === true) return false;
  if (fm.confluence === false || fm.audience === 'internal') return true;
  if (exclude.basenames.includes(page.basename)) return true;
  if (kindOfPage(page) === 'adr') {
    const st = String(fm.status ?? '').toLowerCase();
    if (st && exclude.statuses.includes(st)) return true;
  }
  return false;
}

/**
 * Parent page (by source relPath) for the Confluence tree:
 * - the wiki `index.md` is the root (null parent);
 * - a numbered artifact nests under its arc42 hub (if that hub is itself included);
 * - everything else (arc42 hubs, entities/concepts, …) nests under the root index.
 */
export function parentSourceOf(
  page: WikiPage,
  hubMap: ReadonlyMap<ArtifactKind, string | null>,
  includedSources: ReadonlySet<string>,
  indexSource: string | null,
): string | null {
  if (page.relPath === indexSource) return null;
  const kind = kindOfPage(page);
  if (kind && kind !== 'arc42') {
    const hub = hubMap.get(kind) ?? null;
    if (hub && hub !== page.relPath && includedSources.has(hub)) return hub;
  }
  return indexSource && indexSource !== page.relPath ? indexSource : null;
}

/** Depth of a page in the parent chain (root = 0); used for parent-first ordering. */
function depthOf(relPath: string, parents: ReadonlyMap<string, string | null>): number {
  let depth = 0;
  let cur = parents.get(relPath) ?? null;
  const seen = new Set<string>([relPath]);
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    depth += 1;
    cur = parents.get(cur) ?? null;
  }
  return depth;
}

/** Parent-first (topological) + stable order: by depth, then relPath. */
export function sortParentFirst(
  relPaths: string[],
  parents: ReadonlyMap<string, string | null>,
): string[] {
  return [...relPaths].sort(
    (a, b) => depthOf(a, parents) - depthOf(b, parents) || a.localeCompare(b),
  );
}

/**
 * The transient page-id used for a cross-link whose included target is not yet
 * published (only when `reserveUnresolved`). Pass 2 of publish overwrites it with the
 * real id once the target lands in the ledger — see `resolveCrossLinks`.
 */
export const PENDING_PAGE_ID = 'pending';

/**
 * Replace `[[wikilinks]]` in a page body with resolved cross-links. A target that
 * is a live, included, PUBLISHED page → a markdown link to the page's ROOT-RELATIVE
 * Confluence URL (`/wiki/spaces/<spaceKey>/pages/<id>`), which resolves from any
 * page regardless of where this page lives; an unpublished/excluded/absent target →
 * plain alias text (the placeholder rule). A bare page-id (the old form) published as
 * markdown becomes a *relative* `href` and 404s — hence the absolute-from-site-root
 * path. Deterministic given (graph, publishedMap, includedSources, spaceKey): no
 * fallback by title (so the body does not oscillate between runs). Returns the body +
 * cross-link log.
 *
 * `reserveUnresolved` (translation mode): an included-but-unpublished target is rendered
 * as a masked-link to a deterministic `…/pages/pending` URL instead of plain text. This
 * keeps the *masked body fed to the translator byte-identical* between pass 1 (target not
 * yet published) and pass 2 (resolved) — only the restore VALUE changes — so the page need
 * not be re-translated on pass 2 (gt feedback). Excluded/absent targets stay plain text
 * (they never resolve → no dangling link). Off (default) preserves the English-mirror behaviour.
 */
export function resolveCrossLinks(
  content: string,
  g: GraphSnapshot,
  publishedMap: ReadonlyMap<string, string>, // source relPath → Confluence page id
  includedSources: ReadonlySet<string>,
  spaceKey: string, // Confluence space key, for the root-relative cross-link URL
  reserveUnresolved = false,
): { body: string; crossLinks: CrossLink[] } {
  const crossLinks: CrossLink[] = [];
  let renamed = false; // a register phrase / id was substituted → run the seam tidy (no-drift gate)
  const body = content.replace(
    WIKILINK_RE,
    (_m, _bang, target: string, anchor?: string, alias?: string) => {
      const label = (alias ?? target).trim();
      const page = g.byBasename.get(target);
      const included = page ? includedSources.has(page.relPath) : false;
      const pageId = included ? publishedMap.get(page!.relPath) : undefined;
      if (pageId) {
        crossLinks.push({ target, resolved: true, pageId });
        return `[${label}](/wiki/spaces/${spaceKey}/pages/${pageId})`;
      }
      // v0.8.5 class 5: a wikilink to an EXCLUDED register (`[[risks]]`, `[[gap-analysis]]`) can never
      // become a mirror page — rename it to its human phrase ("the risk register") instead of dropping to
      // a bare alias (`risks`) or an alias that still carries a path. Only for a NOT-included target.
      const phrase = included ? '' : humanizeRepoRef(target);
      if (phrase) {
        renamed = true;
        // v0.8.6: when the link carries a record id — an id-shaped alias (`|C-003`) or an anchor
        // (`#^C-003`) — PREFER that id over the generic register name, so `Resolves [[risks#^C-003|C-003]]`
        // → `Resolves C-003` (grammatical + keeps traceability), not `Resolves the risk register`. A bare
        // `[[risks]]` (no id) still renders the phrase.
        const aliasId = alias?.trim() ?? '';
        if (RECORD_ID_RE.test(aliasId)) return aliasId;
        const anchorId = (anchor ?? '').replace(/^\^/, '').trim();
        if (RECORD_ID_RE.test(anchorId)) return anchorId;
        return phrase; // deliberate rename — not a cross-link, so no crossLinks entry
      }
      if (reserveUnresolved && included) {
        // Reserve the masked-link slot so the translatable body is stable across passes.
        crossLinks.push({ target, resolved: false });
        return `[${label}](/wiki/spaces/${spaceKey}/pages/${PENDING_PAGE_ID})`;
      }
      crossLinks.push({ target, resolved: false });
      return label;
    },
  );
  // v0.8.5 class 6: also resolve a MARKDOWN-form cross-link `[label](NNNN-slug.md)` to a mirrored
  // neighbour page — only `[[wikilinks]]` were resolved before, so a md-form link to a published ADR
  // (e.g. `**Supersedes:** [ADR-0023](0023-…md)`) fell through to neutralizeRepoRelativeLinks and lost
  // its hyperlink. Skips code/images/already-kept URLs; an excluded-register target → its phrase; a
  // not-yet-mirrored target is left untouched for neutralizeRepoRelativeLinks to flatten (placeholder).
  const linked = transformOutsideCode(body, (chunk) =>
    chunk.replace(MD_LINK_RE, (m, mdLabel: string, url: string) => {
      if (KEEP_LINK_URL.test(url)) return m;
      const noAnchor = url.replace(/[#?].*$/, '');
      if (!/\.md$/i.test(noAnchor)) return m; // only .md cross-links here
      const base = noAnchor.replace(/^.*\//, '').replace(/\.md$/i, '');
      const page = g.byBasename.get(base);
      const pageId = page && includedSources.has(page.relPath) ? publishedMap.get(page.relPath) : undefined;
      if (pageId) {
        crossLinks.push({ target: base, resolved: true, pageId });
        return `[${mdLabel}](/wiki/spaces/${spaceKey}/pages/${pageId})`;
      }
      // Not a mirrored page → leave the md-link for neutralizeRepoRelativeLinks to flatten to its
      // author-chosen label (the placeholder rule); any path inside the label is cleaned by B downstream.
      return m;
    }),
  );
  // v0.8.6: clean the seams a register rename left (duplicated article `the the`, adjacent identical
  // phrase). Gated on `renamed` so a page with no register rename is returned byte-identical (no drift).
  return { body: renamed ? tidyRenamedPhrases(linked) : linked, crossLinks };
}

/**
 * Split an artifact heading into its id prefix and the translatable label, e.g.
 * `UC-014: Login` → `{ prefix: 'UC-014:', label: 'Login' }`; a title without an id
 * prefix → `{ prefix: '', label: <title> }`. Lets the RU projection translate only the
 * label while the id prefix (trace key) stays byte-exact. Pure.
 */
export function splitTitle(title: string): { prefix: string; label: string } {
  const m = /^\s*([A-Za-z]+-\d+\S*:)\s*(.*)$/.exec(title);
  if (m) return { prefix: m[1]!, label: m[2]!.trim() };
  return { prefix: '', label: title.trim() };
}

// Markdown link whose URL is kept as-is in the mirror: absolute (http/https/mailto),
// in-Confluence root-relative (/wiki/…), or a pure #anchor. Anything else is a
// repo-relative path that 404s in Confluence.
const KEEP_LINK_URL = /^(?:https?:|mailto:|#|\/wiki\/)/;
// Non-image markdown link: not preceded by `!`. The label group is `*` (allows EMPTY, v0.8.3
// safety net): a repo-relative link with an empty label `[](../c4/x.c4)` — which a prior B pass
// could theoretically leave — is then dropped whole instead of surviving as a dead empty link.
const MD_LINK_RE = /(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g;

// Code spans kept verbatim by the mirror: tilde fences (~~~…~~~), ``` fences, ``double`` and
// `single` inline code. CommonMark uses multi-backtick spans to wrap content containing a literal
// backtick; a naive /`[^`\n]+`/ mis-splits ``…`` and corrupts a code-protected link inside it
// (review H1/M4). Backreference-free (each alternative is fixed-delimiter + lazy) to stay LINEAR —
// a `(`+)[\s\S]*?\1` form backtracks quadratically on a long run of unclosed backticks (review 2a).
const CODE_SPAN_RE = /~~~[\s\S]*?~~~|```[\s\S]*?```|``[\s\S]*?``|`[^`\n]*`/g;

/** Apply `fn` only to the parts of `content` OUTSIDE the (global) `pattern`'s matches. Pure. */
function transformOutsidePattern(content: string, pattern: RegExp, fn: (chunk: string) => string): string {
  let out = '';
  let last = 0;
  for (const m of content.matchAll(pattern)) {
    const start = m.index!;
    out += fn(content.slice(last, start)) + m[0];
    last = start + m[0].length;
  }
  return out + fn(content.slice(last));
}

/**
 * Apply `fn` only to the parts of `content` OUTSIDE fenced/inline code spans, leaving code
 * byte-exact. The link/image neutralisers run BEFORE the RU protect pass (which is also the only
 * pass that masks code), so without this a code sample that legitimately contains `[x](y)` /
 * `![x](y)` would be corrupted and would spuriously drift (R2, v0.8). Pure.
 */
export function transformOutsideCode(content: string, fn: (chunk: string) => string): string {
  return transformOutsidePattern(content, CODE_SPAN_RE, fn);
}

/**
 * A neutralised link's label that is a single token containing a dot (`CLAUDE.md`, `foo.example.com`)
 * is auto-linked by Confluence's markdown converter into a dead `http://CLAUDE.md` link (gt feedback,
 * item D). Wrap such a label in inline code to suppress the auto-link; in the RU projection that code
 * span is then protected byte-exact. Other labels pass through unchanged. Pure.
 */
function protectAutolinkLabel(label: string): string {
  return /^\S+$/.test(label) && label.includes('.') && !label.includes('`') ? `\`${label}\`` : label;
}

/**
 * Neutralise repo-relative markdown links (`[x](../iterations/)`, `[CLAUDE.md](../../CLAUDE.md)`)
 * to plain text — they are not wiki cross-links and render as dead relative hrefs in Confluence
 * (gt feedback). Keeps absolute links, resolved `/wiki/…` cross-links, pure `#anchor`s, image
 * embeds and code spans untouched. A filename/domain-like label is wrapped in inline code so
 * Confluence does not auto-link it (item D). Pure; returns the body + the stripped URLs (sorted).
 */
export function neutralizeRepoRelativeLinks(content: string): { body: string; stripped: string[] } {
  const stripped: string[] = [];
  const body = transformOutsideCode(content, (chunk) =>
    chunk.replace(MD_LINK_RE, (m, label: string, url: string) => {
      if (KEEP_LINK_URL.test(url)) return m;
      stripped.push(url);
      // A bare wiki-directory label keeps a trailing-slash path fragment when its dead link is stripped
      // (`[iterations/](iterations/)` → `iterations/`). Drop the slash so it reads as a plain word
      // (`iterations`), not a path leftover (v0.8.6 index.md residual).
      const lbl = /^[\w-]+\/$/.test(label) ? label.slice(0, -1) : label;
      return protectAutolinkLabel(lbl);
    }),
  );
  return { body, stripped: [...new Set(stripped)].sort((a, b) => a.localeCompare(b)) };
}

// A wiki page's `## Sources` provenance section (schema rule 6) points back to the git
// source-of-truth (`raw/<file>` paths) — by-design IN the wiki, but it must NOT leak into the
// Confluence mirror (the mirror is a curated projection of Layer-2, not a byte copy: no git
// source-of-truth, raw paths or repo URLs). H2 heading; a section terminates at the next heading
// of level ≤ 2 (a `###` subheading stays part of Sources) or EOF.
const SOURCES_HEADING_RE = /^##[ \t]+Sources[ \t]*$/i;
const TOP_HEADING_RE = /^#{1,2}[ \t]/;
const FENCE_LINE_RE = /^[ \t]*(?:```|~~~)/;

/**
 * Drop the `## Sources` provenance section from a page body so the mirror never publishes a link
 * back to the git source-of-truth (gt feedback v0.8.1: 36/133 pages leaked raw/ paths — the path
 * sits as inline code, which `neutralizeRepoRelativeLinks` skips). Fence-aware (a `## Sources`
 * inside a ```/~~~ code block is left alone). Pure; called BEFORE the content hash + RU masking, so
 * the affected pages drift once and re-publish clean. The wiki schema (rule 6) is untouched —
 * this is a Layer-2 → Confluence projection step only. Returns the body + whether a section was cut.
 */
export function stripSourcesSection(content: string): { body: string; stripped: boolean } {
  const lines = content.split('\n');
  const out: string[] = [];
  let inFence = false;
  let stripped = false;
  for (let i = 0; i < lines.length; ) {
    const line = lines[i]!;
    if (FENCE_LINE_RE.test(line)) {
      inFence = !inFence;
      out.push(line);
      i += 1;
      continue;
    }
    if (!inFence && SOURCES_HEADING_RE.test(line)) {
      stripped = true;
      i += 1; // drop the `## Sources` heading itself
      let fenced = false;
      while (i < lines.length) {
        const l = lines[i]!;
        if (FENCE_LINE_RE.test(l)) {
          fenced = !fenced;
          i += 1;
          continue;
        }
        if (!fenced && TOP_HEADING_RE.test(l)) break; // a level-≤2 heading ends the section (kept)
        i += 1; // drop a Sources-section body line (incl. `###` subheadings)
      }
      continue;
    }
    out.push(line);
    i += 1;
  }
  // Collapse any trailing blank lines a trailing-Sources cut leaves behind (the caller re-normalises).
  return { body: out.join('\n').replace(/\n[ \t\n]*$/, '\n'), stripped };
}

// ── Repo-internal source provenance (v0.8.2) ────────────────────────────────────────────────
// The mirror is a CURATED projection: beyond the `## Sources` section (v0.8.1), the git
// source-of-truth must not leak ANYWHERE — inline `**Source:**` fields, repo paths in prose/code,
// or register filenames. The matcher is a STRICT anchored allowlist to avoid false positives on C4
// element ids (`product.gaming.brand.core.service`) and domain terms: ONLY a path under a known repo
// root, a `*.c4`/`*.csv` file, or a known register/meta filename counts — never an arbitrary `*.md`
// or a dotted identifier. External/POC git URLs (bitbucket.org/…, git.shakuro.com) are NOT matched —
// they are decision-evidence in ADRs, kept by design (acceptance criterion tier ii).
// The repo-root alternative trails `[\w./-]*` (NOT `+`, v0.8.3): a bare root `c4/` / `raw/` /
// `.foam/` / `docs/architecture/` (no path tail — e.g. the "Three layers" repo-structure table in
// index.md) is itself a leak and must match too.
const REPO_PATH_SRC =
  '(?:' +
  '(?:\\.{1,2}/)*(?:raw|c4|\\.foam|docs/architecture)/[\\w./\\-*]*' + // a path under (or the bare) repo root; `*` so a glob `c4/src/*.c4` matches whole (v0.8.5 class 7)
  '|' +
  '[\\w./\\-]*[\\w\\-]\\.(?:c4|csv)\\b' + // a *.c4 / *.csv file (repo-internal extensions)
  '|' +
  '(?:risks|gap-analysis|kanban|glossary|utility-tree|CLAUDE)\\.md\\b' + // a known register/meta file
  ')';
// A left word-boundary lookbehind keeps the scan from matching a repo root buried inside a larger
// token (`draw/x` must NOT match `raw/x`; `scc4/y` must NOT match `c4/y`) — v0.8.3. The anchored test
// needs no lookbehind (`^` bounds it); the paren/connective patterns are bounded by their keyword + `\s`.
const REPO_PATH_RE = new RegExp(`(?<![\\w./\\-])${REPO_PATH_SRC}`, 'g'); // scan/replace
const REPO_PATH_CONTAINS_RE = new RegExp(`(?<![\\w./\\-])${REPO_PATH_SRC}`); // stateless .test (no /g)
const REPO_PATH_ANCHORED_RE = new RegExp(`^${REPO_PATH_SRC}$`); // whole-token test

/**
 * True if `token` (trimmed) is, on its own, a repo-internal source path / register file the curated
 * mirror must not expose. Anchored: a C4 element id (`product.gaming.brand.core.service`), a plain
 * `README.md`, or a domain term is NOT a match. Pure.
 */
export function isRepoInternalPath(token: string): boolean {
  return REPO_PATH_ANCHORED_RE.test(token.trim());
}

/**
 * Every repo-internal source path that LEAKED into already-projected mirror text (the
 * curated-mirror faithfulness gate, acceptance tier i — FPF A.6.3.CSC ControlledSemanticCoarsening:
 * the git source-of-truth must not survive the projection). External/POC git URLs
 * (bitbucket.org/…, git.shakuro.com) are decision-evidence and are NOT matched (tier ii). Pure.
 */
export function findRepoPathLeaks(text: string): string[] {
  return [...new Set([...text.matchAll(REPO_PATH_RE)].map((m) => m[0]))].sort();
}

const REGISTER_PHRASES: Readonly<Record<string, string>> = {
  risks: 'the risk register',
  'gap-analysis': 'the gap analysis',
  kanban: 'the backlog',
  glossary: 'the glossary',
  'utility-tree': 'the utility tree',
  // "the contributor guide" (NOT "the schema contract", v0.8.6): CLAUDE.md is the schema/contributor
  // doc, and renaming it to "schema contract" collided with prose that already says "schema contract"
  // (`the schema contract lives in the schema contract`).
  claude: 'the contributor guide',
};

/**
 * Map a repo-internal reference (a path / register file / C4 source — as matched by REPO_PATH_RE or a
 * wikilink/md-link target) to a human-readable phrase for the Confluence mirror. v0.8.5 DELETE→RENAME:
 * deleting a path from prose left dangling verbs/connectives ("risk tracked in." / " directs …"); a
 * deterministic rename keeps the sentence whole ("risk tracked in the risk register."). Returns `''`
 * ONLY for a reference we deliberately drop (`.foam` IDE tooling) or an unrecognised token — the caller
 * then deletes it (the old behaviour, no leak). Pure.
 *
 * Classified by KIND specificity, not directory: a `.c4`/`.csv` extension or a register basename wins
 * over the enclosing `raw/` or `docs/architecture/` directory (so `raw/go-live.csv` → "the data file").
 * A register name counts only as a bare top-level reference (`risks.md`, `[[risks]]`); the same name
 * under a directory (`raw/risks.md`) is classified by its directory ("the source brief").
 */
export function humanizeRepoRef(token: string): string {
  const base = token
    .trim()
    .replace(/^[`'"]+|[`'"]+$/g, '') // strip wrapping backticks/quotes
    .replace(/[#?].*$/, '') // drop a #anchor / ?query
    .replace(/\/+$/, '') // drop a trailing slash (bare root `c4/`)
    .toLowerCase();
  // C4 sources: a *.c4 file, anything under the c4/ tree, or a bare c4/ root → the model / a view.
  if (/\.c4\b/.test(base) || /(?:^|\/)c4(?:\/|$)/.test(base)) {
    // Left-anchored on `^`/`/` so the sub-type matches only the canonical FILENAME, not a substring of
    // a longer basename (`reviews.c4` / `overview.c4` must be "the C4 model", not "the C4 views").
    if (/(?:^|\/)views?\.c4\b/.test(base)) return 'the C4 views';
    if (/(?:^|\/)deployment\.c4\b/.test(base)) return 'the C4 deployment view';
    return 'the C4 model';
  }
  if (/\.csv\b/.test(base)) return 'the data file';
  // Register / meta file referenced bare (top-level, no directory): `risks.md` / `[[risks]]`.
  if (!base.includes('/')) {
    const reg = REGISTER_PHRASES[base.replace(/\.md$/, '')];
    if (reg) return reg;
  }
  if (/(?:^|\/)raw(?:\/|$)/.test(base)) return 'the source brief';
  if (/(?:^|\/)\.foam(?:\/|$)/.test(base)) return ''; // IDE template store → drop
  if (/(?:^|\/)docs\/architecture(?:\/|$)/.test(base)) return 'the architecture wiki';
  return ''; // unrecognised repo ref → delete (no leak); should not occur given the allowlist
}

// A record id such as `C-003` / `Q-012` / `R-7` / `ADR-0049` — used to PRESERVE the id when an excluded
// register wikilink carries it as an anchor (`#^C-003`) or an id-shaped alias (v0.8.6).
const RECORD_ID_RE = /^[A-Za-z]{1,4}-\d+$/;

// The closed vocabulary humanizeRepoRef can emit (every value of the map). Used to collapse an
// adjacent-repeat of the SAME phrase that naive rename produced (`the source brief, the source brief`
// from `raw/A, raw/B`) — bounded to this set so ordinary prose repetition is never touched. v0.8.6.
const REPO_PHRASES: readonly string[] = [
  'the risk register',
  'the gap analysis',
  'the backlog',
  'the glossary',
  'the utility tree',
  'the C4 deployment view',
  'the C4 views',
  'the C4 model',
  'the source brief',
  'the data file',
  'the architecture wiki',
  'the contributor guide',
];
const PHRASE_ALT = REPO_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// Adjacent identical phrase separated only by ` / , ;` → collapse to one (`\1` requires identical).
const ADJACENT_PHRASE_RE = new RegExp(`(${PHRASE_ALT})(?:[ \\t]*[\\/,;][ \\t]*\\1\\b)+`, 'g');
// A duplicated DEFINITE article left by inserting a "the …" phrase right after an existing "the"
// (`in the [[kanban|…]]` → `in the the backlog`). Keep one "the" (its case), drop the duplicate.
const DOUBLE_THE_RE = /\b([Tt]he)[ \t]+the\b/g;
// An INDEFINITE article ("a"/"an") immediately before an inserted "the …" phrase (`a [[risks]]` →
// `a the risk register`). Keeping "a"/"an" is wrong — "a risk register" loses the definite sense and
// "an risk register" is broken English — so DROP the indefinite article and keep the phrase's "the"
// (preserving sentence-start capitalisation). v0.8.6 review.
const INDEF_THE_RE = /\b([Aa])n?[ \t]+the\b/g;

/**
 * Clean the two seams a naive in-place rename can leave when a "the …" phrase is substituted into prose
 * (v0.8.6): a duplicated leading article (`the the backlog` → `the backlog`) and an adjacent repeat of
 * the SAME phrase from two different refs (`the source brief, the source brief` → `the source brief`).
 * Bounded to the closed REPO_PHRASES vocabulary, so genuine prose is untouched. Callers apply it ONLY to
 * a string that actually received a rename (preserving the no-false-drift invariant). Pure.
 */
export function tidyRenamedPhrases(s: string): string {
  return s
    .replace(DOUBLE_THE_RE, '$1') // "the the X" → "the X"
    .replace(INDEF_THE_RE, (_m, a) => (a === 'A' ? 'The' : 'the')) // "a/an the X" → "the X"
    .replace(ADJACENT_PHRASE_RE, '$1'); // "the X, the X" → "the X"
}

// A `**Source…:**` author field (NOT the QA-scenario `- **Source:** <actor>` 6-part field — that
// one carries a domain value, not a path; it is left alone by the repo-path-value condition below).
// Group 1 = the field LABEL (incl. list marker), group 2 = the VALUE — split so a value carrying a
// non-git remainder (Jira key, expert attribution) survives the path cut (v0.8.3 minor).
const SOURCE_FIELD_RE = /^(\s*[-*]?\s*\*\*Source[^*\n]*:\*\*)(.*)$/i;

/**
 * Curate `**Source…:**` provenance field lines whose VALUE cites the git source-of-truth (a
 * repo-internal path). Gating on the path VALUE (not the field label) keeps the QA-scenario
 * `- **Source:** user clicks…` field untouched (no path → not a leak). RENAMES the git path to its
 * human phrase via neutralizeRepoPaths (v0.8.5), KEEPING any non-git remainder:
 * `- **Source:** docs/architecture/raw/TODO.md (2026-06)` → `- **Source:** the source brief (2026-06)`;
 * `- **Source:** GRM-3705 — strategy (raw/x.md)` → `- **Source:** GRM-3705 — strategy (the source brief)`.
 * Drops the whole line only when nothing alphanumeric remains (e.g. a `.foam/`-only value). Fence-aware. Pure.
 */
export function stripSourceProvenanceLines(content: string): { body: string; stripped: boolean } {
  const lines = content.split('\n');
  const out: string[] = [];
  let inFence = false;
  let stripped = false;
  for (const line of lines) {
    if (FENCE_LINE_RE.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (!inFence) {
      const m = SOURCE_FIELD_RE.exec(line);
      if (m && REPO_PATH_CONTAINS_RE.test(m[2]!)) {
        stripped = true;
        const { body: cleanedValue } = neutralizeRepoPaths(m[2]!);
        // Drop the whole line only if the value was nothing but the path; otherwise keep the label +
        // the neutralised remainder (trailing whitespace from the cut trimmed off).
        if (!/[A-Za-z0-9]/.test(cleanedValue)) continue;
        out.push((m[1]! + cleanedValue).replace(/[ \t]+$/, ''));
        continue;
      }
    }
    out.push(line);
  }
  return { body: out.join('\n').replace(/\n[ \t\n]*$/, '\n'), stripped };
}

// B skips, verbatim: fenced code; markdown link/image URLs `](…)` (handled by
// neutralizeRepoRelativeLinks / stubLocalImages — incl. the C4 stub `![..](../c4/x.png)`); AND bare
// http(s) URLs — external/POC git URLs (bitbucket.org/…, git.shakuro.com) are decision-evidence kept
// by design (acceptance tier ii), and a repo-ish tail like `…/src/x.c4` inside one must NOT be eaten.
// B targets INLINE code + prose, so (unlike transformOutsideCode) it does NOT skip inline-code spans.
const B_SKIP_RE = /~~~[\s\S]*?~~~|```[\s\S]*?```|\]\([^)\n]*\)|https?:\/\/[^\s)\]]+/g;
// A provenance parenthetical emptied to just its keyword — collapsed in the tidy pass (belt-and-
// suspenders for the rare drop, e.g. a `.foam/` ref that humanizeRepoRef removes rather than renames).
const EMPTY_PROVENANCE_PAREN_RE = /\((?:from|see|source):?[ \t]*\)/gi;
const INLINE_CODE_SPAN_RE = /`[^`\n]+`/g;

/**
 * Rewrite repo-internal path references that survive outside the `## Sources` section / `**Source:**`
 * fields into HUMAN PHRASES (v0.8.5 DELETE→RENAME): an inline-code repo path (`` `c4/src/x.c4` ``) or a
 * bare register/`.c4`/`.csv`/repo-root token in prose/tables/headings becomes "the C4 model" / "the risk
 * register" / … via `humanizeRepoRef`, so the surrounding sentence stays whole. Deleting the token (the
 * pre-v0.8.5 behaviour) left dangling verbs/connectives ("risk tracked in." / " directs …") and stumps
 * that the narrow v0.8.3 acceptance checks missed. There is no longer a separate connective/parenthetical
 * step — the connective ("in"), the keyword ("from") and the parens all survive naturally once the path
 * itself is renamed in place (`tracked in `risks.md`.` → `tracked in the risk register.`). A token that
 * `humanizeRepoRef` maps to `''` (e.g. `.foam/`) is deleted, with the tidy pass cleaning the gap.
 *
 * Skips fenced code (verbatim samples), markdown link/image URLs `](…)` (handled by
 * neutralizeRepoRelativeLinks / stubLocalImages) and bare http(s) URLs (external/POC evidence, tier ii).
 * Strict anchored allowlist → a C4 id / domain term is never touched. Pure; returns body + touched.
 */
export function neutralizeRepoPaths(content: string): { body: string; neutralized: boolean } {
  let neutralized = false;
  const body = transformOutsidePattern(content, B_SKIP_RE, (chunk) => {
    let s = chunk;
    // 1. An inline-code repo path (`` `c4/src/x.c4` ``) → its human phrase (backticks gone).
    s = s.replace(INLINE_CODE_SPAN_RE, (m) => {
      const inner = m.slice(1, -1);
      if (isRepoInternalPath(inner)) {
        neutralized = true;
        return humanizeRepoRef(inner);
      }
      return m;
    });
    // 2. A bare (non-code) repo path / register file / bare repo root in prose, tables, headings.
    s = s.replace(REPO_PATH_RE, (m) => {
      neutralized = true;
      return humanizeRepoRef(m);
    });
    // Only tidy a chunk that actually changed — a clean chunk stays BYTE-IDENTICAL (so a page with no
    // git paths never drifts), and a boundary space adjacent to a skipped URL/code span is preserved.
    // The litter below is mostly residual from the rare drop (`''`) case; a rename leaves the sentence
    // intact so little tidying is needed.
    if (s === chunk) return chunk;
    return tidyRenamedPhrases(s) // v0.8.6: `the the backlog` / `the source brief, the source brief`
      .replace(EMPTY_PROVENANCE_PAREN_RE, '') // `(from)` left by a dropped path
      .replace(/\([ \t]*[,;][ \t]*/g, '(') // leading comma/semicolon just inside an open paren
      .replace(/\([ \t]+/g, '(') // space just inside an open paren
      .replace(/\([ \t]*\)/g, '') // empty parens
      .replace(/([^.\n])\.[ \t]*\.(?!\.)/g, '$1.') // accidental double period (not an ellipsis)
      .replace(/[ \t]{2,}/g, ' ') // doubled spaces
      .replace(/[ \t]+([.,;:!?)])/g, '$1') // space stranded before punctuation
      .replace(/[ \t]+\n/g, '\n'); // trailing whitespace before a newline
  });
  return { body, neutralized };
}

/**
 * Build a Confluence page URL. Absolute when `siteUrl` is set (required for a link that
 * works inside a Jira issue's ADF), else root-relative `/wiki/…`. Pure.
 */
export function confluencePageUrl(
  siteUrl: string | null,
  spaceKey: string,
  pageId: string,
): string {
  const base = siteUrl ? siteUrl.replace(/\/+$/, '') : '';
  return `${base}/wiki/spaces/${spaceKey}/pages/${pageId}`;
}

/**
 * Build a Jira issue browse URL `<siteUrl>/browse/<KEY>` for the reverse trace edge on a
 * mirror page (NOT a Confluence /wiki URL — a distinct host path). Pure; `siteUrl` required.
 */
export function jiraBrowseUrl(siteUrl: string, key: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/browse/${key}`;
}

// Image embed whose src is a LOCAL/repo-relative path (not http/https): the Confluence
// mirror can't reach it (no attachment-upload tool in the MCP), so it renders broken. The alt
// group is non-greedy up to the literal `](` so alt text containing brackets (`![a [x] b](…)`)
// is still captured and stubbed (review M3).
const LOCAL_IMAGE_RE = /!\[([\s\S]*?)\]\((?!https?:)([^)\s]+)\)/g;

/**
 * Replace local image embeds (`![alt](../c4/context.png)`) with a deterministic stub so the
 * mirror reflects WHERE a diagram belongs without a broken image — real C4/attachment
 * embedding is deferred (the Atlassian MCP exposes no upload tool). The human descriptor is the
 * image's ALT text (or, if absent, the humanised kind of its `src`, e.g. "the C4 model"); the raw
 * repo `src` path is NOT emitted into the body — that path is git source-of-truth and would leak
 * into the mirror AND into the RU-mask `restore` values (v0.8.5 no-leak; the `src` is still
 * reported in `stubbed` for the operator warning). Absolute (http/https) images and code spans are
 * left untouched. The placeholder is INLINE-safe (no leading `> ` blockquote marker, which would
 * land mid-line for an inline image and render a stray `>` — R5, v0.8). Pure; returns the body +
 * the stubbed sources (sorted, for warnings).
 */
export function stubLocalImages(content: string): { body: string; stubbed: string[] } {
  const stubbed: string[] = [];
  const body = transformOutsideCode(content, (chunk) =>
    chunk.replace(LOCAL_IMAGE_RE, (_m, alt: string, src: string) => {
      stubbed.push(src);
      const descriptor = alt.trim() || humanizeRepoRef(src) || 'a diagram';
      return `📐 C4 diagram placeholder — ${descriptor} _(attachment embedding pending)_`;
    }),
  );
  return { body, stubbed: [...new Set(stubbed)].sort((a, b) => a.localeCompare(b)) };
}

// ---------------------------------------------------------------------------
// CAP-2 RU projection (v0.6, plan §13). The Confluence mirror may be a TRANSLATED
// presentation projection (canon stays English in Layer-2). Translation is the LLM
// map-step (invariant #6) — but STRUCTURAL tokens that must survive byte-exact (code,
// markdown link URLs incl. the resolved /wiki cross-links, artifact-id tokens) are
// protected DETERMINISTICALLY by Core: render masks them to opaque placeholders, the
// LLM translates the surrounding prose, and `finalize-confluence` restores them. The
// hash stays over the ENGLISH source (drift stability), so translation never oscillates.
// ---------------------------------------------------------------------------

export interface ProtectedSpan {
  /** Opaque placeholder substituted into the body (kept verbatim through translation). */
  token: string;
  /** The exact English span it replaced (restored after translation). */
  original: string;
}

const PROTECT_PREFIX = '%%AWP';
const PROTECT_SUFFIX = '%%';

// Ordered structural maskers. Code FIRST (so backticks/links/ids inside code are not
// re-masked), then markdown link URLs (the bare url inside `](…)`), then artifact-id
// tokens (CONC before CON so the longer prefix wins). Each pass masks left-to-right.
// The code pattern matches the same fenced/inline forms as CODE_SPAN_RE (tilde fences +
// any backtick run), so the RU mask protects ``double``-backtick and ~~~ code too (H1/M4).
const STRUCTURAL_PATTERNS: readonly RegExp[] = [
  /~~~[\s\S]*?~~~|```[\s\S]*?```|``[\s\S]*?``|`[^`\n]*`/g, // fenced + inline code (linear, see CODE_SPAN_RE)
  /(?<=\]\()[^)\s]+(?=\))/g, // markdown/image link URL
  /\b(?:UC|QA|CONC|CON|ADR|ITER)-\d{2,4}\b/g, // artifact-id tokens
];

/** Escape regex metacharacters so a denylist term is matched literally. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace structural spans (code, link URLs, artifact ids) AND deny-listed terms with opaque
 * `%%AWP<n>%%` placeholders so an LLM translation pass cannot alter them. Deterministic: the same
 * English body + same `preserveTerms` always yields the same masked text + ordered restore map.
 *
 * `preserveTerms` (B-1, v0.8): config `confluence.preserveTerms` merged with glossary bold terms.
 * Masking them in Core (rather than only listing them in the translator prompt) makes "keep these
 * verbatim" DETERMINISTIC instead of LLM discretion. Matched literally (metachars escaped), with a
 * word boundary (`[\w-]`) on each side so a term is not matched inside a longer word, case-sensitive,
 * longest-first so a shorter term that is a prefix of another does not shadow it. Applied AFTER the
 * structural patterns — a term already inside masked code/url is gone from `masked`, so it is not
 * double-masked. Pure.
 */
export function protectStructuralSpans(
  body: string,
  preserveTerms: readonly string[] = [],
): { masked: string; restore: ProtectedSpan[] } {
  // Collision-free placeholder prefix: if the source literally contains our default prefix (e.g. a
  // page documenting the masking format, or a preserveTerm of shape `AWP<n>`), lengthen it until
  // absent — a generated token can then never coincide with source text, so restore stays a
  // byte-exact round-trip (review L1). Deterministic: the same body always picks the same prefix.
  let prefix = PROTECT_PREFIX;
  while (body.includes(prefix)) prefix += 'X';
  const tokenRe = new RegExp(`${escapeRegExp(prefix)}\\d+${escapeRegExp(PROTECT_SUFFIX)}`, 'g');

  const restore: ProtectedSpan[] = [];
  let masked = body;
  let n = 0;
  const emit = (m: string): string => {
    const token = `${prefix}${n}${PROTECT_SUFFIX}`;
    n += 1;
    restore.push({ token, original: m });
    return token;
  };
  // Structural patterns run over the whole string (their patterns never match an emitted token).
  for (const re of STRUCTURAL_PATTERNS) masked = masked.replace(re, emit);
  // Term patterns run ONLY outside already-emitted placeholders, so a term that happens to match a
  // token's interior (e.g. `AWP0`) cannot corrupt it (review M1). The boundary class excludes `_`
  // so an underscore-emphasised / snake_case-adjacent term is still masked (review M2), but keeps
  // `-` so a hyphenated compound is treated as one word.
  const terms = [...new Set(preserveTerms)]
    .filter((t) => t.trim().length > 0)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
  for (const term of terms) {
    const termRe = new RegExp(`(?<![A-Za-z0-9-])${escapeRegExp(term)}(?![A-Za-z0-9-])`, 'g');
    masked = transformOutsidePattern(masked, tokenRe, (chunk) => chunk.replace(termRe, emit));
  }
  return { masked, restore };
}

/**
 * Substitute protected placeholders back into a (translated) body. Reports any token
 * the translation dropped (`missing`) so the caller can refuse to publish a page that
 * lost protected content. Pure; order-independent (originals never contain tokens).
 */
export function applyRestore(
  text: string,
  restore: readonly ProtectedSpan[],
): { body: string; missing: string[] } {
  let body = text;
  const missing: string[] = [];
  for (const { token, original } of restore) {
    if (!body.includes(token)) {
      missing.push(token);
      continue;
    }
    body = body.split(token).join(original);
  }
  return { body, missing };
}

/**
 * Best-effort glossary terms = every **bold** span in `glossary.md`. These are merged
 * into the translation denylist (`preserveTerms`) so domain/IT terms stay English. Pure.
 */
export function extractGlossaryTerms(glossaryMarkdown: string): string[] {
  const terms = new Set<string>();
  for (const m of glossaryMarkdown.matchAll(/\*\*(.+?)\*\*/g)) {
    const t = m[1]!.trim();
    if (t) terms.add(t);
  }
  return [...terms].sort((a, b) => a.localeCompare(b));
}

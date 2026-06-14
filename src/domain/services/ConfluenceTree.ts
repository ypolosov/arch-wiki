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
  /** Maintenance/register basenames hidden (default: risks/gap-analysis/kanban). */
  basenames: string[];
}

export const DEFAULT_EXCLUDE: MirrorExclude = {
  statuses: ['proposed', 'rejected'],
  basenames: ['risks', 'gap-analysis', 'kanban'],
};

export interface CrossLink {
  /** The wikilink target basename. */
  target: string;
  resolved: boolean;
  pageId?: string;
}

// Mirrors WikilinkScanner's pattern: [[target]] / [[target#anchor|alias]] / ![[embed]].
const WIKILINK_RE = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;

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
  const body = content.replace(WIKILINK_RE, (_m, _bang, target: string, alias?: string) => {
    const label = (alias ?? target).trim();
    const page = g.byBasename.get(target);
    const included = page ? includedSources.has(page.relPath) : false;
    const pageId = included ? publishedMap.get(page!.relPath) : undefined;
    if (pageId) {
      crossLinks.push({ target, resolved: true, pageId });
      return `[${label}](/wiki/spaces/${spaceKey}/pages/${pageId})`;
    }
    if (reserveUnresolved && included) {
      // Reserve the masked-link slot so the translatable body is stable across passes.
      crossLinks.push({ target, resolved: false });
      return `[${label}](/wiki/spaces/${spaceKey}/pages/${PENDING_PAGE_ID})`;
    }
    crossLinks.push({ target, resolved: false });
    return label;
  });
  return { body, crossLinks };
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
// Non-image markdown link: not preceded by `!`.
const MD_LINK_RE = /(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/g;

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
      return protectAutolinkLabel(label);
    }),
  );
  return { body, stripped: [...new Set(stripped)].sort((a, b) => a.localeCompare(b)) };
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
 * embedding is deferred (the Atlassian MCP exposes no upload tool). The `src` is wrapped in
 * inline code so the RU projection protects it byte-exact. Absolute (http/https) images and
 * code spans are left untouched. The placeholder is INLINE-safe (no leading `> ` blockquote
 * marker, which would land mid-line for an inline image and render a stray `>` — R5, v0.8).
 * Pure; returns the body + the stubbed sources (sorted, for warnings).
 */
export function stubLocalImages(content: string): { body: string; stubbed: string[] } {
  const stubbed: string[] = [];
  const body = transformOutsideCode(content, (chunk) =>
    chunk.replace(LOCAL_IMAGE_RE, (_m, alt: string, src: string) => {
      stubbed.push(src);
      const label = alt.trim() ? ` (${alt.trim()})` : '';
      return `📐 C4 diagram placeholder — source \`${src}\`${label} _(attachment embedding pending)_`;
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

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
 * Replace `[[wikilinks]]` in a page body with resolved cross-links. A target that
 * is a live, included, PUBLISHED page → a markdown link to the page's ROOT-RELATIVE
 * Confluence URL (`/wiki/spaces/<spaceKey>/pages/<id>`), which resolves from any
 * page regardless of where this page lives; an unpublished/excluded/absent target →
 * plain alias text (the placeholder rule). A bare page-id (the old form) published as
 * markdown becomes a *relative* `href` and 404s — hence the absolute-from-site-root
 * path. Deterministic given (graph, publishedMap, includedSources, spaceKey): no
 * fallback by title (so the body does not oscillate between runs). Returns the body +
 * cross-link log.
 */
export function resolveCrossLinks(
  content: string,
  g: GraphSnapshot,
  publishedMap: ReadonlyMap<string, string>, // source relPath → Confluence page id
  includedSources: ReadonlySet<string>,
  spaceKey: string, // Confluence space key, for the root-relative cross-link URL
): { body: string; crossLinks: CrossLink[] } {
  const crossLinks: CrossLink[] = [];
  const body = content.replace(WIKILINK_RE, (_m, _bang, target: string, alias?: string) => {
    const label = (alias ?? target).trim();
    const page = g.byBasename.get(target);
    const pageId = page && includedSources.has(page.relPath) ? publishedMap.get(page.relPath) : undefined;
    if (pageId) {
      crossLinks.push({ target, resolved: true, pageId });
      return `[${label}](/wiki/spaces/${spaceKey}/pages/${pageId})`;
    }
    crossLinks.push({ target, resolved: false });
    return label;
  });
  return { body, crossLinks };
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
const STRUCTURAL_PATTERNS: readonly RegExp[] = [
  /```[\s\S]*?```/g, // fenced code blocks
  /`[^`\n]+`/g, // inline code
  /(?<=\]\()[^)\s]+(?=\))/g, // markdown/image link URL
  /\b(?:UC|QA|CONC|CON|ADR|ITER)-\d{2,4}\b/g, // artifact-id tokens
];

/**
 * Replace structural spans (code, link URLs, artifact ids) with opaque `%%AWP<n>%%`
 * placeholders so an LLM translation pass cannot alter them. Deterministic: the same
 * English body always yields the same masked text + ordered restore map. Pure.
 */
export function protectStructuralSpans(body: string): { masked: string; restore: ProtectedSpan[] } {
  const restore: ProtectedSpan[] = [];
  let masked = body;
  let n = 0;
  for (const re of STRUCTURAL_PATTERNS) {
    masked = masked.replace(re, (m) => {
      const token = `${PROTECT_PREFIX}${n}${PROTECT_SUFFIX}`;
      n += 1;
      restore.push({ token, original: m });
      return token;
    });
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

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
 * is a live, included, PUBLISHED page → a markdown link by Confluence page-id; an
 * unpublished/excluded/absent target → plain alias text (the placeholder rule).
 * Deterministic given (graph, publishedMap, includedSources): no fallback by title
 * (so the body does not oscillate between runs). Returns the body + cross-link log.
 */
export function resolveCrossLinks(
  content: string,
  g: GraphSnapshot,
  publishedMap: ReadonlyMap<string, string>, // source relPath → Confluence page id
  includedSources: ReadonlySet<string>,
): { body: string; crossLinks: CrossLink[] } {
  const crossLinks: CrossLink[] = [];
  const body = content.replace(WIKILINK_RE, (_m, _bang, target: string, alias?: string) => {
    const label = (alias ?? target).trim();
    const page = g.byBasename.get(target);
    const pageId = page && includedSources.has(page.relPath) ? publishedMap.get(page.relPath) : undefined;
    if (pageId) {
      crossLinks.push({ target, resolved: true, pageId });
      return `[${label}](${pageId})`;
    }
    crossLinks.push({ target, resolved: false });
    return label;
  });
  return { body, crossLinks };
}

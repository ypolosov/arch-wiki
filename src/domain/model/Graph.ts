import { ArtifactKind } from './ArtifactType';
import { WikiPage, kindOfPage } from './WikiPage';

export interface GraphSnapshot {
  pages: WikiPage[];
  /** basename → page. */
  byBasename: Map<string, WikiPage>;
}

export function buildGraph(pages: WikiPage[]): GraphSnapshot {
  const byBasename = new Map<string, WikiPage>();
  for (const p of pages) byBasename.set(p.basename, p);
  return { pages, byBasename };
}

/** Count inbound wikilinks per target basename. */
export function inboundCounts(g: GraphSnapshot): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of g.pages) {
    for (const l of p.links) counts.set(l.target, (counts.get(l.target) ?? 0) + 1);
  }
  return counts;
}

export function pagesOfKind(g: GraphSnapshot, kinds: ArtifactKind[]): WikiPage[] {
  const set = new Set(kinds);
  return g.pages.filter((p) => {
    const k = kindOfPage(p);
    return k != null && set.has(k);
  });
}

import { ARTIFACT_SPECS, ArtifactKind } from './ArtifactType';

export interface WikiLink {
  /** Target basename (no extension, anchor stripped). */
  target: string;
  alias?: string;
  kind: 'wikilink' | 'embed';
}

export interface WikiPage {
  /** Path relative to the wiki root, posix-style. */
  relPath: string;
  /** Filename without `.md`. */
  basename: string;
  /** Containing folder relative to root (posix), `''` for root files. */
  folder: string;
  frontmatter: Readonly<Record<string, unknown>>;
  /** Outgoing `[[wikilinks]]` / `![[embeds]]`. */
  links: WikiLink[];
  /** Relative markdown link targets ending in `.md`. */
  mdLinks: string[];
  /** Heading texts (H1-H6), in document order; `[]` if none. */
  headings: string[];
  /** Bold inline labels (`**Label:**`), in document order; `[]` if none. */
  labels: string[];
  /** normalized-section-title → count of `[[wikilinks]]` under that section. */
  sectionWikilinkCounts: Map<string, number>;
}

const FOLDER_TO_KIND: Record<string, ArtifactKind> = {};
for (const k of Object.keys(ARTIFACT_SPECS) as ArtifactKind[]) {
  FOLDER_TO_KIND[ARTIFACT_SPECS[k].folder] = k;
}

/** Classify a page by its folder (robust even when frontmatter is absent). */
export function kindOfPage(page: WikiPage): ArtifactKind | null {
  return FOLDER_TO_KIND[page.folder] ?? null;
}

/** Classify by a wiki-relative path (for findings that carry only a path). */
export function kindOfRelPath(relPath: string): ArtifactKind | null {
  const folder = relPath.includes('/') ? relPath.replace(/\/[^/]+$/, '') : '';
  return FOLDER_TO_KIND[folder] ?? null;
}

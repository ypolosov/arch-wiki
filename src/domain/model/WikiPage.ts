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
}

const FOLDER_TO_KIND: Record<string, ArtifactKind> = {};
for (const k of Object.keys(ARTIFACT_SPECS) as ArtifactKind[]) {
  FOLDER_TO_KIND[ARTIFACT_SPECS[k].folder] = k;
}

/** Classify a page by its folder (robust even when frontmatter is absent). */
export function kindOfPage(page: WikiPage): ArtifactKind | null {
  return FOLDER_TO_KIND[page.folder] ?? null;
}

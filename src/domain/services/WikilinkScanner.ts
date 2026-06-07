import { WikiLink } from '../model/WikiPage';

// [[target]], [[target|alias]], [[target#anchor|alias]], ![[embed]]
const WIKILINK = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;
// [text](href)
const MDLINK = /\[[^\]]*\]\(([^)]+)\)/g;

const HEADING = /^#{1,6}\s+(.+?)\s*$/;
const LABEL = /^\s*\*\*([^*]+?):\*\*/;

export interface ScanResult {
  links: WikiLink[];
  /** Relative `.md` link targets (urls/anchors excluded). */
  mdLinks: string[];
}

export interface PageScan extends ScanResult {
  headings: string[];
  labels: string[];
  sectionWikilinkCounts: Map<string, number>;
}

/**
 * Normalize a section marker so a config label `"C4 elements"` matches a heading
 * `## C4 elements`, a bold label `**C4 elements:**`, and case/colon variants.
 * Pure, deterministic, no-throw.
 */
export function normalizeSection(s: string): string {
  return s
    .trim()
    .replace(/^\*\*\s*/, '')
    .replace(/\s*\*\*$/, '')
    .replace(/\s*:\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Pure extraction of wikilinks/embeds and relative markdown `.md` links. */
export function scanLinks(body: string): ScanResult {
  const links: WikiLink[] = [];
  for (const m of body.matchAll(WIKILINK)) {
    // Strip a trailing backslash: in markdown tables the alias pipe is escaped
    // as `[[target\|alias]]`, which otherwise leaks the `\` into the target.
    const target = m[2]!.replace(/\\+$/, '').trim();
    if (!target) continue;
    const alias = m[3]?.trim();
    links.push({ target, alias: alias || undefined, kind: m[1] ? 'embed' : 'wikilink' });
  }

  const mdLinks: string[] = [];
  for (const m of body.matchAll(MDLINK)) {
    const href = m[1]!.trim();
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href) || href.startsWith('#') || href.startsWith('mailto:')) {
      continue;
    }
    const pathPart = href.split('#')[0]!.split(/\s/)[0]!;
    if (pathPart.endsWith('.md')) mdLinks.push(pathPart);
  }

  return { links, mdLinks };
}

/**
 * Pure body scan: flat links plus headings, bold labels, and per-section
 * `[[wikilink]]` counts (keyed by normalized section title). A wikilink is
 * counted under the most recent heading/label on or above its line; embeds
 * (`![[..]]`) do not count. Absent body ⇒ empty arrays/map (domain-correct).
 */
export function scanPage(body: string): PageScan {
  const { links, mdLinks } = scanLinks(body);
  const headings: string[] = [];
  const labels: string[] = [];
  const sectionWikilinkCounts = new Map<string, number>();
  let current = '';
  for (const line of body.split('\n')) {
    const h = HEADING.exec(line);
    if (h) {
      headings.push(h[1]!);
      current = normalizeSection(h[1]!);
    } else {
      const lb = LABEL.exec(line);
      if (lb) {
        labels.push(lb[1]!);
        current = normalizeSection(lb[1]!);
      }
    }
    if (!current) continue;
    let n = 0;
    for (const m of line.matchAll(WIKILINK)) if (!m[1]) n += 1; // non-embed only
    if (n > 0) sectionWikilinkCounts.set(current, (sectionWikilinkCounts.get(current) ?? 0) + n);
  }
  return { links, mdLinks, headings, labels, sectionWikilinkCounts };
}

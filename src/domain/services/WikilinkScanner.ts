import { WikiLink } from '../model/WikiPage';

// [[target]], [[target|alias]], [[target#anchor|alias]], ![[embed]]
const WIKILINK = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;
// [text](href)
const MDLINK = /\[[^\]]*\]\(([^)]+)\)/g;

export interface ScanResult {
  links: WikiLink[];
  /** Relative `.md` link targets (urls/anchors excluded). */
  mdLinks: string[];
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

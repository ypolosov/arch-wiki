import matter from 'gray-matter';
import { FrontmatterParserPort, ParsedDoc } from '../../application/ports/FrontmatterParserPort';

/** Recursively sort object keys (arrays keep order) for deterministic YAML output. */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeysDeep((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

/**
 * The single importer of gray-matter outside FoamWikiRepository. `stringify`
 * emits frontmatter with recursively-sorted keys so scaffolded/edited YAML is
 * byte-stable (golden tests). Absent frontmatter ⇒ `{}` (never throws).
 */
export class GrayMatterParser implements FrontmatterParserPort {
  parse(raw: string): ParsedDoc {
    const r = matter(raw);
    return { frontmatter: (r.data ?? {}) as Record<string, unknown>, content: r.content };
  }

  stringify(doc: ParsedDoc): string {
    if (Object.keys(doc.frontmatter).length === 0) return doc.content;
    return matter.stringify(doc.content, sortKeysDeep(doc.frontmatter) as Record<string, unknown>);
  }
}

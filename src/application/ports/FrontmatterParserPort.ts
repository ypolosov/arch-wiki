export interface ParsedDoc {
  /** `{}` when the document has no frontmatter block (carve-out b). */
  readonly frontmatter: Record<string, unknown>;
  /** The body with the frontmatter block stripped. */
  readonly content: string;
}

/** Driven port that isolates gray-matter behind one seam (plan §2.9). */
export interface FrontmatterParserPort {
  /** Deterministic. Parse a string into {frontmatter, content}. */
  parse(raw: string): ParsedDoc;
  /** Deterministic. Serialize frontmatter+content back with STABLE key ordering. */
  stringify(doc: ParsedDoc): string;
}

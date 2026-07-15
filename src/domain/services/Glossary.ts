import { GraphSnapshot, pagesOfKind } from '../model/Graph';
import { LintFinding } from './LintRuleSet';
import { levenshtein } from './Levenshtein';

/**
 * Glossary as a Unified Term Sheet (FPF F.17 / F.7). `glossary.md` is a Markdown
 * table; the canonical columns are `Term | Definition`, optionally extended with
 * `Context` (the bounded context a sense belongs to, FPF A.6.9) and `Status`
 * (lexical continuity, FPF F.13). Parsing is tolerant: extra/missing optional
 * columns are fine; a plain `Term | Definition` sheet still parses.
 */
export interface GlossaryTerm {
  term: string;
  context?: string;
  definition: string;
  /** Lowercased lexical-continuity status (e.g. `deprecated`, `retired`). */
  status?: string;
  /** `[[wikilink]]` targets in the row (the managing/defining pages). */
  links: string[];
}

function splitRow(row: string): string[] {
  return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** Parse the term sheet out of `glossary.md` markdown. Deterministic; frontmatter/prose ignored. */
export function parseTermSheet(markdown: string): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  let cols: string[] | null = null;
  for (const line of markdown.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      cols = null; // table ended
      continue;
    }
    const cells = splitRow(t);
    if (!cols) {
      const lower = cells.map((c) => c.toLowerCase());
      if (lower.includes('term') && lower.includes('definition')) cols = lower;
      continue;
    }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue; // separator row
    const get = (name: string): string => {
      const i = cols!.indexOf(name);
      return i >= 0 ? (cells[i] ?? '') : '';
    };
    const termRaw = get('term');
    const term = termRaw
      .replace(/\*\*/g, '')
      .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1')
      .trim();
    if (!term) continue;
    const context = cols.includes('context') ? get('context').replace(/\*\*/g, '').trim() || undefined : undefined;
    const status = cols.includes('status')
      ? get('status').replace(/\*\*/g, '').trim().toLowerCase() || undefined
      : undefined;
    const links = [...`${termRaw} ${get('definition')}`.matchAll(/\[\[([^\]|#]+)/g)].map((m) => m[1]!.trim());
    terms.push({ term, context, definition: get('definition'), status, links: [...new Set(links)] });
  }
  return terms;
}

const FILE = 'glossary.md';

/** Deterministic checks over the term sheet + graph (merged into the lint report). */
export function glossaryFindings(terms: readonly GlossaryTerm[], g: GraphSnapshot): LintFinding[] {
  const out: LintFinding[] = [];

  // 1. Mint-or-Reuse (FPF F.8): near-duplicate term names — likely a mint that should reuse.
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const a = terms[i]!.term;
      const b = terms[j]!.term;
      if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 2) continue;
      if (a.toLowerCase() !== b.toLowerCase() && levenshtein(a.toLowerCase(), b.toLowerCase()) <= 2) {
        out.push({
          rule: 'glossary-near-duplicate',
          severity: 'low',
          file: FILE,
          message: `terms "${a}" and "${b}" are near-duplicates (Levenshtein ≤ 2) — mint-or-reuse?`,
        });
      }
    }
  }

  for (const t of terms) {
    // 2. Term ⟷ managing page (FPF F.17): a term that links no defining/managing page.
    if (t.links.length === 0) {
      out.push({
        rule: 'glossary-term-unlinked',
        severity: 'low',
        file: FILE,
        message: `term "${t.term}" links no managing page ([[…]])`,
      });
    }
    // 3. Lexical continuity (FPF F.13): a deprecated/retired term must point to a successor.
    if ((t.status === 'deprecated' || t.status === 'retired') && t.links.length === 0) {
      out.push({
        rule: 'deprecated-term-without-successor',
        severity: 'medium',
        file: FILE,
        message: `${t.status} term "${t.term}" links no successor`,
      });
    }
  }

  // 4. Coverage (FPF F.17): an entity page no glossary term references.
  const covered = new Set(terms.flatMap((t) => t.links));
  for (const p of pagesOfKind(g, ['entity'])) {
    if (!covered.has(p.basename)) {
      out.push({
        rule: 'entity-without-glossary-term',
        severity: 'low',
        file: p.relPath,
        message: `entity ${p.basename} is not referenced by any glossary term`,
      });
    }
  }

  return out;
}

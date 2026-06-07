import { GraphSnapshot, inboundCounts, pagesOfKind } from '../model/Graph';
import { kindOfPage } from '../model/WikiPage';
import { levenshtein } from './Levenshtein';
import { posixResolve } from './PathUtil';

export interface LintContext {
  /** All file relpaths under the wiki root (incl. raw/), for accurate md-link checks. */
  allFiles?: ReadonlySet<string>;
}

export type Severity = 'high' | 'medium' | 'low';

export interface LintFinding {
  rule: string;
  severity: Severity;
  file?: string;
  message: string;
}

export const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

// Structural pages that are legitimately not linked-to by drivers/ADRs.
const STRUCTURAL = new Set([
  'index',
  'CLAUDE', // the schema/contract file (Layer 3), not a wiki page
  'README',
  'glossary',
  'risks',
  'gap-analysis',
  'utility-tree',
  'kanban',
]);

const DRIVER_KINDS = ['use-case', 'quality-attribute', 'constraint', 'concern'] as const;

/**
 * Deterministic lint rules over the graph. Each rule is reproducible; semantic
 * rules that need judgement (terminology drift, QA↔C4) live in the LLM layer.
 */
export function runLint(g: GraphSnapshot, ctx: LintContext = {}): LintFinding[] {
  const findings: LintFinding[] = [];
  const inbound = inboundCounts(g);
  const present = g.byBasename;

  // 1. Broken wikilinks that look like typos (a near-name exists). A wikilink to
  //    a genuinely absent note is an allowed placeholder and is not reported.
  for (const p of g.pages) {
    for (const l of p.links) {
      if (present.has(l.target)) continue;
      let near: string | undefined;
      for (const b of present.keys()) {
        if (Math.abs(b.length - l.target.length) > 2) continue;
        if (levenshtein(b, l.target) <= 2) {
          near = b;
          break;
        }
      }
      if (near) {
        findings.push({
          rule: 'broken-wikilink',
          severity: 'high',
          file: p.relPath,
          message: `[[${l.target}]] looks like a typo of [[${near}]]`,
        });
      }
    }
    // 2. Markdown links to a missing relative .md file are never OK. With the
    //    full file set we resolve relative to the page (so links into raw/ that
    //    exist on disk are fine); otherwise fall back to a basename check.
    for (const md of p.mdLinks) {
      let missing: boolean;
      if (ctx.allFiles) {
        missing = !ctx.allFiles.has(posixResolve(p.folder, md));
      } else {
        missing = !present.has(md.replace(/^.*\//, '').replace(/\.md$/, ''));
      }
      if (missing) {
        findings.push({
          rule: 'broken-mdlink',
          severity: 'high',
          file: p.relPath,
          message: `broken link to missing file: ${md}`,
        });
      }
    }
  }

  // 3. Orphans: a non-structural, non-hub page nothing links to.
  for (const p of g.pages) {
    if (kindOfPage(p) === 'arc42') continue;
    if (STRUCTURAL.has(p.basename)) continue;
    if ((inbound.get(p.basename) ?? 0) === 0) {
      findings.push({
        rule: 'orphan',
        severity: 'medium',
        file: p.relPath,
        message: `orphan: nothing links to [[${p.basename}]]`,
      });
    }
  }

  // 4. Uncovered drivers: no inbound link from any ADR or iteration.
  const covered = new Set<string>();
  for (const c of pagesOfKind(g, ['adr', 'iteration'])) {
    for (const l of c.links) covered.add(l.target);
  }
  for (const d of pagesOfKind(g, [...DRIVER_KINDS])) {
    if (!covered.has(d.basename)) {
      findings.push({
        rule: 'uncovered-driver',
        severity: 'medium',
        file: d.relPath,
        message: `driver ${d.basename} is not covered by any ADR or iteration`,
      });
    }
  }

  // 5. Superseded/deprecated ADR with no link to a successor ADR.
  for (const adr of pagesOfKind(g, ['adr'])) {
    const status = String((adr.frontmatter as { status?: unknown }).status ?? '').toLowerCase();
    if (status !== 'superseded' && status !== 'deprecated') continue;
    const hasSuccessor = adr.links.some((l) => {
      const t = present.get(l.target);
      return t != null && kindOfPage(t) === 'adr';
    });
    if (!hasSuccessor) {
      findings.push({
        rule: 'superseded-no-successor',
        severity: 'high',
        file: adr.relPath,
        message: `ADR ${adr.basename} is ${status} but links to no successor ADR`,
      });
    }
  }

  return sortFindings(findings);
}

/** Stable ordering for reproducible output (golden tests). */
export function sortFindings(findings: LintFinding[]): LintFinding[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      a.rule.localeCompare(b.rule) ||
      (a.file ?? '').localeCompare(b.file ?? '') ||
      a.message.localeCompare(b.message),
  );
}

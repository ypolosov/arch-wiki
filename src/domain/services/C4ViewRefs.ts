import { LintFinding } from './LintRuleSet';

/**
 * The arc42 ⟷ C4-view correspondence: which views an arc42 hub promises to show.
 *
 * A hub names a view in an inline-code span **with its keyword** — `` `view containers` `` or
 * `` `deployment view deploymentProd` ``. Only those two forms are parsed, because they are
 * unambiguous. A **bare** backticked id (a hub may list dynamic views as `` `scRedemption` ``) is
 * deliberately NOT parsed: every code span would match — `` `npm run validate` `` included — so
 * guessing would fabricate references. Better to check what is stated than to invent what is meant.
 * Pure; no I/O.
 */
const REF_RE = /^(?:deployment\s+)?view\s+([A-Za-z_][A-Za-z0-9_]*)$/i;

/** View ids a page explicitly shows, deduped + sorted. */
export function parseViewRefs(markdown: string): string[] {
  const out = new Set<string>();
  for (const m of markdown.matchAll(/`([^`\n]+)`/g)) {
    const hit = m[1]!.trim().match(REF_RE);
    if (hit) out.add(hit[1]!);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

export interface HubViewRefs {
  /** Wiki-relative path of the arc42 hub. */
  file: string;
  basename: string;
  refs: readonly string[];
}

/**
 * `c4-view-missing`: an arc42 hub shows a view the C4 model does not define — a broken promise
 * (typically the view was renamed or dropped). A factual dangling reference, not a judgement.
 * Callers pass the model's view ids; when the model carries no views the check is skipped entirely
 * (skip-safely — never invented from a summary-only model).
 */
export function c4ViewMissingFindings(
  hubs: readonly HubViewRefs[],
  viewIds: ReadonlySet<string>,
): LintFinding[] {
  const out: LintFinding[] = [];
  for (const hub of hubs) {
    for (const ref of hub.refs) {
      if (viewIds.has(ref)) continue;
      out.push({
        rule: 'c4-view-missing',
        severity: 'medium',
        file: hub.file,
        message: `arc42 hub ${hub.basename} shows \`view ${ref}\` but the C4 model defines no such view`,
      });
    }
  }
  return out;
}

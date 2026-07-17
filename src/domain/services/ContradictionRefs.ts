import { LintFinding } from './LintRuleSet';
import { isSeparatorRow, splitTableRow } from './MarkdownTable';

/**
 * Coherence between a contradiction row in `risks.md` and the note on the artifact it contests.
 *
 * The ingestor's rule is: when a source conflicts with a recorded decision, do NOT overwrite — append
 * a `Contradiction` row to `risks.md` AND put a note on the affected page. Nothing enforced the pair,
 * so the note is a temporary marker that outlives its question, or never appears at all.
 *
 * **We check the LINK, never the prose.** The note itself is written half a dozen ways (a dated
 * blockquote, a `**Contradiction (…)**` lead, an inline-code id, a `**Risks:**` label) — parsing that
 * would mean guessing. But `[[risks#^C-NNN]]` is unambiguous and machine-readable, so the wikilink is
 * the carrier we read. A bare inline-code `` `C-015` `` is deliberately NOT counted: it is prose.
 *
 * Pure; no I/O.
 */

/** Wikilinks into the risk register that name a record id: `[[risks#^C-003]]`, `[[risks#^C-003|C-003]]`. */
const RISK_ANCHOR_RE = /\[\[risks#\^([A-Z]-\d+)/gi;

/** Contradiction ids an artifact's body links to (deduped, sorted). */
export function parseContradictionRefs(content: string): string[] {
  const out = new Set<string>();
  for (const m of content.matchAll(RISK_ANCHOR_RE)) {
    const id = m[1]!.toUpperCase();
    if (id.startsWith('C-')) out.add(id);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

export interface RiskRow {
  id: string;
  type: string;
  /** Lowercased status cell, e.g. `open` / `closed` / `mitigating` / `accepted`. */
  status: string;
  /** Wikilink targets in the row's `Related` cell (basenames). */
  related: string[];
}

/**
 * Statuses that mean the question is still live. A `closed` row is settled; anything else
 * (`open`, `mitigating`, `accepted`) still warrants a note on the contested artifact.
 */
export const LIVE_RISK_STATUSES = ['open', 'mitigating', 'accepted'] as const;

export function isLiveRisk(status: string): boolean {
  return (LIVE_RISK_STATUSES as readonly string[]).includes(status.trim().toLowerCase());
}

/**
 * Parse the risk register table. **Header-anchored by column NAME** (`ID`/`Type`/`Status`) — a
 * register page may carry other tables, and keying on position reads them as ours.
 */
export function parseRiskRows(risksMarkdown: string): RiskRow[] {
  const rows: RiskRow[] = [];
  let cols: string[] | null = null;
  for (const line of risksMarkdown.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      cols = null;
      continue;
    }
    const cells = splitTableRow(t);
    if (cells.length < 3) continue;
    if (!cols) {
      const lower = cells.map((c) => c.toLowerCase());
      if (lower.includes('id') && lower.includes('type') && lower.includes('status')) cols = lower;
      continue;
    }
    if (isSeparatorRow(cells)) continue;
    // A row whose cell count does not match the header is malformed markdown (an unescaped `|` in
    // prose). It renders wrong too — but we must not read a column out of the wreckage and report a
    // verdict from it. Skip: better unjudged than wrongly judged.
    if (cells.length !== cols.length) continue;
    const at = (name: string): string => {
      const i = cols!.indexOf(name);
      return i >= 0 ? (cells[i] ?? '') : '';
    };
    const id = at('id').replace(/[`^\[\]]/g, '').trim().toUpperCase();
    if (!/^[A-Z]-\d+$/.test(id)) continue;
    const related = [...at('related').matchAll(/\[\[([^\]|#]+)/g)].map((m) => m[1]!.trim());
    rows.push({ id, type: at('type').toLowerCase(), status: at('status').toLowerCase(), related });
  }
  return rows;
}

export interface ArtifactRefs {
  file: string;
  basename: string;
  refs: readonly string[];
}

/**
 * `adr-contradiction-note-orphan` (low): an artifact links a contradiction whose row is **closed**.
 *
 * Core reports the FACT (the link points at a settled row); it does NOT rule that the note is stale.
 * A closed contradiction may legitimately be cited as history ("this decision exists because of
 * C-010, since closed"). Telling that from a leftover banner needs judgement over the note's prose —
 * `/arch-wiki:review`'s job, not a deterministic rule's. Baseline it when the citation is historical.
 */
export function contradictionNoteOrphanFindings(
  artifacts: readonly ArtifactRefs[],
  rows: readonly RiskRow[],
): LintFinding[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: LintFinding[] = [];
  for (const a of artifacts) {
    for (const ref of a.refs) {
      const row = byId.get(ref);
      if (!row || isLiveRisk(row.status)) continue;
      out.push({
        rule: 'adr-contradiction-note-orphan',
        severity: 'low',
        file: a.file,
        message: `${a.basename} links contradiction ${ref}, whose register row is ${row.status} — retire the note if it was an open-question banner; baseline it if the citation is historical`,
      });
    }
  }
  return out;
}

/**
 * `contradiction-note-missing` (low): a LIVE contradiction row names an artifact, but that artifact
 * carries no `[[risks#^C-NNN]]` link back — the decision is contested and its reader cannot tell.
 */
export function contradictionNoteMissingFindings(
  artifacts: readonly ArtifactRefs[],
  rows: readonly RiskRow[],
  risksFile: string,
): LintFinding[] {
  const byBasename = new Map(artifacts.map((a) => [a.basename, a]));
  const out: LintFinding[] = [];
  for (const row of rows) {
    if (row.type !== 'contradiction' || !isLiveRisk(row.status)) continue;
    for (const target of row.related) {
      const a = byBasename.get(target);
      if (!a || a.refs.includes(row.id)) continue;
      out.push({
        rule: 'contradiction-note-missing',
        severity: 'low',
        file: risksFile,
        message: `${row.id} (${row.status}) contests ${target}, but that page carries no [[risks#^${row.id}]] note — its reader cannot see the open question`,
      });
    }
  }
  return out;
}

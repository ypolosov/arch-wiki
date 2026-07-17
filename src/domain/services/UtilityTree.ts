import { LintFinding } from './LintRuleSet';
import { isSeparatorRow, splitTableRow } from './MarkdownTable';

/**
 * The utility tree as an **Evaluation CharacteristicSpace** with a deterministic **ScoringMethod**
 * (FPF A.19 / C.16). In ATAM/QAW practice each quality scenario is positioned on two ordinal axes —
 * business **Importance** and architectural **Difficulty**, each H/M/L. This module parses that
 * position, imposes a deterministic total preorder over the space (the ScoringMethod), and flags a
 * cell that is present but not a clean H/M/L pair (fail-fast — no silent default). Pure; no I/O.
 */
export type UtilityLevel = 'H' | 'M' | 'L';
export interface UtilityPriority {
  importance: UtilityLevel;
  /** null = an importance-only priority (a single `H`/`M`/`L` marker, the QAW short form). */
  difficulty: UtilityLevel | null;
}

const WEIGHT: Record<UtilityLevel, number> = { H: 3, M: 2, L: 1 };

/** Cells that mean "not yet scored" — never flagged as ill-formed (the register's own placeholder). */
const UNSET = new Set(['', '-', '—', '–', 'n/a', 'na', 'tbd', 'tba', '?']);

/** True when a priority cell is the unset placeholder (empty / dash / TBD), not a real value. */
export function isUnsetPriority(raw: string): boolean {
  return UNSET.has(raw.trim().toLowerCase());
}

/**
 * Parse an ATAM priority. Two authored forms are valid (both used in practice): the short
 * importance-only marker `H` / `M` / `L`, and the two-axis pair `H,M` / `(H,M)` / `H/M` / `H M`
 * (case-insensitive; first = Importance, second = Difficulty). Returns null unless the cell is
 * EXACTLY one or two H/M/L letters — so `HIGH`, `H,M,L` or stray prose parse to null (→ a lint
 * flag, never a silent guess).
 */
export function parseUtilityPriority(raw: string): UtilityPriority | null {
  const upper = raw.toUpperCase();
  const letters = upper.replace(/[^A-Z]/g, '');
  const tokens = upper.match(/[HML]/g);
  if (!tokens) return null;
  if (tokens.length === 1 && letters.length === 1) {
    return { importance: tokens[0] as UtilityLevel, difficulty: null };
  }
  if (tokens.length === 2 && letters.length === 2) {
    return { importance: tokens[0] as UtilityLevel, difficulty: tokens[1] as UtilityLevel };
  }
  return null;
}

/**
 * Deterministic ScoringMethod: an importance-dominant scalar over the CharacteristicSpace.
 * Importance sets the band (×3); Difficulty breaks ties within it. A missing Difficulty (the short
 * marker) is treated as the mid value, keeping the row inside its importance band. The bands are
 * disjoint — L `4–6` < M `7–9` < H `10–12` — so a higher-importance scenario always outranks a
 * lower-importance one regardless of difficulty.
 */
export function scoreUtility(p: UtilityPriority): number {
  return WEIGHT[p.importance] * 3 + WEIGHT[p.difficulty ?? 'M'];
}

/** Coarse tier by business importance (the primary evaluation band). */
export type UtilityTier = 'top' | 'medium' | 'low';
export function tierOf(p: UtilityPriority): UtilityTier {
  return p.importance === 'H' ? 'top' : p.importance === 'M' ? 'medium' : 'low';
}

export interface UtilityRow {
  /** Driver id (extracted from a `[[id]]` cell) or the raw first-cell text. */
  driver: string;
  scenario: string;
  priority: string;
}

export interface RankedUtilityRow extends UtilityRow {
  parsed: UtilityPriority | null;
  score: number | null;
  tier: UtilityTier | null;
  /** 1-based rank among parseable rows (score desc, then driver id asc); null if unparseable/unset. */
  rank: number | null;
}

/**
 * Parse the MANAGED register table — the one `update-utility-tree` writes — into rows.
 *
 * **Header-anchored, by column NAME** (same discipline as `Glossary.parseTermSheet`). A utility-tree
 * page may hold several hand-authored tables with entirely different schemas (a real one:
 * `| Priority | Quality Attribute | Scenario | Rating |`, where Priority is column 1, not 3). Keying
 * on column POSITION read those foreign tables as if they were ours and reported their scenario prose
 * as a malformed priority — 73 false findings on a real graph. So: find a header naming BOTH `Driver`
 * and `Priority`; map columns by name; if no such header exists, this file has no managed register and
 * we parse NOTHING. Someone else's table is not ours to judge.
 */
export function parseUtilityTable(content: string): UtilityRow[] {
  const rows: UtilityRow[] = [];
  let cols: string[] | null = null;
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      cols = null; // table ended
      continue;
    }
    const cells = splitTableRow(t);
    if (cells.length < 2) continue;
    if (!cols) {
      const lower = cells.map((c) => c.toLowerCase());
      // Only OUR register: a header naming both Driver and Priority.
      if (lower.includes('driver') && lower.includes('priority')) cols = lower;
      continue;
    }
    if (isSeparatorRow(cells)) continue; // separator row
    // Cell count must match the header — a malformed row is never judged (see ContradictionRefs).
    if (cells.length !== cols.length) continue;
    const at = (name: string): string => {
      const i = cols!.indexOf(name);
      return i >= 0 ? (cells[i] ?? '') : '';
    };
    const driverCell = at('driver');
    if (!driverCell) continue;
    const m = driverCell.match(/\[\[([^\]|#]+)/);
    rows.push({
      driver: (m ? m[1]! : driverCell).trim(),
      scenario: at('scenario'),
      priority: at('priority'),
    });
  }
  return rows;
}

/**
 * Rank the utility tree by the ScoringMethod. Parseable rows first, ordered by score desc then
 * driver id asc (a stable, deterministic total order); unparseable/unset rows follow, driver-sorted.
 */
export function rankUtilityTree(rows: readonly UtilityRow[]): RankedUtilityRow[] {
  const enriched: RankedUtilityRow[] = rows.map((r) => {
    const parsed = parseUtilityPriority(r.priority);
    return {
      ...r,
      parsed,
      score: parsed ? scoreUtility(parsed) : null,
      tier: parsed ? tierOf(parsed) : null,
      rank: null,
    };
  });
  const scored = enriched
    .filter((r) => r.score != null)
    .sort((a, b) => b.score! - a.score! || a.driver.localeCompare(b.driver));
  scored.forEach((r, i) => {
    r.rank = i + 1;
  });
  const rest = enriched.filter((r) => r.score == null).sort((a, b) => a.driver.localeCompare(b.driver));
  return [...scored, ...rest];
}

/**
 * Flag a utility-tree row whose priority is present but not a clean ATAM (Importance,Difficulty)
 * H/M/L pair (FPF A.19). Low severity, baseline-suppressible. Unset placeholders are skipped.
 */
export function utilityPriorityFindings(relPath: string, content: string): LintFinding[] {
  const out: LintFinding[] = [];
  for (const r of parseUtilityTable(content)) {
    if (isUnsetPriority(r.priority)) continue;
    if (!parseUtilityPriority(r.priority)) {
      out.push({
        rule: 'utility-priority-illformed',
        severity: 'low',
        file: relPath,
        message: `Utility-tree row ${r.driver} priority "${r.priority}" is not an ATAM (Importance,Difficulty) H/M/L pair (FPF A.19)`,
      });
    }
  }
  return out;
}

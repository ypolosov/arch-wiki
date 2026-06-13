import { ArtifactKind } from '../model/ArtifactType';
import { GraphSnapshot, pagesOfKind } from '../model/Graph';
import { WikiPage } from '../model/WikiPage';
import { LintFinding, Severity, sortFindings } from './LintRuleSet';
import { slugify } from './KebabSlug';

/**
 * A normalized C4 model element (kind/title from the LikeC4 specification). The
 * `LikeC4ModelReader` adapter produces these from a model-JSON source (the
 * LikeC4 MCP `read-project-summary` or `likec4 export json`) or from a regex
 * pass over `*.c4` — Core consumes only this neutral shape (invariant 1/2).
 */
export interface C4Element {
  /** Fully-qualified id, e.g. `cloud.backend.api`. */
  id: string;
  /** Element kind from the project's LikeC4 spec, e.g. `system`/`container`. */
  kind: string;
  /** Display title. */
  title: string;
  tags?: string[];
}

export interface C4Model {
  elements: C4Element[];
}

export interface C4ConsistencyPolicy {
  /** C4 element kinds that MUST map to a wiki entity (default: system+container). */
  requireDocumentation: string[];
  severity: Severity;
  /** rule-ids, C4 element-ids, or wiki basenames to suppress. */
  ignore: string[];
}

// Wiki side: kinds whose pages represent architecture elements mappable to C4.
const WIKI_C4_KINDS: ArtifactKind[] = ['entity'];

function lastSegment(id: string): string {
  const i = id.lastIndexOf('.');
  return i >= 0 ? id.slice(i + 1) : id;
}

/** Normalize a C4 title / id-segment / wiki basename for name-matching. */
function norm(s: string): string {
  return slugify(s);
}

/**
 * A wiki entity's explicit C4 mapping from frontmatter `c4:`.
 * - a non-empty string → the C4 element id it maps to (deterministic priority);
 * - `false` / `'none'` / `'false'` → opt-out (never flagged as undocumented);
 * - otherwise → no explicit mapping (fall back to name-matching).
 */
type ExplicitC4 = string | null | 'opt-out';
function explicitC4(page: WikiPage): ExplicitC4 {
  const v = (page.frontmatter as { c4?: unknown }).c4;
  if (v === false || v === 'none' || v === 'false') return 'opt-out';
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

/**
 * Deterministic, pure bidirectional consistency check: the C4 model (elements)
 * must reflect the wiki entities and vice-versa. Generation is NOT done here —
 * `.c4` stays hand-authored (cartographer = proposer, plan §4.4); this only
 * reports drift. Noise is controlled by `policy.requireDocumentation` (which C4
 * kinds must be documented) + an adoption baseline at the use-case layer.
 * Imports only graph/model + LintRuleSet types — no I/O, no node:*.
 */
export function checkC4Consistency(
  model: C4Model,
  g: GraphSnapshot,
  policy: C4ConsistencyPolicy,
): LintFinding[] {
  const findings: LintFinding[] = [];
  const ignore = new Set(policy.ignore);
  const required = new Set(policy.requireDocumentation.map((k) => k.toLowerCase()));
  const entities = pagesOfKind(g, WIKI_C4_KINDS);

  // Index wiki entities by explicit `c4:` id and by normalized basename.
  const byExplicit = new Map<string, WikiPage>();
  const byName = new Map<string, WikiPage>();
  for (const p of entities) {
    const ex = explicitC4(p);
    if (typeof ex === 'string') byExplicit.set(ex, p);
    byName.set(norm(p.basename), p);
  }

  const matchElement = (el: C4Element): WikiPage | null => {
    // 1. Explicit mapping: a wiki entity whose `c4:` equals the element id (or its leaf).
    const ex = byExplicit.get(el.id) ?? byExplicit.get(lastSegment(el.id));
    if (ex) return ex;
    // 2. Name/slug: element title or id-leaf matches an entity basename.
    return byName.get(norm(el.title)) ?? byName.get(norm(lastSegment(el.id))) ?? null;
  };

  const sortedElements = [...model.elements].sort((a, b) => a.id.localeCompare(b.id));
  const matchedBasenames = new Set<string>();
  const elementMatch = new Map<string, WikiPage | null>();
  for (const el of sortedElements) {
    const m = matchElement(el);
    elementMatch.set(el.id, m);
    if (m) matchedBasenames.add(m.basename);
  }

  // Direction 1: a C4 element of a required kind with no wiki entity.
  for (const el of sortedElements) {
    if (!required.has(el.kind.toLowerCase())) continue;
    if (ignore.has(el.id)) continue;
    if (!elementMatch.get(el.id)) {
      findings.push({
        rule: 'c4-element-without-wiki-entity',
        severity: policy.severity,
        message: `C4 ${el.kind} "${el.id}" has no wiki entity`,
      });
    }
  }

  // Direction 2: a wiki entity with no matching C4 element (opt-out via `c4: false`).
  for (const p of entities) {
    if (ignore.has(p.basename)) continue;
    if (explicitC4(p) === 'opt-out') continue;
    if (matchedBasenames.has(p.basename)) continue;
    findings.push({
      rule: 'wiki-entity-without-c4-element',
      severity: policy.severity,
      file: p.relPath,
      message: `entity ${p.basename} has no matching C4 element`,
    });
  }

  // Rule-level ignore (an entry naming a whole rule suppresses it).
  return sortFindings(findings.filter((f) => !ignore.has(f.rule)));
}

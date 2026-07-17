import { ArtifactKind } from '../model/ArtifactType';
import { GraphSnapshot, inboundCounts, pagesOfKind } from '../model/Graph';
import { WikiPage, kindOfPage } from '../model/WikiPage';
import { DriverAssurance, DRIVER_KINDS } from './Assurance';
import { normalizeSection } from './WikilinkScanner';
import { ADR_STATUSES, isAdrStatus, isTemplateSlot, needsSuccessor, normalizeAdrStatus } from '../model/AdrStatus';

/**
 * Structural adequacy floor for design artifacts (FPF C.32.ADA decision-adequacy,
 * C.30.AD description-adequacy, E.21 pattern-quality). This is a **capped structural
 * floor, not a value ladder**: every base is a checkable FACT over the graph +
 * wave-2 evidence signals (AssuranceLevel, epistemic-debt), never a judgement. The
 * band is a rollup of the bases; the actionable content is the list of failing bases.
 * Substantive quality (is the prose good?) stays an LLM judgement (`/arch-wiki:review`).
 */
export type AdequacyBand = 'adequate' | 'thin' | 'inadequate';

export interface AdequacyBase {
  /** Stable base id, e.g. `options`, `covered`. */
  name: string;
  ok: boolean;
  /** A failing critical base ⇒ `inadequate`; a failing non-critical base ⇒ `thin`. */
  critical: boolean;
  detail?: string;
}

export interface ArtifactAdequacy {
  id: string;
  file: string;
  kind: ArtifactKind;
  band: AdequacyBand;
  bases: AdequacyBase[];
}

export interface AdequacyContext {
  /** Driver AssuranceLevel by basename (wave 2) — feeds the driver `covered` base. */
  assurance?: ReadonlyMap<string, DriverAssurance>;
  /** Basenames carrying any epistemic debt (wave 2) — feeds the `no-debt` base. */
  debtSubjects?: ReadonlySet<string>;
}


const SCORED_KINDS: ArtifactKind[] = [
  'adr',
  'use-case',
  'quality-attribute',
  'constraint',
  'concern',
  'iteration',
  'concept',
  'entity',
  'arc42',
];

function bandOf(bases: AdequacyBase[]): AdequacyBand {
  if (bases.some((b) => b.critical && !b.ok)) return 'inadequate';
  if (bases.some((b) => !b.ok)) return 'thin';
  return 'adequate';
}

function hasSection(sectionSet: ReadonlySet<string>, marker: string): boolean {
  return sectionSet.has(normalizeSection(marker));
}

/** MADR ships in a short and a full form — accept either heading variant. */
function hasAnySection(sectionSet: ReadonlySet<string>, markers: readonly string[]): boolean {
  return markers.some((m) => sectionSet.has(normalizeSection(m)));
}

/** Canonical + synonymous headings for the ADR candidate set (FPF C.32.ADA). */
const OPTIONS_MARKERS = [
  'Considered Options',
  'Options',
  'Alternatives Considered',
  'Considered Alternatives',
  'Options Considered',
  'Alternatives',
];

/**
 * Options-section evidence (FPF C.32.ADA — a decision needs a live candidate set). Accepts the
 * MADR-canonical `## Considered Options`, common synonyms (`## Alternatives Considered`, `## Options`,
 * …), AND an `### Option N` / `### Alternative N` sub-block layout — each is a genuine candidate set.
 * Broadened after a gt adequacy review surfaced two Core false-negatives: real alternatives present
 * under a heading the strict matcher did not recognize.
 */
function hasOptionsEvidence(sectionSet: ReadonlySet<string>, headings: readonly string[]): boolean {
  if (hasAnySection(sectionSet, OPTIONS_MARKERS)) return true;
  return headings.some((h) => /^\s*(option|alternative)s?\s+\w+/i.test(h));
}

/** Compute the adequacy of every scored artifact. Deterministic; sorted by file. */
export function computeAdequacy(g: GraphSnapshot, ctx: AdequacyContext = {}): ArtifactAdequacy[] {
  const assurance = ctx.assurance ?? new Map<string, DriverAssurance>();
  const debt = ctx.debtSubjects ?? new Set<string>();
  const inbound = inboundCounts(g);
  const driverSet = new Set(pagesOfKind(g, DRIVER_KINDS).map((p) => p.basename));
  const adrSet = new Set(pagesOfKind(g, ['adr']).map((p) => p.basename));

  const out: ArtifactAdequacy[] = [];
  for (const p of pagesOfKind(g, SCORED_KINDS)) {
    const kind = kindOfPage(p)!;
    // The MADR template lives in the reserved all-zeros ADR slot (`0000-template`; real ADRs start at
    // 0001). It is a skeleton — placeholder drivers, a status listing every lifecycle value — never a
    // decision to score. Excluded from the adequacy floor (a gt review flagged it as a false inadequate).
    if (kind === 'adr' && isTemplateSlot(p.basename)) continue;
    const sections = new Set([...p.headings, ...p.labels].map(normalizeSection));
    const linksDrivers = p.links.filter((l) => driverSet.has(l.target)).length;
    const linksAdrs = p.links.filter((l) => adrSet.has(l.target)).length;
    const sourced =
      hasSection(sections, 'Sources') || typeof (p.frontmatter as { source?: unknown }).source === 'string';
    const noDebt = !debt.has(p.basename);
    const bases: AdequacyBase[] = [];

    if (kind === 'adr') {
      const status = normalizeAdrStatus((p.frontmatter as { status?: unknown }).status);
      // Both MADR forms are accepted: the full form carries `status:` in frontmatter, the short form
      // states it in the body (`- **Status:** …`). But judge them in the right order — a PRESENT
      // frontmatter status is judged strictly against the canon; only an ABSENT one falls back to the
      // short form's label. (The old `has(status) || hasSection('Status')` let ANY garbage pass as long
      // as a `**Status:**` label existed anywhere — which is how a non-canonical status went unnoticed.)
      const statusOk = status ? isAdrStatus(status) : hasSection(sections, 'Status');
      bases.push({ name: 'drivers-linked', ok: linksDrivers > 0, critical: true, detail: `${linksDrivers} driver link(s)` });
      bases.push({ name: 'options', ok: hasOptionsEvidence(sections, p.headings), critical: true });
      bases.push({ name: 'decision', ok: hasAnySection(sections, ['Decision Outcome', 'Decision']), critical: true });
      bases.push({ name: 'consequences', ok: hasSection(sections, 'Consequences'), critical: false });
      bases.push({ name: 'status', ok: statusOk, critical: true, detail: status || '(section)' });
      if (needsSuccessor(status)) {
        const hasSuccessor = p.links.some((l) => adrSet.has(l.target) && l.target !== p.basename);
        bases.push({ name: 'successor-linked', ok: hasSuccessor, critical: true, detail: `${status} → successor` });
      }
    } else if (DRIVER_KINDS.includes(kind)) {
      const level = assurance.get(p.basename)?.level;
      bases.push({ name: 'covered', ok: level === 'L1' || level === 'L2', critical: true, detail: `assurance ${level ?? 'L0'}` });
      bases.push({ name: 'sourced', ok: sourced, critical: false });
      bases.push({ name: 'no-debt', ok: noDebt, critical: false });
    } else if (kind === 'iteration') {
      bases.push({ name: 'drivers-linked', ok: linksDrivers > 0, critical: false, detail: `${linksDrivers} driver link(s)` });
      bases.push({ name: 'decisions-linked', ok: linksAdrs > 0, critical: false, detail: `${linksAdrs} ADR link(s)` });
    } else if (kind === 'arc42') {
      // Structural-view adequacy (FPF C.30.ASV / E.17.0): a C4-tagged view hub must show its view.
      const tags = (p.frontmatter as { tags?: unknown }).tags;
      const isC4Hub = Array.isArray(tags) && tags.map(String).some((t) => t.toLowerCase() === 'c4');
      if (isC4Hub) {
        bases.push({ name: 'corresponds', ok: p.headings.some((h) => /\bc4\b/i.test(h)), critical: false, detail: 'C4 view shown' });
      }
    } else {
      // concept / entity
      bases.push({ name: 'linked', ok: (inbound.get(p.basename) ?? 0) > 0, critical: false });
      if (kind === 'concept') bases.push({ name: 'sourced', ok: sourced, critical: false });
    }

    out.push({ id: p.basename, file: p.relPath, kind, band: bandOf(bases), bases });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

export interface AdequacySummary {
  adequate: number;
  thin: number;
  inadequate: number;
  total: number;
  byKind: Record<string, { adequate: number; thin: number; inadequate: number }>;
}

export function summarizeAdequacy(rows: readonly ArtifactAdequacy[]): AdequacySummary {
  const s: AdequacySummary = { adequate: 0, thin: 0, inadequate: 0, total: rows.length, byKind: {} };
  for (const r of rows) {
    s[r.band]++;
    const k = (s.byKind[r.kind] ??= { adequate: 0, thin: 0, inadequate: 0 });
    k[r.band]++;
  }
  return s;
}

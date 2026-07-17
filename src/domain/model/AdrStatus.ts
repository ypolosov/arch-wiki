/**
 * The canonical ADR status set — the SINGLE source of truth for the whole plugin.
 *
 * This module exists because the enum had drifted: it was restated in `Adequacy`, `ConfluenceTree`,
 * `ArtifactType`, `LintRuleSet` (×3), `Assurance`, `DecisionRecord`, the `madr-format` skill and the
 * ADR template — and those had already disagreed (the skill declared four statuses while the code
 * accepted five). Every consumer now reads from here; `adr-status-sync.spec.ts` fails if the skill or
 * the template drifts from this constant again.
 *
 * **Provenance, stated honestly:**
 * - The status VALUES are ADR/MADR practice (Nygard's original set + `rejected`).
 * - The TRANSITIONS below are **our convention** — MADR prescribes a status field, not a state
 *   machine. Do not dress them in a framework citation.
 * - The decision/record split that makes a status edit legitimate IS grounded: FPF **C.32.ADR**
 *   ("Architecture Decision Record *Projection*" — *"When is an ADR only a publication projection
 *   rather than the decision?"*) separates the decision (C.32.PAD) from its record.
 *
 * Pure data; no imports, no I/O — safe for every layer to consume.
 */
export const ADR_STATUSES = ['proposed', 'rejected', 'accepted', 'deprecated', 'superseded'] as const;

export type AdrStatus = (typeof ADR_STATUSES)[number];

/** Lowercase + trim a raw frontmatter value. Does NOT judge canonicity. */
export function normalizeAdrStatus(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function isAdrStatus(value: string): value is AdrStatus {
  return (ADR_STATUSES as readonly string[]).includes(value);
}

/**
 * A decision only **live-covers** a driver when it is `accepted` (FPF B.3.3 — assurance is computed
 * from evidence; a proposal is not a ratified decision).
 */
export function isLiveStatus(status: string): boolean {
  return normalizeAdrStatus(status) === 'accepted';
}

/** Statuses that make an ADR historical and therefore REQUIRE a link to its successor. */
export const NEEDS_SUCCESSOR: readonly AdrStatus[] = ['superseded', 'deprecated'];

export function needsSuccessor(status: string): boolean {
  return (NEEDS_SUCCESSOR as readonly string[]).includes(normalizeAdrStatus(status));
}

/** Terminal statuses — a decision in one of these has no onward transition. */
export const TERMINAL_STATUSES: readonly AdrStatus[] = ['rejected', 'superseded', 'deprecated'];

/**
 * Statuses hidden from the Confluence mirror: a proposal and a rejected candidate are working
 * material, not stakeholder-facing record.
 */
export const MIRROR_HIDDEN_STATUSES: readonly AdrStatus[] = ['proposed', 'rejected'];

/**
 * Allowed transitions — **our convention**, not a MADR prescription (see the module note).
 * A `proposed` ADR is still free to edit: it is not yet a binding record.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<AdrStatus, readonly AdrStatus[]>> = {
  proposed: ['accepted', 'rejected'],
  accepted: ['superseded', 'deprecated'],
  rejected: [],
  superseded: [],
  deprecated: [],
};

/**
 * Non-canonical statuses seen in real logs, mapped to their canonical replacement.
 * `partially` conflated the DECISION's state with its IMPLEMENTATION's — an axis the plugin already
 * models properly as AssuranceLevel (L1 decided vs L2 realized). The decision was made; how much of it
 * is built belongs in the assurance layer and a tech-debt row, not in the decision's status.
 */
export const RETIRED_STATUS_MAP: Readonly<Record<string, AdrStatus>> = {
  partially: 'accepted',
};

/** The frontmatter tag that mirrors a status, e.g. `adr/accepted`. */
export function statusTag(status: string): string {
  return `adr/${normalizeAdrStatus(status)}`;
}

/**
 * The reserved MADR template slot (`0000-template`) carries no decision and no status — never judged
 * by the status rules or the adequacy floor.
 */
export function isTemplateSlot(basename: string): boolean {
  return /^0{3,4}($|-)/.test(basename);
}

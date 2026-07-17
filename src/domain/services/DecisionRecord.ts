import { LintFinding } from './LintRuleSet';
import {
  ADR_STATUSES,
  isAdrStatus,
  isLiveStatus,
  isTemplateSlot,
  normalizeAdrStatus,
  RETIRED_STATUS_MAP,
} from '../model/AdrStatus';

/**
 * State of an ADR's `## Considered Options` section (FPF C.32.ADA — a decision needs a
 * live candidate set). Format-agnostic on purpose: options are authored as numbered
 * lists, bold bullets, OR tables across real ADRs, so ANY non-blank, non-comment content
 * counts as `filled`. Only a heading with no substance is `empty`. `absent` (no heading)
 * is left to the adequacy `options` base, never double-flagged. Deterministic; no I/O.
 */
export function optionsSectionState(content: string): 'absent' | 'empty' | 'filled' {
  let inSection = false;
  let found = false;
  let hasContent = false;
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (/^##\s+considered\s+options\b/i.test(t)) {
      inSection = true;
      found = true;
      continue;
    }
    if (inSection && /^##\s/.test(t)) break; // next top-level section
    if (inSection && t && !t.startsWith('<!--')) hasContent = true;
  }
  if (!found) return 'absent';
  return hasContent ? 'filled' : 'empty';
}

/**
 * `adr-options-empty` (low, FPF C.32.ADA): an ACCEPTED ADR whose `## Considered Options`
 * section is present but empty — a decision recorded with no candidate set at all.
 * Robust to any option format (table / bullet / numbered), so it never false-flags a
 * filled section; an ABSENT section is the adequacy base's job.
 */
export function adrOptionsEmptyFinding(
  basename: string,
  relPath: string,
  status: string,
  content: string,
): LintFinding | null {
  if (!isLiveStatus(status)) return null;
  if (optionsSectionState(content) === 'empty') {
    return {
      rule: 'adr-options-empty',
      severity: 'low',
      file: relPath,
      message: `accepted ADR ${basename} has an empty Considered Options section — no candidate set (FPF C.32.ADA)`,
    };
  }
  return null;
}

/** The status stated in the body by the MADR short form (`- **Status:** accepted`), or ''. */
export function bodyStatusLabel(content: string): string {
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*-?\s*\*\*\s*status\s*:?\s*\*\*:?\s*(.*)$/i);
    if (m) return normalizeAdrStatus(m[1]!.replace(/[.;,]$/, ''));
  }
  return '';
}

/** The status carried by the `adr/<status>` frontmatter tag, or '' when absent. */
export function tagStatus(tags: unknown): string {
  if (!Array.isArray(tags)) return '';
  for (const t of tags) {
    const m = String(t).match(/^adr\/(.+)$/i);
    if (m) return normalizeAdrStatus(m[1]!);
  }
  return '';
}

/**
 * Status rules over one ADR. The status is stated in up to THREE carriers — frontmatter `status:`
 * (canonical), the `adr/<status>` tag, and the MADR short form's `- **Status:**` body label — and
 * nothing kept them in sync but human discipline.
 *
 * - `adr-status-unknown` (**high**): the frontmatter status is outside the canon. High because an
 *   unrecognised status silently disables every status-driven rule (live-coverage, mirror visibility,
 *   successor checks) — the drift that let a non-canonical value spread unnoticed.
 * - `adr-status-inconsistent` (low): a secondary carrier disagrees with the canonical frontmatter.
 *
 * The reserved template slot (`0000-template`) carries no decision and is never judged.
 */
export function adrStatusFindings(
  basename: string,
  relPath: string,
  frontmatter: { status?: unknown; tags?: unknown },
  content: string,
): LintFinding[] {
  if (isTemplateSlot(basename)) return [];
  const out: LintFinding[] = [];
  const status = normalizeAdrStatus(frontmatter.status);
  if (!status) return out; // absent status → the adequacy floor's job, not a drift signal

  if (!isAdrStatus(status)) {
    const mapped = RETIRED_STATUS_MAP[status];
    const remedy = mapped
      ? `retired — it belongs to ${mapped} plus a tech-debt row; run \`arch-wiki normalize-adr-status\` (add --write to apply)`
      : `run \`arch-wiki normalize-adr-status\` to report it; pick a canonical status by hand — Core never guesses a decision's state`;
    out.push({
      rule: 'adr-status-unknown',
      severity: 'high',
      file: relPath,
      message: `ADR ${basename} has status "${status}" outside the canon (${ADR_STATUSES.join(' | ')}) — ${remedy}`,
    });
  }

  for (const [carrier, value] of [
    ['adr/<status> tag', tagStatus(frontmatter.tags)],
    ['`- **Status:**` body label', bodyStatusLabel(content)],
  ] as const) {
    if (value && value !== status) {
      out.push({
        rule: 'adr-status-inconsistent',
        severity: 'low',
        file: relPath,
        message: `ADR ${basename} states status "${status}" in frontmatter but "${value}" in its ${carrier}`,
      });
    }
  }
  return out;
}
